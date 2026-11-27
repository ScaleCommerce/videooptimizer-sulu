// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Button, Loader} from 'sulu-admin-bundle/components';
import FolderList from 'sulu-admin-bundle/components/FolderList';
import {withToolbar} from 'sulu-admin-bundle/containers';
import {translate} from 'sulu-admin-bundle/utils';
import {
    getLibraries,
    getTags,
    getVideoPage,
    initiateUpload,
    uploadParts,
    isAbortError,
    abortError,
    completeUpload,
    ingestVideoUrl,
    failureMessage,
    errorText,
    pollVideo,
    posterFor,
    bustCache,
} from '../services/api';
import VideoDetail from '../components/VideoDetail';
import VideoPager from '../services/VideoPager';
import UploadProgress from '../components/UploadProgress';
import TagFilter from '../components/TagFilter';

@observer
class Videos extends React.Component<*> {
    @observable loading = true;
    @observable loadingVideos = false;
    @observable loadingMore = false;
    @observable hasMore = false;
    @observable tags = [];
    @observable activeTag = '';
    @observable libraries = [];
    // null = show videos from every library; a library id = filter to that library.
    @observable activeLibraryId = null;
    @observable videos = [];
    @observable selected = null;
    @observable error = null;
    @observable uploading = false;
    @observable uploadStatus = null;
    @observable uploadPercent = null;
    @observable uploadCancellable = false;
    @observable ingestSourceUrl = '';
    @observable ingestTitle = '';
    @observable ingesting = false;
    @observable ingestStatus = null;

    // Hidden file input driven by the toolbar "upload" button (Sulu media pattern).
    fileInputRef = React.createRef();

    // Aborts a running browser upload when the view is left (it must not create a video afterwards).
    uploadController = null;

    componentWillUnmount() {
        if (this.uploadController) {
            this.uploadController.abort();
            this.uploadController = null;
        }
    }

    // Pages the video list with the API cursor; the loaded pages survive edits, deletions and uploads.
    pager = new VideoPager(getVideoPage, action((state) => {
        this.videos = state.items;
        this.hasMore = state.hasMore;
        this.loadingVideos = state.loading;
        this.loadingMore = state.loadingMore;
        if (state.error) {
            this.error = 428 === state.error.status
                ? translate('scale_videooptimizer.not_configured')
                : (state.error.message || String(state.error));
        }
    }));

    componentDidMount() {
        getLibraries()
            .then(action((libraries) => {
                this.libraries = libraries;
                this.loading = false;
                this.pager.load(this.filters());
                // Tags only feed the filter: without them the list still works.
                getTags().then(action((tags) => { this.tags = tags; })).catch(() => {});
            }))
            .catch(action((e) => {
                this.loading = false;
                this.error = 428 === e.status
                    ? translate('scale_videooptimizer.not_configured')
                    : (e.message || String(e));
            }));
    }

    filters() {
        return {libraryId: this.activeLibraryId, tags: this.activeTag || null};
    }

    @action selectLibrary = (id) => {
        this.activeLibraryId = id;
        this.selected = null;
        this.error = null;
        this.pager.load(this.filters());
    };

    @action showAll = () => {
        this.activeLibraryId = null;
        this.selected = null;
        this.error = null;
        this.pager.load(this.filters());
    };

    @action selectTag = (tag) => {
        this.activeTag = tag;
        this.error = null;
        this.pager.load(this.filters());
    };

    @action loadMore = () => {
        this.pager.loadMore();
    };

    activeLibrary() {
        return this.libraries.find((l) => l.id === this.activeLibraryId) || null;
    }

    @action open = (video) => { this.selected = video; };
    @action back = () => { this.selected = null; };
    @action onChanged = (video) => { this.selected = video; this.pager.replace(video); };
    @action onDeleted = () => { const id = this.selected.uuid; this.selected = null; this.pager.remove(id); };

    // Opens the native file dialog from the toolbar button (a real user gesture, so allowed).
    triggerFileDialog = () => {
        if (this.fileInputRef.current) {
            this.fileInputRef.current.click();
        }
    };

    handleFileChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        if (!file || !this.activeLibraryId) {
            return;
        }
        // Reset the input so re-picking the same file fires change again after an error/retry.
        event.target.value = '';
        this.startUpload(file);
    };

    // Presigned multipart upload: token stays server-side, parts go straight to storage, then we
    // poll until processing finishes. Mirrors the field-overlay upload flow.
    @action startUpload = (file: File) => {
        const libraryId = this.activeLibraryId;
        const controller = new AbortController();
        this.uploadController = controller;
        this.uploading = true;
        this.error = null;
        this.uploadStatus = translate('scale_videooptimizer.uploading');
        this.uploadPercent = 0;
        this.uploadCancellable = true;

        initiateUpload({
            libraryId,
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
                        libraryId,
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
                    this.pager.prepend(video);
                    this.open(video);
                })))
            .catch(action((e) => {
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

    // Cancel button: stops the running part upload. Nothing is created in VideoOptimizer, and storage
    // discards the incomplete multipart upload on its own (the API has no abort endpoint).
    @action cancelUpload = () => {
        if (!this.uploadController) {
            return;
        }
        this.uploadController.abort();
        this.uploadController = null;
        this.uploading = false;
        this.uploadStatus = null;
        this.uploadPercent = null;
        this.uploadCancellable = false;
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
                    this.pager.prepend(video);
                })))
            .catch(action((e) => {
                this.ingesting = false;
                this.ingestStatus = null;
                this.error = errorText(e);
            }));
    };

    renderFolders() {
        if (this.libraries.length === 0) {
            return null;
        }

        return (
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
        );
    }

    renderVideoGrid() {
        const videos = this.videos;

        if (videos.length === 0) {
            return <div className="vo-empty">{translate('scale_videooptimizer.no_videos_anywhere')}</div>;
        }

        return (
            <React.Fragment>
                <div className="vo-video-grid">
                    {videos.map((video) => (
                        <button key={video.uuid} type="button" className="vo-video" onClick={() => this.open(video)}>
                            {posterFor(video) ? <img src={bustCache(posterFor(video))} alt="" /> : <span className="vo-video-ph">▶</span>}
                            <span className="vo-video-title">{video.title || video.uuid}</span>
                        </button>
                    ))}
                </div>
                {this.hasMore && (
                    <div className="vo-load-more">
                        <Button skin="secondary" onClick={this.loadMore} loading={this.loadingMore}>
                            {translate('scale_videooptimizer.load_more')}
                        </Button>
                    </div>
                )}
            </React.Fragment>
        );
    }

    renderIngestForm() {
        return (
            <React.Fragment>
                <label className="vo-label">{translate('scale_videooptimizer.ingest_from_url')}</label>
                <div className="vo-actions" style={{marginTop: 0, flexWrap: 'wrap'}}>
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
            </React.Fragment>
        );
    }

    render() {
        if (this.loading) {
            return <div className="vo-page vo-page--wide"><Loader /></div>;
        }

        const activeLibrary = this.activeLibrary();

        return (
            <div className="vo-page vo-page--wide">
                {/* Hidden input driven by the toolbar upload button. */}
                <input
                    ref={this.fileInputRef}
                    type="file"
                    accept="video/*"
                    style={{display: 'none'}}
                    onChange={this.handleFileChange}
                />
                {this.selected ? (
                    <React.Fragment>
                        <button type="button" className="vo-back" onClick={this.back}>← {translate('scale_videooptimizer.back')}</button>
                        <VideoDetail video={this.selected} onChanged={this.onChanged} onDeleted={this.onDeleted} />
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        {this.renderFolders()}

                        <div className="vo-list-header">
                            <h1>{activeLibrary ? activeLibrary.name : translate('scale_videooptimizer.videos_nav')}</h1>
                            {activeLibrary && (
                                <button type="button" className="vo-back" onClick={this.showAll}>
                                    ← {translate('scale_videooptimizer.show_all')}
                                </button>
                            )}
                        </div>

                        <UploadProgress status={this.uploadStatus} percent={this.uploadPercent} onCancel={this.uploadCancellable ? this.cancelUpload : null} />

                        {activeLibrary && this.renderIngestForm()}

                        <TagFilter tags={this.tags} value={this.activeTag} onChange={this.selectTag} />

                        {this.loadingVideos ? <Loader /> : this.renderVideoGrid()}
                    </React.Fragment>
                )}

                {this.error && <div className="vo-message vo-message--error">{this.error}</div>}
            </div>
        );
    }
}

// Adds the Sulu-style "upload file" button to the top view toolbar. It's enabled only inside a
// library (an upload needs a target) and not while viewing a single video's detail.
export default withToolbar(Videos, function() {
    return {
        items: [
            {
                type: 'button',
                label: translate('scale_videooptimizer.upload_file'),
                icon: 'su-upload',
                loading: this.uploading,
                disabled: !this.activeLibraryId || !!this.selected,
                onClick: this.triggerFileDialog,
            },
        ],
    };
});
