// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Button, Dialog} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';
import {userStore} from 'sulu-admin-bundle/stores';
import SingleMediaSelectionOverlay from 'sulu-media-bundle/containers/SingleMediaSelectionOverlay';
import {
    updateVideo, deleteVideo, getThumbnails, selectThumbnail,
    initiatePosterUpload, uploadPoster, completePosterUpload, selectPoster, deletePoster,
    pollVideo, posterFor, bustCache, bumpCacheBust,
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
    @observable mediaOverlayOpen = false;
    @observable playing = false;

    // Locale for Sulu's media selection overlay: use the form's locale when embedded in a field,
    // otherwise fall back to the user's current content locale (standalone videos view).
    mediaLocale = this.props.locale || observable.box(userStore.contentLocale);

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

    @action play = () => { this.playing = true; };

    @action refresh = (video) => {
        // The stable poster/thumbnail CDN URLs are cached; bump the cache-buster so the preview
        // reflects the just-changed image instead of the browser's stale copy.
        bumpCacheBust();
        // Drop back to the (updated) poster so a just-changed thumbnail is visible immediately.
        this.playing = false;
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

    // Re-activates the already-uploaded custom poster (source='custom') so the editor can switch
    // back to it after picking a generated thumbnail — without re-uploading.
    @action pickCustomPoster = () => {
        this.busy = 'thumb';
        this.error = null;
        selectPoster(this.video.uuid, {source: 'custom'})
            .then(() => pollVideo(this.video.uuid, (v) => (v.poster && v.poster.source) === 'custom'))
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

    handlePosterFile = (event) => {
        const file = event.target.files && event.target.files[0];
        if (file) {
            this.uploadPosterBlob(file);
        }
    };

    @action openMediaOverlay = () => { this.mediaOverlayOpen = true; };
    @action closeMediaOverlay = () => { this.mediaOverlayOpen = false; };

    // Picks an image from the Sulu media library and uploads it as the custom poster: the browser
    // fetches the (same-origin) media file and feeds it through the presigned poster pipeline.
    @action handleMediaSelect = (media) => {
        this.mediaOverlayOpen = false;
        if (!media || !media.url) {
            return;
        }
        this.busy = 'poster';
        this.error = null;
        this.status = translate('scale_videooptimizer.uploading');
        fetch(media.url, {credentials: 'same-origin'})
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Could not load media (' + response.status + ')');
                }
                return response.blob();
            })
            .then((blob) => this.uploadPosterBlob(blob))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.busy = null;
                this.status = null;
                this.error = e.message || String(e);
            }));
    };

    // Runs the presigned custom-poster pipeline for any File/Blob and selects it as the poster.
    @action uploadPosterBlob = (blob) => {
        this.busy = 'poster';
        this.error = null;
        this.status = translate('scale_videooptimizer.uploading');
        initiatePosterUpload(this.video.uuid, {contentType: blob.type, fileSize: blob.size})
            .then((data) => uploadPoster(data.uploadUrl, blob).then(() => completePosterUpload(this.video.uuid, data.key)))
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

    // Shows the video's current poster with a play button; clicking embeds the actual VideoOptimizer
    // player. The poster is our own cache-busted <img>, so switching a thumbnail/poster is reflected
    // here immediately — unlike the embed iframe, which keeps the CDN-cached poster until played.
    // Sized to the video's own aspect ratio (so portrait reels are not letterboxed).
    renderPlayer() {
        const parts = (typeof this.video.resolution === 'string' ? this.video.resolution : '').split('x');
        const width = parseInt(parts[0], 10);
        const height = parseInt(parts[1], 10);
        const ratio = (width > 0 && height > 0) ? [width, height] : [16, 9];
        const maxWidth = Math.min(640, Math.round(400 * ratio[0] / ratio[1]));
        const poster = posterFor(this.video);

        return (
            <div className="vo-detail__player" style={{aspectRatio: ratio[0] + ' / ' + ratio[1], maxWidth: maxWidth + 'px'}}>
                {this.playing ? (
                    <iframe
                        src={(this.video.embed_url || ('https://videooptimizer.eu/embed/' + this.video.uuid)) + '?autoplay=1'}
                        title={this.video.title || 'Video'}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <button type="button" className="vo-detail__play" onClick={this.play} aria-label={translate('scale_videooptimizer.use_video')}>
                        {poster ? <img src={bustCache(poster)} alt="" /> : <span className="vo-video-ph">▶</span>}
                        <span className="vo-detail__play-icon" aria-hidden="true">▶</span>
                    </button>
                )}
            </div>
        );
    }

    render() {
        const source = this.video.poster && this.video.poster.source;
        const customStatus = this.video.poster && this.video.poster.custom_status;
        const customUrl = this.video.poster && this.video.poster.custom_url;
        const hasCustomPoster = customStatus === 'ready' && !!customUrl;
        const OPTION_KEYS = ['responsive', 'autoplay', 'preload', 'loop', 'muted'];

        return (
            <div className="vo-detail">
                {this.renderPlayer()}

                <label className="vo-label">{translate('scale_videooptimizer.thumbnails')}</label>
                <div className="vo-thumbs">
                    {hasCustomPoster && (
                        <button
                            type="button"
                            className={'vo-thumb vo-thumb--custom' + (source === 'custom' ? ' vo-thumb--active' : '')}
                            disabled={this.busy === 'thumb'}
                            title={translate('scale_videooptimizer.poster_source_custom')}
                            onClick={this.pickCustomPoster}
                        >
                            <img src={bustCache(customUrl)} alt={translate('scale_videooptimizer.poster_source_custom')} />
                            <span className="vo-thumb-badge">{translate('scale_videooptimizer.poster_source_custom')}</span>
                        </button>
                    )}
                    {this.thumbnails.map((t) => (
                        <button key={t.index} type="button" className="vo-thumb" disabled={this.busy === 'thumb'}
                            onClick={() => this.pickThumbnail(t.index)}>
                            <img src={bustCache(t.url)} alt={'#' + t.index} />
                        </button>
                    ))}
                </div>

                <label className="vo-label">{translate('scale_videooptimizer.custom_poster')}</label>
                <div className="vo-actions" style={{marginTop: 0, alignItems: 'center'}}>
                    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={this.busy === 'poster'} onChange={this.handlePosterFile} />
                    <Button skin="secondary" onClick={this.openMediaOverlay} disabled={this.busy === 'poster'}>
                        {translate('scale_videooptimizer.choose_from_media')}
                    </Button>
                    {hasCustomPoster && (
                        <Button skin="link" onClick={this.removeCustomPoster}>{translate('scale_videooptimizer.remove_custom_poster')}</Button>
                    )}
                </div>
                {this.status && <div className="vo-upload-status">{this.status}</div>}

                <SingleMediaSelectionOverlay
                    open={this.mediaOverlayOpen}
                    locale={this.mediaLocale}
                    types={['image']}
                    onClose={this.closeMediaOverlay}
                    onConfirm={this.handleMediaSelect}
                />

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
