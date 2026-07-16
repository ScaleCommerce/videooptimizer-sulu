// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Button, Loader} from 'sulu-admin-bundle/components';
import FolderList from 'sulu-admin-bundle/components/FolderList';
import {translate} from 'sulu-admin-bundle/utils';
import {getLibraries, getAllVideos, ingestVideoUrl, pollVideo, posterFor, bustCache} from '../services/api';
import VideoDetail from '../components/VideoDetail';

@observer
class Videos extends React.Component<*> {
    @observable loading = true;
    @observable loadingVideos = false;
    @observable libraries = [];
    // null = show videos from every library; a library id = filter to that library.
    @observable activeLibraryId = null;
    @observable videos = [];
    @observable selected = null;
    @observable error = null;
    @observable ingestSourceUrl = '';
    @observable ingestTitle = '';
    @observable ingesting = false;
    @observable ingestStatus = null;

    componentDidMount() {
        Promise.all([getLibraries(), getAllVideos()])
            .then(action(([libraries, videos]) => {
                this.libraries = libraries;
                this.videos = videos;
                this.loading = false;
            }))
            .catch(action((e) => { this.loading = false; this.error = e.message || String(e); }));
    }

    reloadVideos() {
        this.loadingVideos = true;
        getAllVideos()
            .then(action((videos) => { this.videos = videos; this.loadingVideos = false; }))
            .catch(action((e) => { this.loadingVideos = false; this.error = e.message || String(e); }));
    }

    @action selectLibrary = (id) => {
        this.activeLibraryId = id;
        this.selected = null;
    };

    @action showAll = () => {
        this.activeLibraryId = null;
        this.selected = null;
    };

    activeLibrary() {
        return this.libraries.find((l) => l.id === this.activeLibraryId) || null;
    }

    visibleVideos() {
        if (!this.activeLibraryId) {
            return this.videos;
        }

        return this.videos.filter((video) => video.library_id === this.activeLibraryId);
    }

    @action open = (video) => { this.selected = video; };
    @action back = () => { this.selected = null; };
    @action onChanged = (video) => { this.selected = video; this.videos = this.videos.map((v) => v.uuid === video.uuid ? video : v); };
    @action onDeleted = () => { const id = this.selected.uuid; this.selected = null; this.videos = this.videos.filter((v) => v.uuid !== id); };

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
                    this.reloadVideos();
                })))
            .catch(action((e) => {
                this.ingesting = false;
                this.ingestStatus = null;
                this.error = e.message || String(e);
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
        const videos = this.visibleVideos();

        if (videos.length === 0) {
            return <div className="vo-empty">{translate('scale_videooptimizer.no_videos_anywhere')}</div>;
        }

        return (
            <div className="vo-video-grid">
                {videos.map((video) => (
                    <button key={video.uuid} type="button" className="vo-video" onClick={() => this.open(video)}>
                        {posterFor(video) ? <img src={bustCache(posterFor(video))} alt="" /> : <span className="vo-video-ph">▶</span>}
                        <span className="vo-video-title">{video.title || video.uuid}</span>
                    </button>
                ))}
            </div>
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

                        {activeLibrary && this.renderIngestForm()}

                        {this.loadingVideos ? <Loader /> : this.renderVideoGrid()}
                    </React.Fragment>
                )}

                {this.error && <div className="vo-message vo-message--error">{this.error}</div>}
            </div>
        );
    }
}

export default Videos;
