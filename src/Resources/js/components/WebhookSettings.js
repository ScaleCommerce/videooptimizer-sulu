// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Button, Dialog} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';
import {can} from '../services/permissions';
import {clearWebhookSecret, errorText} from '../services/api';

type Props = {
    // Settings as returned by GET settings: {webhookConfigured, webhookUrl, webhookLastDelivery}.
    settings: Object,
    // Called with the new settings after the secret was removed.
    onChanged: (settings: Object) => void,
    secret: string,
    onSecretChange: (value: string) => void,
};

// Webhook receiver: shows the URL to enter in the VideoOptimizer app and takes its signing secret (write-only,
// stored encrypted like the API token). The secret is saved together with the other settings.
@observer
class WebhookSettings extends React.Component<Props> {
    @observable copied = false;
    @observable removing = false;
    @observable confirmRemove = false;
    @observable error = null;

    urlInput = React.createRef();

    @action copyUrl = () => {
        const url = this.props.settings.webhookUrl;
        const done = action(() => { this.copied = true; });
        const fallback = () => {
            // Clipboard API unavailable (plain http): select the field so Ctrl/Cmd+C works.
            if (this.urlInput.current) {
                this.urlInput.current.select();
            }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(done, fallback);
        } else {
            fallback();
        }
    };

    @action askRemove = () => { this.confirmRemove = true; };
    @action cancelRemove = () => { this.confirmRemove = false; };

    @action doRemove = () => {
        this.removing = true;
        this.error = null;
        clearWebhookSecret()
            .then(action((settings) => {
                this.removing = false;
                this.confirmRemove = false;
                this.props.onChanged(settings);
            }))
            .catch(action((e) => {
                this.removing = false;
                this.confirmRemove = false;
                this.error = errorText(e);
            }));
    };

    renderLastDelivery() {
        const last = this.props.settings.webhookLastDelivery;
        if (!last) {
            return <div className="vo-hint">{translate('scale_videooptimizer.webhook_never')}</div>;
        }

        return (
            <div className="vo-hint">
                {translate('scale_videooptimizer.webhook_last', {event: last.event, time: new Date(last.time * 1000).toLocaleString()})}
            </div>
        );
    }

    render() {
        const {settings, secret, onSecretChange} = this.props;
        const canEdit = can('settings', 'edit');

        return (
            <div className="vo-card">
                <h2>{translate('scale_videooptimizer.webhook')}</h2>
                <p className="vo-intro">{translate('scale_videooptimizer.webhook_intro')}</p>

                <div className={'vo-status ' + (settings.webhookConfigured ? 'vo-status--ok' : 'vo-status--warn')}>
                    {settings.webhookConfigured
                        ? translate('scale_videooptimizer.webhook_configured')
                        : translate('scale_videooptimizer.webhook_missing')}
                </div>

                <label className="vo-label">{translate('scale_videooptimizer.webhook_url')}</label>
                <div className="vo-actions" style={{marginTop: 0, alignItems: 'center'}}>
                    <input ref={this.urlInput} type="text" className="vo-input" readOnly value={settings.webhookUrl || ''} onFocus={(event) => event.target.select()} />
                    <Button skin="secondary" onClick={this.copyUrl}>
                        {this.copied ? translate('scale_videooptimizer.copied') : translate('scale_videooptimizer.copy')}
                    </Button>
                </div>
                <div className="vo-hint" style={{padding: '4px 0 0'}}>{translate('scale_videooptimizer.webhook_url_help')}</div>

                <label className="vo-label">{translate('scale_videooptimizer.webhook_secret')}</label>
                <input
                    type="password"
                    className="vo-input"
                    value={secret}
                    placeholder={translate('scale_videooptimizer.webhook_secret_placeholder')}
                    onChange={(event) => onSecretChange(event.target.value)}
                    disabled={!canEdit}
                    autoComplete="off"
                />

                {settings.webhookConfigured && (
                    <React.Fragment>
                        {this.renderLastDelivery()}
                        {canEdit && (
                            <div className="vo-actions">
                                <Button skin="link" onClick={this.askRemove} disabled={this.removing}>
                                    {translate('scale_videooptimizer.webhook_remove')}
                                </Button>
                            </div>
                        )}
                    </React.Fragment>
                )}

                {this.error && <div className="vo-message vo-message--error">{this.error}</div>}

                <Dialog
                    open={this.confirmRemove}
                    title={translate('scale_videooptimizer.webhook_remove')}
                    confirmText={translate('scale_videooptimizer.webhook_remove')}
                    cancelText={translate('sulu_admin.cancel')}
                    confirmLoading={this.removing}
                    onConfirm={this.doRemove}
                    onCancel={this.cancelRemove}
                >
                    {translate('scale_videooptimizer.webhook_remove_confirm')}
                </Dialog>
            </div>
        );
    }
}

export default WebhookSettings;
