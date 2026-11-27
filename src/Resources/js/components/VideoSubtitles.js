// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Button} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';
import {
    getSubtitles, getSubtitleLanguages, uploadSubtitle, deleteSubtitle, subtitleDownloadUrl, errorText,
} from '../services/api';

// Subtitles of one video: list with download/delete and an upload form (.srt or .vtt per language).
@observer
class VideoSubtitles extends React.Component<*> {
    @observable subtitles = [];
    @observable languages = [];
    @observable loading = true;
    @observable busy = false;
    @observable error = null;
    @observable message = null;
    @observable language = '';
    @observable kind = 'subtitles';
    @observable isDefault = false;
    @observable file = null;

    fileInput = React.createRef();
    _unmounted = false;

    componentDidMount() {
        Promise.all([getSubtitles(this.props.uuid), getSubtitleLanguages()])
            .then(action(([subtitles, languages]) => {
                if (this._unmounted) { return; }
                this.subtitles = subtitles;
                this.languages = languages;
                this.language = languages.length > 0 ? languages[0].code : '';
                this.loading = false;
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.loading = false;
                this.error = errorText(e);
            }));
    }

    componentWillUnmount() {
        this._unmounted = true;
    }

    @action handleLanguage = (event) => { this.language = event.target.value; };
    @action handleKind = (event) => { this.kind = event.target.value; };
    @action toggleDefault = () => { this.isDefault = !this.isDefault; };
    @action handleFile = (event) => { this.file = (event.target.files && event.target.files[0]) || null; };

    @action upload = () => {
        if (!this.file || !this.language) {
            return;
        }
        this.busy = true;
        this.error = null;
        this.message = null;
        uploadSubtitle(this.props.uuid, {file: this.file, language: this.language, kind: this.kind, isDefault: this.isDefault})
            .then((result) => getSubtitles(this.props.uuid).then((subtitles) => ({result, subtitles})))
            .then(action(({result, subtitles}) => {
                if (this._unmounted) { return; }
                this.busy = false;
                this.subtitles = subtitles;
                this.file = null;
                this.isDefault = false;
                if (this.fileInput.current) {
                    this.fileInput.current.value = '';
                }
                const skipped = result && result.skipped_cues;
                this.message = skipped ? translate('scale_videooptimizer.subtitle_saved_skipped', {count: skipped}) : translate('scale_videooptimizer.subtitle_saved');
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.busy = false;
                this.error = errorText(e);
            }));
    };

    @action remove = (language) => {
        this.busy = true;
        this.error = null;
        this.message = null;
        deleteSubtitle(this.props.uuid, language)
            .then(action(() => {
                if (this._unmounted) { return; }
                this.busy = false;
                this.subtitles = this.subtitles.filter((subtitle) => subtitle.language !== language);
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.busy = false;
                this.error = errorText(e);
            }));
    };

    renderList() {
        if (this.subtitles.length === 0) {
            return <div className="vo-hint">{translate('scale_videooptimizer.no_subtitles')}</div>;
        }

        return (
            <ul className="vo-subtitles">
                {this.subtitles.map((subtitle) => (
                    <li key={subtitle.language} className="vo-subtitles__item">
                        <span className="vo-subtitles__name">
                            {subtitle.label || subtitle.language} <code>{subtitle.language}</code>
                        </span>
                        <span className="vo-subtitles__meta">
                            {translate('scale_videooptimizer.subtitle_kind_' + (subtitle.kind || 'subtitles'))}
                            {subtitle.is_default ? ' · ' + translate('scale_videooptimizer.subtitle_default') : ''}
                            {typeof subtitle.cue_count === 'number' ? ' · ' + translate('scale_videooptimizer.subtitle_cues', {count: subtitle.cue_count}) : ''}
                        </span>
                        <a className="vo-subtitles__link" href={subtitleDownloadUrl(this.props.uuid, subtitle.language)} download>
                            {translate('scale_videooptimizer.subtitle_download')}
                        </a>
                        <Button skin="link" disabled={this.busy} onClick={() => this.remove(subtitle.language)}>
                            {translate('scale_videooptimizer.delete')}
                        </Button>
                    </li>
                ))}
            </ul>
        );
    }

    renderForm() {
        if (this.languages.length === 0) {
            return <div className="vo-hint">{translate('scale_videooptimizer.subtitle_languages_missing')}</div>;
        }

        return (
            <div className="vo-actions" style={{marginTop: 0, alignItems: 'center', flexWrap: 'wrap'}}>
                <select className="vo-input vo-input--auto" value={this.language} onChange={this.handleLanguage} disabled={this.busy}>
                    {this.languages.map((language) => (
                        <option key={language.code} value={language.code}>{language.label || language.code} ({language.code})</option>
                    ))}
                </select>
                <select className="vo-input vo-input--auto" value={this.kind} onChange={this.handleKind} disabled={this.busy}>
                    <option value="subtitles">{translate('scale_videooptimizer.subtitle_kind_subtitles')}</option>
                    <option value="captions">{translate('scale_videooptimizer.subtitle_kind_captions')}</option>
                </select>
                <label className="vo-check">
                    <input type="checkbox" checked={this.isDefault} onChange={this.toggleDefault} disabled={this.busy} />
                    {translate('scale_videooptimizer.subtitle_default')}
                </label>
                <input ref={this.fileInput} type="file" accept=".srt,.vtt,text/vtt" disabled={this.busy} onChange={this.handleFile} />
                <Button skin="secondary" onClick={this.upload} loading={this.busy} disabled={!this.file}>
                    {translate('scale_videooptimizer.subtitle_upload')}
                </Button>
            </div>
        );
    }

    render() {
        return (
            <div className="vo-subtitles-section">
                <label className="vo-label">{translate('scale_videooptimizer.subtitles')}</label>
                {this.loading ? null : (
                    <React.Fragment>
                        {this.renderList()}
                        {this.renderForm()}
                        <div className="vo-hint" style={{padding: '4px 0 0'}}>{translate('scale_videooptimizer.subtitle_help')}</div>
                    </React.Fragment>
                )}
                {this.message && <div className="vo-message vo-message--success">{this.message}</div>}
                {this.error && <div className="vo-message vo-message--error">{this.error}</div>}
            </div>
        );
    }
}

export default VideoSubtitles;
