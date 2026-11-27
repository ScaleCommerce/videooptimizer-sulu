// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Button, Dialog, Loader} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';
import {can} from '../services/permissions';
import {getSubtitleLanguages, createSubtitleLanguage, deleteSubtitleLanguage, errorText} from '../services/api';

// The organization's subtitle languages (shared by all videos): add with an optional player label, delete.
// A language that still carries subtitles cannot be deleted (the API answers 409).
@observer
class SubtitleLanguages extends React.Component<*> {
    @observable languages = [];
    @observable loading = true;
    @observable busy = false;
    @observable code = '';
    @observable label = '';
    @observable pendingDelete = null;
    @observable message = null;

    _unmounted = false;

    componentDidMount() {
        getSubtitleLanguages()
            .then(action((languages) => {
                if (this._unmounted) { return; }
                this.languages = languages;
                this.loading = false;
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.loading = false;
                this.message = {type: 'error', text: errorText(e)};
            }));
    }

    componentWillUnmount() {
        this._unmounted = true;
    }

    @action handleCode = (event) => { this.code = event.target.value; };
    @action handleLabel = (event) => { this.label = event.target.value; };

    @action add = () => {
        const code = this.code.trim();
        if (!code) {
            return;
        }
        this.busy = true;
        this.message = null;
        createSubtitleLanguage(code, this.label.trim())
            .then(() => getSubtitleLanguages())
            .then(action((languages) => {
                if (this._unmounted) { return; }
                this.busy = false;
                this.languages = languages;
                this.code = '';
                this.label = '';
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.busy = false;
                this.message = {type: 'error', text: errorText(e)};
            }));
    };

    @action askDelete = (language) => { this.pendingDelete = language; };
    @action cancelDelete = () => { this.pendingDelete = null; };

    @action confirmDelete = () => {
        const language = this.pendingDelete;
        if (!language) {
            return;
        }
        this.busy = true;
        this.message = null;
        deleteSubtitleLanguage(language.code)
            .then(action(() => {
                if (this._unmounted) { return; }
                this.busy = false;
                this.pendingDelete = null;
                this.languages = this.languages.filter((item) => item.code !== language.code);
            }))
            .catch(action((e) => {
                if (this._unmounted) { return; }
                this.busy = false;
                this.pendingDelete = null;
                this.message = {type: 'error', text: errorText(e)};
            }));
    };

    render() {
        const canEdit = can('settings', 'edit');

        return (
            <div className="vo-card">
                <h2>{translate('scale_videooptimizer.subtitle_languages')}</h2>
                <p className="vo-intro">{translate('scale_videooptimizer.subtitle_languages_intro')}</p>

                {this.loading ? <Loader /> : (
                    <React.Fragment>
                        {this.languages.length === 0
                            ? <div className="vo-hint">{translate('scale_videooptimizer.subtitle_languages_missing_short')}</div>
                            : (
                                <ul className="vo-subtitles">
                                    {this.languages.map((language) => (
                                        <li key={language.code} className="vo-subtitles__item">
                                            <span className="vo-subtitles__name">{language.label || language.code} <code>{language.code}</code></span>
                                            <span className="vo-subtitles__meta">
                                                {translate('scale_videooptimizer.videos_count', {count: language.video_count || 0})}
                                            </span>
                                            {canEdit && (
                                                <Button skin="link" disabled={this.busy} onClick={() => this.askDelete(language)}>
                                                    {translate('scale_videooptimizer.delete')}
                                                </Button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        {canEdit && <div className="vo-actions" style={{alignItems: 'center', flexWrap: 'wrap'}}>
                            <input
                                type="text"
                                className="vo-input vo-input--auto"
                                placeholder={translate('scale_videooptimizer.subtitle_language_code')}
                                value={this.code}
                                disabled={this.busy}
                                onChange={this.handleCode}
                            />
                            <input
                                type="text"
                                className="vo-input vo-input--auto"
                                placeholder={translate('scale_videooptimizer.subtitle_language_label')}
                                value={this.label}
                                disabled={this.busy}
                                onChange={this.handleLabel}
                            />
                            <Button skin="secondary" onClick={this.add} loading={this.busy} disabled={!this.code.trim()}>
                                {translate('scale_videooptimizer.subtitle_language_add')}
                            </Button>
                        </div>}
                        {canEdit && <div className="vo-hint" style={{padding: '4px 0 0'}}>{translate('scale_videooptimizer.subtitle_language_help')}</div>}
                    </React.Fragment>
                )}

                {this.message && <div className={'vo-message vo-message--' + this.message.type}>{this.message.text}</div>}

                <Dialog
                    open={!!this.pendingDelete}
                    title={translate('scale_videooptimizer.subtitle_language_delete')}
                    confirmText={translate('scale_videooptimizer.delete')}
                    cancelText={translate('sulu_admin.cancel')}
                    confirmLoading={this.busy}
                    onConfirm={this.confirmDelete}
                    onCancel={this.cancelDelete}
                >
                    {translate('scale_videooptimizer.subtitle_language_delete_confirm', {language: this.pendingDelete ? this.pendingDelete.code : ''})}
                </Dialog>
            </div>
        );
    }
}

export default SubtitleLanguages;
