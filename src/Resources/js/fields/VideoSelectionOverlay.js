// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Overlay, Loader, Button} from 'sulu-admin-bundle/components';
import FolderList from 'sulu-admin-bundle/components/FolderList';
import {translate} from 'sulu-admin-bundle/utils';
import {getLibraries, getAllVideos, initiateUpload, uploadParts, completeUpload, ingestVideoUrl, pollVideo, posterFor, bustCache} from '../services/api';
import VideoDetail from '../components/VideoDetail';

@observer
class VideoSelectionOverlay extends React.Component<*> {
    @observable tab = 'select';
    @observable loading = true;
    @observable libraries = [];
    // null = show videos from every library; a library id = filter to that library.
    @observable activeLibraryId = null;
    @observable videos = [];
    @observable uploading = false;
    @observable uploadStatus = null;
    @observable ingestSourceUrl = '';
    @observable ingestTitle = '';
    @observable ingesting = false;
    @observable ingestStatus = null;
    @observable error = null;
    @observable search = '';
    @observable readyOnly = false;
    @observable managing = null;

    componentDidMount() {
        this.load();
    }

    componentDidUpdate(prevProps: *) {
        if (this.props.open && !prevProps.open) {
            this.closeManage();
            this.load();
        }
    }

    load() {
        this.setLoading(true);
        Promise.all([getLibraries(), getAllVideos()])
            .then(action(([libraries, videos]) => {
                this.libraries = libraries;
                this.videos = videos;
                this.loading = false;
                const preferred = this.props.defaultLibraryId;
                // Preselect the preferred library folder when it exists; otherwise start on "all".
                this.activeLibraryId = (preferred && libraries.find((l) => l.id === preferred)) ? preferred : null;
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
    };

    @action showAll = () => {
        this.activeLibraryId = null;
        this.managing = null;
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

        return this.videos
            .filter((video) => !this.activeLibraryId || video.library_id === this.activeLibraryId)
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
        this.videos = this.videos.map((v) => (v.uuid === video.uuid ? video : v));
    };

    @action afterDelete = () => {
        const id = this.managing.uuid;
        this.managing = null;
        this.videos = this.videos.filter((v) => v.uuid !== id);
    };

    handleFileChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        if (!file || !this.activeLibraryId) {
            return;
        }

        this.startUpload(file);
    };

    @action startUpload = (file) => {
        this.uploading = true;
        this.error = null;
        this.uploadStatus = translate('scale_videooptimizer.uploading');

        initiateUpload({
            libraryId: this.activeLibraryId,
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            fileSize: file.size,
        })
            .then((upload) => uploadParts(file, upload.parts || [], upload.partSize)
                .then((parts) => completeUpload({
                    libraryId: this.activeLibraryId,
                    uuid: upload.uuid,
                    key: upload.key,
                    uploadId: upload.uploadId,
                    title: file.name,
                    parts,
                }))
                .then(action(() => {
                    this.uploadStatus = translate('scale_videooptimizer.processing');
                }))
                .then(() => pollVideo(upload.uuid, (v) => v.status === 'ready' || v.status === 'failed'))
                .then(action((video) => {
                    this.uploading = false;
                    this.uploadStatus = null;
                    if (video.status === 'failed') {
                        this.error = translate('scale_videooptimizer.test_failed', {message: 'processing failed'});
                        return;
                    }
                    this.chooseVideo(video);
                })))
            .catch(action((e) => {
                this.uploading = false;
                this.uploadStatus = null;
                this.error = e.message || String(e);
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
                        this.error = translate('scale_videooptimizer.test_failed', {message: 'processing failed'});
                        return;
                    }
                    this.ingestSourceUrl = '';
                    this.ingestTitle = '';
                    this.chooseVideo(video);
                })))
            .catch(action((e) => {
                this.ingesting = false;
                this.ingestStatus = null;
                this.error = e.message || String(e);
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
                    <label className="vo-check">
                        <input type="checkbox" checked={this.readyOnly} onChange={this.toggleReadyOnly} />
                        {translate('scale_videooptimizer.ready_only')}
                    </label>
                </div>
                {videos.length === 0
                    ? <div className="vo-empty">{translate('scale_videooptimizer.no_matches')}</div>
                    : <div className="vo-video-grid">
                        {videos.map((video) => {
                            const poster = posterFor(video);
                            const ready = video.status === 'ready';

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
                                        <span className={'vo-video-status vo-video-status--' + (ready ? 'ready' : 'processing')}>
                                            {ready ? '' : translate('scale_videooptimizer.processing')}
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
                {this.uploadStatus && <div className="vo-upload-status">{this.uploadStatus}</div>}

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
