// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Button, Dialog, Loader} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';
import {getSettings, saveSettings, testConnection, clearToken} from '../services/api';

@observer
class Settings extends React.Component<*> {
    @observable loading = true;
    @observable saving = false;
    @observable removing = false;
    @observable showRemoveDialog = false;
    @observable configured = false;
    @observable token = '';
    @observable defaultLibraryId = '';
    @observable defaultPlayer = 'hosted';
    @observable message = null;

    componentDidMount() {
        getSettings()
            .then(action((data) => {
                this.configured = !!data.configured;
                this.defaultLibraryId = data.defaultLibraryId || '';
                this.defaultPlayer = data.defaultPlayer || 'hosted';
                this.loading = false;
            }))
            .catch(action((error) => {
                // Never trap the settings form behind a failed load — the token must always be enterable,
                // even when nothing is configured yet or the API routes are missing.
                this.loading = false;
                this.message = {type: 'error', text: error.message || String(error)};
            }));
    }

    @action handleTokenChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.token = event.target.value;
    };

    @action handleLibraryChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.defaultLibraryId = event.target.value;
    };

    @action handlePlayerChange = (event: SyntheticInputEvent<HTMLSelectElement>) => {
        this.defaultPlayer = event.target.value;
    };

    @action handleSave = () => {
        this.saving = true;
        this.message = null;
        saveSettings({token: this.token, defaultLibraryId: this.defaultLibraryId, defaultPlayer: this.defaultPlayer})
            .then(action((data) => {
                this.configured = !!data.configured;
                this.token = '';
                this.saving = false;
                this.message = {type: 'success', text: translate('scale_videooptimizer.saved')};
            }))
            .catch(action((error) => {
                this.saving = false;
                this.message = {type: 'error', text: error.message || String(error)};
            }));
    };

    @action handleTest = () => {
        this.message = null;
        testConnection().then(action((result) => {
            this.message = result.ok
                ? {type: 'success', text: translate('scale_videooptimizer.test_ok', {count: result.libraryCount})}
                : {type: 'error', text: translate('scale_videooptimizer.test_failed', {message: result.message})};
        }));
    };

    @action handleRemoveClick = () => {
        this.showRemoveDialog = true;
    };

    @action handleRemoveCancel = () => {
        this.showRemoveDialog = false;
    };

    @action handleRemoveConfirm = () => {
        this.removing = true;
        this.message = null;
        clearToken()
            .then(action((data) => {
                this.configured = !!data.configured;
                this.removing = false;
                this.showRemoveDialog = false;
                this.message = {type: 'success', text: translate('scale_videooptimizer.token_removed')};
            }))
            .catch(action((error) => {
                this.removing = false;
                this.showRemoveDialog = false;
                this.message = {type: 'error', text: error.message || String(error)};
            }));
    };

    render() {
        if (this.loading) {
            return <div className="vo-page"><Loader /></div>;
        }

        return (
            <div className="vo-page">
                <div className="vo-card">
                    <h1>{translate('scale_videooptimizer.settings_title')}</h1>
                    <p className="vo-intro">{translate('scale_videooptimizer.settings_intro')}</p>

                    <div className={'vo-status ' + (this.configured ? 'vo-status--ok' : 'vo-status--warn')}>
                        {this.configured
                            ? translate('scale_videooptimizer.token_configured')
                            : translate('scale_videooptimizer.token_missing')}
                    </div>

                    <label className="vo-label">{translate('scale_videooptimizer.api_token')}</label>
                    <input
                        type="password"
                        className="vo-input"
                        value={this.token}
                        placeholder={translate('scale_videooptimizer.api_token_placeholder')}
                        onChange={this.handleTokenChange}
                        autoComplete="off"
                    />

                    <label className="vo-label">{translate('scale_videooptimizer.default_library')}</label>
                    <input
                        type="text"
                        className="vo-input"
                        value={this.defaultLibraryId}
                        onChange={this.handleLibraryChange}
                    />

                    <label className="vo-label">{translate('scale_videooptimizer.default_player')}</label>
                    <select
                        className="vo-input"
                        value={this.defaultPlayer}
                        onChange={this.handlePlayerChange}
                    >
                        <option value="hosted">{translate('scale_videooptimizer.player_hosted')}</option>
                        <option value="native">{translate('scale_videooptimizer.player_native')}</option>
                    </select>

                    <div className="vo-actions">
                        <Button skin="primary" onClick={this.handleSave} loading={this.saving}>
                            {translate('scale_videooptimizer.save')}
                        </Button>
                        <Button skin="secondary" onClick={this.handleTest} disabled={!this.configured}>
                            {translate('scale_videooptimizer.test_connection')}
                        </Button>
                        {this.configured && (
                            <Button skin="link" onClick={this.handleRemoveClick} disabled={this.removing}>
                                {translate('scale_videooptimizer.remove_token')}
                            </Button>
                        )}
                    </div>

                    {this.message && (
                        <div className={'vo-message vo-message--' + this.message.type}>{this.message.text}</div>
                    )}
                </div>

                <Dialog
                    cancelText={translate('sulu_admin.cancel')}
                    confirmLoading={this.removing}
                    confirmText={translate('scale_videooptimizer.remove_token')}
                    onCancel={this.handleRemoveCancel}
                    onConfirm={this.handleRemoveConfirm}
                    open={this.showRemoveDialog}
                    title={translate('scale_videooptimizer.remove_token')}
                >
                    {translate('scale_videooptimizer.remove_token_confirm')}
                </Dialog>
            </div>
        );
    }
}

export default Settings;
