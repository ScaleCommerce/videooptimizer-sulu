// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Overlay, Loader, Button} from 'sulu-admin-bundle/components';
import FolderList from 'sulu-admin-bundle/components/FolderList';
import {translate} from 'sulu-admin-bundle/utils';
import {getLibraries, getTags, getVideoPage, initiateUpload, uploadParts, completeUpload, isAbortError, abortError, ingestVideoUrl, pollVideo, posterFor, bustCache, failureMessage, errorText} from '../services/api';
import VideoDetail from '../components/VideoDetail';
import VideoPager from '../services/VideoPager';
import UploadProgress from '../components/UploadProgress';
import TagFilter from '../components/TagFilter';

@observer
class VideoSelectionOverlay extends React.Component<*> {
    @observable tab = 'select';
    @observable loading = true;
    @observable libraries = [];
    // null = show videos from every library; a library id = filter to that library.
    @observable activeLibraryId = null;
    @observable videos = [];
    @observable hasMore = false;
    @observable tags = [];
    @observable activeTag = '';
    @observable loadingMore = false;
    @observable loadingVideos = false;
    @observable uploading = false;
    @observable uploadStatus = null;
    @observable uploadPercent = null;
    @observable uploadCancellable = false;
    @observable ingestSourceUrl = '';
    @observable ingestTitle = '';
    @observable ingesting = false;
    @observable ingestStatus = null;
    @observable error = null;
    @observable search = '';
    @observable readyOnly = false;
    @observable managing = null;

    // Pages the video list with the API cursor; loaded pages survive edits, deletions and uploads.
    pager = new VideoPager(getVideoPage, action((state) => {
        this.videos = state.items;
        this.hasMore = state.hasMore;
        this.loadingMore = state.loadingMore;
        this.loadingVideos = state.loading;
        if (state.error) {
            this.error = state.error.message || String(state.error);
        }
    }));

    componentDidMount() {
        this.load();
    }

    // Aborts a running browser upload (closing the overlay or unmounting must not create a video).
    uploadController = null;

    componentWillUnmount() {
        this.abortUpload();
    }

    @action abortUpload() {
        if (this.uploadController) {
            this.uploadController.abort();
            this.uploadController = null;
            this.uploading = false;
            this.uploadStatus = null;
            this.uploadPercent = null;
            this.uploadCancellable = false;
        }
    }

    // Cancel button of the upload tab (same effect as closing the overlay).
    @action cancelUpload = () => {
        this.abortUpload();
    };

    componentDidUpdate(prevProps: *) {
        if (!this.props.open && prevProps.open) {
            this.abortUpload();
        }
        if (this.props.open && !prevProps.open) {
            this.closeManage();
            this.load();
        }
    }

    load() {
        this.setLoading(true);
        getLibraries()
            .then(action((libraries) => {
                this.libraries = libraries;
                this.loading = false;
                const preferred = this.props.defaultLibraryId;
                // Preselect the preferred library folder when it exists; otherwise start on "all".
                this.activeLibraryId = (preferred && libraries.find((l) => l.id === preferred)) ? preferred : null;
                this.pager.load(this.filters());
                // Tags only feed the filter: without them the list still works.
                getTags().then(action((tags) => { this.tags = tags; })).catch(() => {});
            }))
            .catch(action((e) => {
                this.loading = false;
                this.error = e.message || String(e);
            }));
    }

    @action setLoading = (value) => {
        this.loading = value;
        this.error = null;
    };

    @action selectLibrary = (id) => {
        this.activeLibraryId = id;
        this.search = '';
        this.readyOnly = false;
        this.managing = null;
        this.error = null;
        this.pager.load(this.filters());
    };

    @action showAll = () => {
        this.activeLibraryId = null;
        this.managing = null;
        this.error = null;
        this.pager.load(this.filters());
    };

    @action selectTag = (tag) => {
        this.activeTag = tag;
        this.error = null;
        this.pager.load(this.filters());
    };

    filters() {
        return {libraryId: this.activeLibraryId, tags: this.activeTag || null};
    }

