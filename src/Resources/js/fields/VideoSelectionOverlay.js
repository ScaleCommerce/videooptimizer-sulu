// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Overlay, Loader, Button} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';
import {getLibraries, getVideos, initiateUpload, uploadParts, completeUpload, pollVideo, posterFor} from '../services/api';
import VideoDetail from '../components/VideoDetail';

@observer
class VideoSelectionOverlay extends React.Component<*> {
    @observable tab = 'select';
    @observable loadingLibraries = true;
    @observable libraries = [];
    @observable libraryId = '';
    @observable loadingVideos = false;
    @observable videos = [];
    @observable uploading = false;
    @observable uploadStatus = null;
    @observable error = null;
    @observable search = '';
    @observable readyOnly = false;
    @observable managing = null;

    componentDidMount() {
        this.loadLibraries();
    }

    componentDidUpdate(prevProps: *) {
        if (this.props.open && !prevProps.open) {
            this.closeManage();
            this.loadLibraries();
        }
    }

    loadLibraries() {
        this.setLoadingLibraries(true);
        getLibraries()
            .then(action((libraries) => {
                this.libraries = libraries;
                this.loadingLibraries = false;
                const preferred = this.props.defaultLibraryId;
                const initial = (preferred && libraries.find((l) => l.id === preferred))
                    ? preferred
                    : (libraries[0] ? libraries[0].id : '');
                if (initial) {
                    this.selectLibrary(initial);
                }
            }))
            .catch(action((e) => {
                this.loadingLibraries = false;
                this.error = e.message || String(e);
            }));
    }

    @action setLoadingLibraries = (value) => {
        this.loadingLibraries = value;
        this.error = null;
    };

    @action selectLibrary = (id) => {
        this.libraryId = id;
        this.videos = [];
        // Reset the filter so a switched/reopened library starts from a clean list.
        this.search = '';
        this.readyOnly = false;
        this.managing = null;
        if (!id) {
            return;
        }
        this.loadingVideos = true;
        getVideos(id)
            .then(action((videos) => {
                this.videos = videos;
                this.loadingVideos = false;
            }))
            .catch(action((e) => {
                this.loadingVideos = false;
                this.error = e.message || String(e);
            }));
    };

    handleLibraryChange = (event: SyntheticInputEvent<HTMLSelectElement>) => {
        this.selectLibrary(event.target.value);
    };

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
            .filter((video) => !this.readyOnly || video.status === 'ready')
            .filter((video) => term === '' || (video.title || '').toLowerCase().indexOf(term) !== -1)
            // Show pickable (ready) videos first; the preceding filters already return a fresh array
            // and Array.sort is stable, so API order is preserved within each group.
            .sort((a, b) => (a.status === 'ready' ? 0 : 1) - (b.status === 'ready' ? 0 : 1));
    }

    chooseVideo = (video: Object) => {
        this.props.onSelect({
            uuid: video.uuid,
            libraryId: this.libraryId,
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
        if (!file || !this.libraryId) {
            return;
        }

        this.startUpload(file);
    };

    @action startUpload = (file) => {
        this.uploading = true;
        this.error = null;
        this.uploadStatus = translate('scale_videooptimizer.uploading');

        initiateUpload({
            libraryId: this.libraryId,
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            fileSize: file.size,
        })
            .then((upload) => uploadParts(file, upload.parts || [], upload.partSize)
                .then((parts) => completeUpload({
                    libraryId: this.libraryId,
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

    renderLibrarySelect() {
        return (
            <select className="vo-select" value={this.libraryId} onChange={this.handleLibraryChange}>
                {this.libraries.length === 0 && <option value="">—</option>}
                {this.libraries.map((library) => (
                    <option key={library.id} value={library.id}>{library.name}</option>
                ))}
            </select>
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

        if (this.loadingVideos) {
            return <Loader />;
        }
        if (this.videos.length === 0) {
            return <div className="vo-empty">{translate('scale_videooptimizer.no_videos')}</div>;
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
                                            ? <img src={poster} alt={video.title || ''} />
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
        return (
            <div className="vo-uploader">
                <p className="vo-hint">{translate('scale_videooptimizer.upload_hint')}</p>
                <input type="file" accept="video/*" disabled={this.uploading || !this.libraryId} onChange={this.handleFileChange} />
                {this.uploadStatus && <div className="vo-upload-status">{this.uploadStatus}</div>}
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
                    {this.loadingLibraries ? <Loader /> : (
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
                                        <label className="vo-label">{translate('scale_videooptimizer.choose_library')}</label>
                                        {this.renderLibrarySelect()}
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
