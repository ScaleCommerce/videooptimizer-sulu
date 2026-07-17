// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action, computed} from 'mobx';
import {Button, Loader, Dialog} from 'sulu-admin-bundle/components';
import FolderList from 'sulu-admin-bundle/components/FolderList';
import {translate} from 'sulu-admin-bundle/utils';
import {
    getLibraries,
    getEncodings,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    reprocessLibrary,
} from '../services/api';

const CREATE_ID = '__new__';

// Formats a byte count as a human-readable size (e.g. 1536 -> "1.5 KB").
function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exponent);

    return (exponent === 0 ? value : value.toFixed(1)) + ' ' + units[exponent];
}

// Splits a stored comma-separated ladder ("h264,h265") into a trimmed key array.
function splitKeys(value: ?string): Array<string> {
    if (!value) {
        return [];
    }

    return value.split(',').map((key) => key.trim()).filter(Boolean);
}

function formatDate(value: ?string): string {
    if (!value) {
        return '—';
    }
    const date = new Date(value);

    return isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

@observer
class Libraries extends React.Component<*> {
    @observable loading = true;
    @observable libraries = [];
    // {codecs: [{key,label,access,available}], resolutions: [...]} — org-wide encoding options.
    @observable encodings = {codecs: [], resolutions: []};

    // null = nothing selected; a library id = its cockpit; CREATE_ID = the "new library" form.
    @observable activeId = null;

    // Shared cockpit form state (create and edit).
    @observable formName = '';
    @observable formDescription = '';
    @observable selectedCodecs = [];
    @observable selectedResolutions = [];
    @observable saving = false;

    @observable error = null;
    @observable deleteId = null;
    @observable deleting = false;
    @observable reprocessId = null;
    @observable reprocessing = false;
    @observable reprocessResult = null;

    componentDidMount() {
        getLibraries()
            .then(action((libraries) => {
                this.libraries = libraries;
                this.loading = false;
            }))
            .catch(action((e) => {
                this.loading = false;
                this.error = 428 === e.status
                    ? translate('scale_videooptimizer.not_configured')
                    : (e.message || String(e));
            }));

        // Best-effort: the ladder pickers still work from stored keys if this fails.
        getEncodings()
            .then(action((encodings) => { this.encodings = encodings; }))
            .catch(() => {});
    }

    @computed get activeLibrary(): ?Object {
        if (!this.activeId || this.activeId === CREATE_ID) {
            return null;
        }

        return this.libraries.find((library) => library.id === this.activeId) || null;
    }

    // A delivery-only library (media_managed === false) can't change its ladder or reprocess.
    @computed get mediaManaged(): boolean {
        const library = this.activeLibrary;

        return !library || library.media_managed !== false;
    }

    @action selectLibrary = (id: string | number) => {
        if (id === CREATE_ID) {
            this.startCreate();

            return;
        }
        const library = this.libraries.find((l) => l.id === id);
        if (!library) {
            return;
        }
        this.activeId = library.id;
        this.formName = library.name || '';
        this.formDescription = library.description || '';
        this.selectedCodecs = splitKeys(library.codec);
        this.selectedResolutions = splitKeys(library.resolutions);
        this.reprocessResult = null;
        this.error = null;
    };

    @action startCreate = () => {
        this.activeId = CREATE_ID;
        this.formName = '';
        this.formDescription = '';
        this.selectedCodecs = [];
        this.selectedResolutions = [];
        this.reprocessResult = null;
        this.error = null;
    };

    @action handleNameChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.formName = event.target.value;
    };

    @action handleDescriptionChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.formDescription = event.target.value;
    };

    @action toggleCodec = (key: string) => {
        this.selectedCodecs = this.selectedCodecs.includes(key)
            ? this.selectedCodecs.filter((k) => k !== key)
            : [...this.selectedCodecs, key];
    };

    @action toggleResolution = (key: string) => {
        this.selectedResolutions = this.selectedResolutions.includes(key)
            ? this.selectedResolutions.filter((k) => k !== key)
            : [...this.selectedResolutions, key];
    };

    // Joins the selected keys in the canonical option order (so the ladder stays meaningful
    // regardless of click order); unknown stored keys are appended in their original order.
    ladderValue(group: string, selected: Array<string>): string {
        const order = (this.encodings[group] || []).map((option) => option.key);
        const inOrder = order.filter((key) => selected.includes(key));
        const extras = selected.filter((key) => !order.includes(key));

        return [...inOrder, ...extras].join(',');
    }

    // True when the in-form ladder differs from the saved library — a reprocess is then needed.
    ladderChanged(): boolean {
        const library = this.activeLibrary;
        if (!library) {
            return false;
        }

        return this.ladderValue('codecs', this.selectedCodecs) !== (library.codec || '')
            || this.ladderValue('resolutions', this.selectedResolutions) !== (library.resolutions || '');
    }

    reload(selectId: ?string) {
        getLibraries()
            .then(action((libraries) => {
                this.libraries = libraries;
                if (selectId && libraries.some((l) => l.id === selectId)) {
                    this.selectLibrary(selectId);
                } else {
                    this.activeId = null;
                }
            }))
            .catch(action((e) => { this.error = e.message || String(e); }));
    }

    @action save = () => {
        const name = this.formName.trim();
        if (!name) {
            return;
        }
        this.saving = true;
        this.error = null;

        if (this.activeId === CREATE_ID) {
            const payload = {name};
            const description = this.formDescription.trim();
            const codec = this.ladderValue('codecs', this.selectedCodecs);
            const resolutions = this.ladderValue('resolutions', this.selectedResolutions);
            // Omit empty optionals on create so we don't overwrite server defaults.
            if (description) {
                payload.description = description;
            }
            if (codec) {
                payload.codec = codec;
            }
            if (resolutions) {
                payload.resolutions = resolutions;
            }

            createLibrary(payload)
                .then(action((created) => {
                    this.saving = false;
                    this.reload(created && created.id);
                }))
                .catch(action((e) => { this.saving = false; this.error = e.message || String(e); }));

            return;
        }

        // Edit: always send name/description (empty clears). The ladder is only writable on a
        // media-managed library; on a delivery-only one we leave it untouched.
        const payload = {name, description: this.formDescription.trim()};
        if (this.mediaManaged) {
            payload.codec = this.ladderValue('codecs', this.selectedCodecs);
            payload.resolutions = this.ladderValue('resolutions', this.selectedResolutions);
        }
        const id = this.activeId;
        updateLibrary(id, payload)
            .then(action(() => {
                this.saving = false;
                this.reload(id);
            }))
            .catch(action((e) => { this.saving = false; this.error = e.message || String(e); }));
    };

    @action askDelete = () => { this.deleteId = this.activeId; this.error = null; };
    @action cancelDelete = () => { this.deleteId = null; };
    @action confirmDelete = () => {
        const id = this.deleteId;
        this.deleting = true;
        deleteLibrary(id)
            .then(action(() => { this.deleting = false; this.deleteId = null; this.reload(null); }))
            .catch(action((e) => { this.deleting = false; this.deleteId = null; this.error = e.message || String(e); }));
    };

    @action askReprocess = () => { this.reprocessId = this.activeId; this.reprocessResult = null; this.error = null; };
    @action cancelReprocess = () => { this.reprocessId = null; };
    @action confirmReprocess = () => {
        const id = this.reprocessId;
        this.reprocessing = true;
        reprocessLibrary(id)
            .then(action((result) => {
                this.reprocessing = false;
                this.reprocessId = null;
                this.reprocessResult = {queued: (result && result.queued) || 0};
            }))
            .catch(action((e) => { this.reprocessing = false; this.reprocessId = null; this.error = e.message || String(e); }));
    };

    renderRail() {
        const folders = this.libraries.map((library) => (
            <FolderList.Folder
                key={library.id}
                id={library.id}
                title={library.name}
                info={
                    (library.id === this.activeId ? '✓ ' : '')
                    + translate('scale_videooptimizer.library_videos_count', {count: library.video_count || 0})
                }
            />
        ));

        folders.push(
            <FolderList.Folder
                key={CREATE_ID}
                id={CREATE_ID}
                title={'＋ ' + translate('scale_videooptimizer.new_library')}
                info=""
            />
        );

        return <FolderList onFolderClick={this.selectLibrary}>{folders}</FolderList>;
    }

    renderLadderGroup(group: string, availableKeys: ?Array<string>, selected: Array<string>, onToggle: (key: string) => void) {
        const options = this.encodings[group] || [];
        const known = new Set(options.map((option) => option.key));
        const allowed = (Array.isArray(availableKeys) && availableKeys.length) ? availableKeys : null;
        const readOnly = !this.mediaManaged;
        // In edit mode the library's available_* list decides what's selectable; without it (or on
        // create) fall back to the org-wide "available" flag.
        const isSelectable = (option) => (allowed ? allowed.includes(option.key) : !!option.available);

        // Preserve stored keys the encodings endpoint doesn't know about, so a save never drops them.
        const unknown = selected.filter((key) => !known.has(key));

        return (
            <div className="vo-chips">
                {options.map((option) => {
                    const active = selected.includes(option.key);
                    const selectable = isSelectable(option);
                    const interactive = !readOnly && (selectable || active);
                    const locked = !selectable && !active;
                    const isAddon = option.access === 'addon';
                    const classNames = ['vo-chip'];
                    if (active) {
                        classNames.push('vo-chip--active');
                    }
                    if (locked) {
                        classNames.push('vo-chip--locked');
                    }

                    return (
                        <button
                            key={option.key}
                            type="button"
                            className={classNames.join(' ')}
                            disabled={!interactive}
                            title={isAddon && !option.available ? translate('scale_videooptimizer.addon_hint') : undefined}
                            onClick={interactive ? () => onToggle(option.key) : undefined}
                        >
                            {option.label || option.key}
                            {isAddon && (
                                <span className="vo-chip-badge">{translate('scale_videooptimizer.addon')}</span>
                            )}
                        </button>
                    );
                })}

                {unknown.map((key) => (
                    <button
                        key={key}
                        type="button"
                        className="vo-chip vo-chip--active"
                        disabled={readOnly}
                        onClick={readOnly ? undefined : () => onToggle(key)}
                    >
                        {key}
                    </button>
                ))}
            </div>
        );
    }

    renderCockpit() {
        const isNew = this.activeId === CREATE_ID;
        const library = this.activeLibrary;
        const mediaManaged = this.mediaManaged;

        return (
            <div className="vo-cockpit">
                <div className="vo-list-header">
                    <h1>{isNew ? translate('scale_videooptimizer.new_library') : (library ? library.name : '')}</h1>
                    {!isNew && (
                        <Button skin="link" onClick={this.askDelete}>
                            {translate('scale_videooptimizer.delete')}
                        </Button>
                    )}
                </div>

                {library && (
                    <div className="vo-meta">
                        <div className="vo-meta__row">
                            <dt>{translate('scale_videooptimizer.videos_label')}</dt>
                            <dd>{library.video_count || 0}</dd>
                        </div>
                        <div className="vo-meta__row">
                            <dt>{translate('scale_videooptimizer.library_storage')}</dt>
                            <dd>{formatBytes(library.storage_usage || 0)}</dd>
                        </div>
                        <div className="vo-meta__row">
                            <dt>{translate('scale_videooptimizer.created')}</dt>
                            <dd>{formatDate(library.created_at)}</dd>
                        </div>
                        {!mediaManaged && (
                            <span className="vo-badge vo-badge--muted">
                                {translate('scale_videooptimizer.delivery_only')}
                            </span>
                        )}
                    </div>
                )}

                <label className="vo-label">{translate('scale_videooptimizer.library_name')}</label>
                <input type="text" className="vo-input" value={this.formName} onChange={this.handleNameChange} />

                <label className="vo-label">{translate('scale_videooptimizer.library_description')}</label>
                <input type="text" className="vo-input" value={this.formDescription} onChange={this.handleDescriptionChange} />

                {!mediaManaged ? (
                    <div className="vo-hint" style={{padding: '16px 0 0'}}>
                        {translate('scale_videooptimizer.delivery_only_hint')}
                    </div>
                ) : (
                    <React.Fragment>
                        <label className="vo-label">{translate('scale_videooptimizer.codecs')}</label>
                        {this.renderLadderGroup(
                            'codecs',
                            library ? library.available_codecs : null,
                            this.selectedCodecs,
                            this.toggleCodec
                        )}

                        <label className="vo-label">{translate('scale_videooptimizer.resolutions')}</label>
                        {this.renderLadderGroup(
                            'resolutions',
                            library ? library.available_resolutions : null,
                            this.selectedResolutions,
                            this.toggleResolution
                        )}

                        {!isNew && this.ladderChanged() && (
                            <div className="vo-hint" style={{padding: '12px 0 0'}}>
                                {translate('scale_videooptimizer.ladder_reprocess_hint')}
                            </div>
                        )}
                    </React.Fragment>
                )}

                <div className="vo-actions">
                    <Button skin="primary" onClick={this.save} loading={this.saving} disabled={!this.formName.trim()}>
                        {isNew ? translate('scale_videooptimizer.create') : translate('scale_videooptimizer.save')}
                    </Button>
                    {!isNew && mediaManaged && (
                        <Button skin="secondary" onClick={this.askReprocess}>
                            {translate('scale_videooptimizer.reprocess')}
                        </Button>
                    )}
                </div>

                {this.reprocessResult && (
                    <div className="vo-message vo-message--success">
                        {translate('scale_videooptimizer.reprocess_queued', {count: this.reprocessResult.queued})}
                    </div>
                )}
            </div>
        );
    }

    render() {
        if (this.loading) {
            return <div className="vo-page vo-page--wide"><Loader /></div>;
        }

        return (
            <div className="vo-page vo-page--wide">
                <div className="vo-list-header">
                    <h1>{translate('scale_videooptimizer.libraries_nav')}</h1>
                </div>

                <div className="vo-rail">{this.renderRail()}</div>

                <hr className="vo-divider" />

                {this.activeId ? (
                    this.renderCockpit()
                ) : (
                    <div className="vo-empty">{translate('scale_videooptimizer.select_or_create_hint')}</div>
                )}

                {this.error && <div className="vo-message vo-message--error">{this.error}</div>}

                <Dialog
                    open={!!this.deleteId}
                    title={translate('scale_videooptimizer.delete')}
                    confirmText={translate('scale_videooptimizer.delete')}
                    cancelText={translate('sulu_admin.cancel')}
                    onConfirm={this.confirmDelete}
                    onCancel={this.cancelDelete}
                    confirmLoading={this.deleting}
                >
                    {translate('scale_videooptimizer.confirm_delete_library')}
                </Dialog>

                <Dialog
                    open={!!this.reprocessId}
                    title={translate('scale_videooptimizer.reprocess')}
                    confirmText={translate('scale_videooptimizer.reprocess')}
                    cancelText={translate('sulu_admin.cancel')}
                    onConfirm={this.confirmReprocess}
                    onCancel={this.cancelReprocess}
                    confirmLoading={this.reprocessing}
                >
                    {translate('scale_videooptimizer.confirm_reprocess')}
                </Dialog>
            </div>
        );
    }
}

export default Libraries;