    @action loadMore = () => {
        this.pager.loadMore();
    };

    activeLibrary() {
        return this.libraries.find((l) => l.id === this.activeLibraryId) || null;
    }

    @action setTab = (tab) => {
        this.tab = tab;
    };

    @action handleSearch = (event) => {
        this.search = event.target.value;
    };

    @action toggleReadyOnly = () => {
        this.readyOnly = !this.readyOnly;
    };

    filteredVideos() {
        const term = this.search.trim().toLowerCase();

        // The library is filtered by the API; "ready only" and the title search only see the loaded pages.
        return this.videos
            .filter((video) => !this.readyOnly || video.status === 'ready')
            .filter((video) => term === '' || (video.title || '').toLowerCase().indexOf(term) !== -1)
            // Show pickable (ready) videos first; the preceding filters already return a fresh array
            // and Array.sort is stable, so API order is preserved within each group.
            .sort((a, b) => (a.status === 'ready' ? 0 : 1) - (b.status === 'ready' ? 0 : 1));
    }

    chooseVideo = (video: Object) => {
        this.props.onSelect({
            uuid: video.uuid,
            libraryId: video.library_id || this.activeLibraryId,
            title: video.title || '',
            posterUrl: posterFor(video) || null,
        });
        this.props.onClose();
    };

    @action manage = (video) => {
        this.managing = video;
    };

    @action closeManage = () => {
        this.managing = null;
    };

    @action updateManaged = (video) => {
        this.managing = video;
        this.pager.replace(video);
    };

    @action afterDelete = () => {
        const id = this.managing.uuid;
        this.managing = null;
        this.pager.remove(id);
    };

    handleFileChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        if (!file || !this.activeLibraryId) {
            return;
        }

