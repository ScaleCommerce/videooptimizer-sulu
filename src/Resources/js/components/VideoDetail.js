// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Button, Dialog} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';
import {
    updateVideo, deleteVideo, getThumbnails, selectThumbnail,
    initiatePosterUpload, uploadPoster, completePosterUpload, selectPoster, deletePoster,
    pollVideo, posterFor,
} from '../services/api';

@observer
class VideoDetail extends React.Component<*> {
    @observable video = this.props.video;
    @observable thumbnails = [];
    @observable title = this.props.video.title || '';
    @observable options = {...(this.props.video.options || {})};
    @observable busy = null; // null | 'save' | 'thumb' | 'poster' | 'delete'
    @observable status = null;
    @observable error = null;
    @observable confirmDelete = false;

    // Plain (non-observable) flag — guards async continuations after unmount, no @action needed.
    _unmounted = false;

    componentDidMount() {
        this.loadThumbnails();
    }

    componentWillUnmount() {
        this._unmounted = true;
    }

    loadThumbnails() {
        getThumbnails(this.video.uuid)
            .then(action((thumbnails) => {
                if (this._unmounted) { return; }
                this.thumbnails = thumbnails;
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.error = e.message || String(e);
            }));
    }

    @action refresh = (video) => {
        this.video = video;
        if (this.props.onChanged) {
            this.props.onChanged(video);
        }
    };

    @action handleTitleChange = (event) => { this.title = event.target.value; };

    @action toggleOption = (key) => { this.options = {...this.options, [key]: !this.options[key]}; };

    @action save = () => {
        this.busy = 'save';
        this.error = null;
        updateVideo(this.video.uuid, {title: this.title, option: this.options})
            .then(action((video) => {
                if (this._unmounted) { return; }
                this.busy = null;
                this.refresh(video);
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.busy = null;
                this.error = e.message || String(e);
            }));
    };

    @action pickThumbnail = (index) => {
        this.busy = 'thumb';
        this.error = null;
        selectThumbnail(this.video.uuid, index)
            .then(() => pollVideo(this.video.uuid, (v) => (v.poster && v.poster.source) === 'thumbnail'))
            .then(action((video) => {
                if (this._unmounted) { return; }
                this.busy = null;
                this.refresh(video);
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.busy = null;
                this.error = e.message || String(e);
            }));
    };

    @action handlePosterFile = (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }
        this.busy = 'poster';
        this.error = null;
        this.status = translate('scale_videooptimizer.uploading');
        initiatePosterUpload(this.video.uuid, {contentType: file.type, fileSize: file.size})
            .then((data) => uploadPoster(data.uploadUrl, file).then(() => completePosterUpload(this.video.uuid, data.key)))
            .then(action(() => {
                if (this._unmounted) { return; }
                this.status = translate('scale_videooptimizer.processing');
            }))
            .then(() => pollVideo(this.video.uuid, (v) => (v.poster && v.poster.custom_status) === 'ready'
                || (v.poster && v.poster.custom_status) === 'failed'))
            .then((video) => {
                if (video.poster && video.poster.custom_status === 'failed') {
                    throw new Error(translate('scale_videooptimizer.poster_failed'));
                }
                return selectPoster(this.video.uuid, {source: 'custom'});
            })
            .then(() => pollVideo(this.video.uuid, (v) => (v.poster && v.poster.source) === 'custom'))
            .then(action((video) => {
                if (this._unmounted) { return; }
                this.busy = null;
                this.status = null;
                this.refresh(video);
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.busy = null;
                this.status = null;
                this.error = e.message || String(e);
            }));
    };

    @action removeCustomPoster = () => {
        this.busy = 'poster';
        this.error = null;
        deletePoster(this.video.uuid)
            .then(() => pollVideo(this.video.uuid, (v) => (v.poster && v.poster.source) !== 'custom'))
            .then(action((video) => {
                if (this._unmounted) { return; }
                this.busy = null;
                this.refresh(video);
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.busy = null;
                this.error = e.message || String(e);
            }));
    };

    @action askDelete = () => { this.confirmDelete = true; };
    @action cancelDelete = () => { this.confirmDelete = false; };

    @action doDelete = () => {
        this.busy = 'delete';
        deleteVideo(this.video.uuid)
            .then(action(() => {
                if (this._unmounted) { return; }
                this.busy = null;
                this.confirmDelete = false;
                if (this.props.onDeleted) { this.props.onDeleted(); }
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.busy = null;
                this.confirmDelete = false;
                this.error = e.message || String(e);
            }));
    };

    render() {
        const poster = posterFor(this.video);
        const source = this.video.poster && this.video.poster.source;
        const customStatus = this.video.poster && this.video.poster.custom_status;
        const OPTION_KEYS = ['responsive', 'autoplay', 'preload', 'loop', 'muted'];

        return (
            <div className="vo-detail">
                <div className="vo-detail__poster">
                    {poster ? <img src={poster} alt="" /> : <span className="vo-video-ph">▶</span>}
                    {source && <span className="vo-badge">{translate('scale_videooptimizer.poster_source_' + source)}</span>}
                </div>

                <label className="vo-label">{translate('scale_videooptimizer.thumbnails')}</label>
                <div className="vo-thumbs">
                    {this.thumbnails.map((t) => (
                        <button key={t.index} type="button" className="vo-thumb" disabled={this.busy === 'thumb'}
                            onClick={() => this.pickThumbnail(t.index)}>
                            <img src={t.url} alt={'#' + t.index} />
                        </button>
                    ))}
                </div>

                <label className="vo-label">{translate('scale_videooptimizer.custom_poster')}</label>
                <div className="vo-actions" style={{marginTop: 0}}>
                    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={this.busy === 'poster'} onChange={this.handlePosterFile} />
                    {customStatus === 'ready' && source === 'custom' && (
                        <Button skin="link" onClick={this.removeCustomPoster}>{translate('scale_videooptimizer.remove_custom_poster')}</Button>
                    )}
                </div>
                {this.status && <div className="vo-upload-status">{this.status}</div>}

                <label className="vo-label">{translate('scale_videooptimizer.title')}</label>
                <input type="text" className="vo-input" value={this.title} onChange={this.handleTitleChange} />

                <label className="vo-label">{translate('scale_videooptimizer.player_options')}</label>
                <div className="vo-option-checks">
                    {OPTION_KEYS.map((key) => (
                        <label key={key} className="vo-check">
                            <input type="checkbox" checked={!!this.options[key]} onChange={() => this.toggleOption(key)} />
                            {translate('scale_videooptimizer.option_' + key)}
                        </label>
                    ))}
                </div>

                <div className="vo-actions">
                    <Button skin="primary" onClick={this.save} loading={this.busy === 'save'}>{translate('sulu_admin.save')}</Button>
                    {this.props.onUse && <Button skin="primary" onClick={() => this.props.onUse(this.video)}>{translate('scale_videooptimizer.use_video')}</Button>}
                    <Button skin="link" onClick={this.askDelete}>{translate('scale_videooptimizer.delete')}</Button>
                </div>

                {this.error && <div className="vo-message vo-message--error">{this.error}</div>}

                <Dialog open={this.confirmDelete} title={translate('scale_videooptimizer.delete')}
                    confirmText={translate('scale_videooptimizer.delete')} cancelText={translate('sulu_admin.cancel')}
                    onConfirm={this.doDelete} onCancel={this.cancelDelete} confirmLoading={this.busy === 'delete'}>
                    {translate('scale_videooptimizer.confirm_delete_video')}
                </Dialog>
            </div>
        );
    }
}

export default VideoDetail;