        this.startUpload(file);
    };

    @action startUpload = (file) => {
        this.abortUpload();
        const controller = new AbortController();
        this.uploadController = controller;
        this.uploading = true;
        this.error = null;
        this.uploadStatus = translate('scale_videooptimizer.uploading');
        this.uploadPercent = 0;
        this.uploadCancellable = true;

        initiateUpload({
            libraryId: this.activeLibraryId,
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            fileSize: file.size,
        })
            .then((upload) => uploadParts(file, upload.parts || [], upload.partSize, controller.signal, action((done, total) => {
                if (this.uploadController === controller) {
                    this.uploadPercent = Math.round(done / total * 100);
                }
            }))
                .then((parts) => {
                    if (controller.signal.aborted) {
                        throw abortError();
                    }

                    return completeUpload({
                        libraryId: this.activeLibraryId,
                        uuid: upload.uuid,
                        key: upload.key,
                        uploadId: upload.uploadId,
                        title: file.name,
                        parts,
                    });
                })
                .then(action(() => {
                    if (this.uploadController !== controller) {
                        throw abortError();
                    }
                    this.uploadStatus = translate('scale_videooptimizer.processing');
                    this.uploadPercent = null;
                    this.uploadCancellable = false;
                }))
                .then(() => pollVideo(upload.uuid, (v) => v.status === 'ready' || v.status === 'failed', {signal: controller.signal}))
                .then(action((video) => {
                    if (this.uploadController !== controller) {
                        return;
                    }
                    this.uploadController = null;
                    this.uploading = false;
                    this.uploadStatus = null;
                    this.uploadPercent = null;
                    this.uploadCancellable = false;
                    if (video.status === 'failed') {
                        this.error = failureMessage(video);
                        return;
                    }
                    this.chooseVideo(video);
                })))
            .catch(action((e) => {
                // Superseded, aborted or unmounted: a newer upload or the closed view owns the state.
                if (this.uploadController !== controller || isAbortError(e)) {
                    return;
                }
                this.uploadController = null;
                this.uploading = false;
                this.uploadStatus = null;
                this.uploadPercent = null;
                this.uploadCancellable = false;
                this.error = errorText(e);
            }));
    };

    @action handleIngestUrlChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.ingestSourceUrl = event.target.value;
    };

    @action handleIngestTitleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.ingestTitle = event.target.value;
    };

    @action startIngest = () => {
        if (!this.ingestSourceUrl.trim() || !this.activeLibraryId) {
            return;
        }
        this.ingesting = true;
        this.error = null;
        this.ingestStatus = translate('scale_videooptimizer.processing');

        ingestVideoUrl({
            library_id: this.activeLibraryId,
            source_url: this.ingestSourceUrl.trim(),
            title: this.ingestTitle.trim() || undefined,
        })
            .then((result) => pollVideo(result.uuid, (v) => v.status === 'ready' || v.status === 'failed')
                .then(action((video) => {
                    this.ingesting = false;
                    this.ingestStatus = null;
                    if (video.status === 'failed') {
                        this.error = failureMessage(video);
                        return;
                    }
                    this.ingestSourceUrl = '';
                    this.ingestTitle = '';
                    this.chooseVideo(video);
                })))
            .catch(action((e) => {
                this.ingesting = false;
                this.ingestStatus = null;
                this.error = errorText(e);
            }));
    };

    renderFolders() {
        const activeLibrary = this.activeLibrary();

        return (
            <React.Fragment>
                <FolderList onFolderClick={this.selectLibrary}>
                    {this.libraries.map((library) => (
                        <FolderList.Folder
                            key={library.id}
                            id={library.id}
                            title={library.name}
                            info={translate('scale_videooptimizer.library_videos_count', {count: library.video_count || 0})}
                        />
                    ))}
                </FolderList>
                <div className="vo-list-header">
                    <h5>{activeLibrary ? activeLibrary.name : translate('scale_videooptimizer.all_videos')}</h5>
                    {activeLibrary && (
                        <button type="button" className="vo-back" onClick={this.showAll}>
                            ← {translate('scale_videooptimizer.show_all')}
                        </button>
                    )}
                </div>
            </React.Fragment>
        );
    }

    renderSelectTab() {
        if (this.managing) {
            return (
                <div className="vo-manage">
                    <button type="button" className="vo-back" onClick={this.closeManage}>
                        {translate('scale_videooptimizer.back')}
                    </button>
                    <VideoDetail
                        video={this.managing}
                        onChanged={this.updateManaged}
                        onDeleted={this.afterDelete}
                        onUse={this.chooseVideo}
                        locale={this.props.locale}
                    />
                </div>
            );
        }

        const videos = this.filteredVideos();

        return (
            <React.Fragment>
                <div className="vo-video-filter">
                    <input
                        type="search"
                        className="vo-search"
                        placeholder={translate('scale_videooptimizer.search_videos')}
                        value={this.search}
                        onChange={this.handleSearch}
                    />
                    <TagFilter tags={this.tags} value={this.activeTag} onChange={this.selectTag} />
                    <label className="vo-check">
                        <input type="checkbox" checked={this.readyOnly} onChange={this.toggleReadyOnly} />
                        {translate('scale_videooptimizer.ready_only')}
                    </label>
                </div>
                {this.loadingVideos ? <Loader /> : videos.length === 0
                    ? <div className="vo-empty">{translate('scale_videooptimizer.no_matches')}</div>
                    : <div className="vo-video-grid">
                        {videos.map((video) => {
                            const poster = posterFor(video);
                            const ready = video.status === 'ready';
                            const failed = video.status === 'failed';

                            return (
                                <div key={video.uuid} className="vo-video-item">
                                    <button
                                        type="button"
                                        className="vo-video"
                                        disabled={!ready}
                                        onClick={ready ? () => this.chooseVideo(video) : undefined}
                                    >
                                        {poster
                                            ? <img src={bustCache(poster)} alt={video.title || ''} />
                                            : <span className="vo-video-ph">▶</span>}
                                        <span className="vo-video-title">{video.title || video.uuid}</span>
                                        <span
                                            className={'vo-video-status vo-video-status--' + (ready ? 'ready' : (failed ? 'failed' : 'processing'))}
                                            title={failed && video.error ? String(video.error) : undefined}
                                        >
                                            {ready ? '' : translate(failed ? 'scale_videooptimizer.status_failed' : 'scale_videooptimizer.processing')}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className="vo-video-manage"
                                        title={translate('scale_videooptimizer.manage')}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            this.manage(video);
                                        }}
                                    >
                                        ⚙
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                }
                {this.hasMore && !this.loadingVideos && (
                    <div className="vo-load-more">
                        <Button skin="secondary" onClick={this.loadMore} loading={this.loadingMore}>
                            {translate('scale_videooptimizer.load_more')}
                        </Button>
                    </div>
                )}
            </React.Fragment>
        );
    }

    renderUploadTab() {
        // Upload and URL ingest need a target library — only available once a folder is selected.
        if (!this.activeLibraryId) {
            return <div className="vo-hint">{translate('scale_videooptimizer.select_library_hint')}</div>;
        }

        return (
            <div className="vo-uploader">
                <p className="vo-hint">{translate('scale_videooptimizer.upload_hint')}</p>
                <input type="file" accept="video/*" disabled={this.uploading} onChange={this.handleFileChange} />
                <UploadProgress status={this.uploadStatus} percent={this.uploadPercent} onCancel={this.uploadCancellable ? this.cancelUpload : null} />

                <label className="vo-label">{translate('scale_videooptimizer.ingest_from_url')}</label>
                <input
                    type="url"
                    className="vo-input"
                    placeholder={translate('scale_videooptimizer.source_url')}
                    value={this.ingestSourceUrl}
                    disabled={this.ingesting}
                    onChange={this.handleIngestUrlChange}
                />
                <input
                    type="text"
                    className="vo-input"
                    placeholder={translate('sulu_admin.title')}
                    value={this.ingestTitle}
                    disabled={this.ingesting}
                    onChange={this.handleIngestTitleChange}
                />
                <div className="vo-actions">
                    <Button
                        skin="secondary"
                        onClick={this.startIngest}
                        loading={this.ingesting}
                        disabled={!this.ingestSourceUrl.trim()}
                    >
                        {translate('scale_videooptimizer.ingest')}
                    </Button>
                </div>
                <div className="vo-hint" style={{padding: '4px 0 0'}}>{translate('scale_videooptimizer.ingest_url_help')}</div>
                {this.ingestStatus && <div className="vo-upload-status">{this.ingestStatus}</div>}
            </div>
        );
    }

    render() {
        const {open, onClose} = this.props;

        return (
            <Overlay
                open={open}
                onClose={onClose}
                title={translate('scale_videooptimizer.select_video')}
                actions={[{title: translate('sulu_admin.cancel'), onClick: onClose}]}
                size="large"
            >
                <div className="vo-overlay">
                    {this.loading ? <Loader /> : (
                        <React.Fragment>
                            <div className="vo-tabs">
                                <button
                                    type="button"
                                    className={'vo-tab ' + (this.tab === 'select' ? 'vo-tab--active' : '')}
                                    onClick={() => this.setTab('select')}
                                >
                                    {translate('scale_videooptimizer.tab_select')}
                                </button>
                                <button
                                    type="button"
                                    className={'vo-tab ' + (this.tab === 'upload' ? 'vo-tab--active' : '')}
                                    onClick={() => this.setTab('upload')}
                                >
                                    {translate('scale_videooptimizer.tab_upload')}
                                </button>
                            </div>

                            {this.libraries.length === 0
                                ? <div className="vo-empty">{translate('scale_videooptimizer.not_configured')}</div>
                                : (
                                    <React.Fragment>
                                        {this.renderFolders()}
                                        {this.tab === 'select' ? this.renderSelectTab() : this.renderUploadTab()}
                                    </React.Fragment>
                                )}

                            {this.error && <div className="vo-message vo-message--error">{this.error}</div>}
                        </React.Fragment>
                    )}
                </div>
            </Overlay>
        );
    }
}

export default VideoSelectionOverlay;
