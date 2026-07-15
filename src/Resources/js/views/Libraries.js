// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Button, Loader, Dialog} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';
import {getLibraries, createLibrary, updateLibrary, deleteLibrary, reprocessLibrary} from '../services/api';

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

// Builds the create/update payload, trimming whitespace and dropping empty optional fields
// so a fresh create doesn't overwrite server defaults with empty strings.
function buildLibraryPayload(fields: {name: string, description: string, resolutions: string, codec: string}): Object {
    const payload = {name: fields.name.trim()};

    if (fields.description.trim()) {
        payload.description = fields.description.trim();
    }
    if (fields.resolutions.trim()) {
        payload.resolutions = fields.resolutions.trim();
    }
    if (fields.codec.trim()) {
        payload.codec = fields.codec.trim();
    }

    return payload;
}

@observer
class Libraries extends React.Component<*> {
    @observable loading = true;
    @observable libraries = [];
    @observable newName = '';
    @observable newDescription = '';
    @observable newResolutions = '';
    @observable newCodec = '';
    @observable creating = false;
    @observable error = null;
    @observable deleteId = null;
    @observable deleting = false;

    @observable editId = null;
    @observable editName = '';
    @observable editDescription = '';
    @observable editResolutions = '';
    @observable editCodec = '';
    @observable saving = false;

    @observable reprocessId = null;
    @observable reprocessing = false;
    @observable reprocessResult = null;

    componentDidMount() {
        this.load();
    }

    load() {
        getLibraries()
            .then(action((libraries) => {
                this.libraries = libraries;
                this.loading = false;
            }))
            .catch(action((e) => {
                this.loading = false;
                this.error = e.message || String(e);
            }));
    }

    @action handleNameChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.newName = event.target.value;
    };

    @action handleDescriptionChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.newDescription = event.target.value;
    };

    @action handleResolutionsChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.newResolutions = event.target.value;
    };

    @action handleCodecChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.newCodec = event.target.value;
    };

    @action handleCreate = () => {
        if (!this.newName.trim()) {
            return;
        }
        this.creating = true;
        this.error = null;
        createLibrary(buildLibraryPayload({
            name: this.newName,
            description: this.newDescription,
            resolutions: this.newResolutions,
            codec: this.newCodec,
        }))
            .then(action(() => {
                this.newName = '';
                this.newDescription = '';
                this.newResolutions = '';
                this.newCodec = '';
                this.creating = false;
                this.load();
            }))
            .catch(action((e) => {
                this.creating = false;
                this.error = e.message || String(e);
            }));
    };

    @action askDelete = (id) => {
        this.deleteId = id;
        this.error = null;
    };

    @action cancelDelete = () => {
        this.deleteId = null;
    };

    @action confirmDelete = () => {
        const id = this.deleteId;
        this.deleting = true;
        deleteLibrary(id)
            .then(action(() => {
                this.deleting = false;
                this.deleteId = null;
                this.load();
            }))
            .catch(action((e) => {
                this.deleting = false;
                this.deleteId = null;
                this.error = e.message || String(e);
            }));
    };

    @action startEdit = (library: Object) => {
        this.editId = library.id;
        this.editName = library.name || '';
        this.editDescription = library.description || '';
        this.editResolutions = library.resolutions || '';
        this.editCodec = library.codec || '';
        this.error = null;
    };

    @action cancelEdit = () => {
        this.editId = null;
    };

    @action handleEditNameChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.editName = event.target.value;
    };

    @action handleEditDescriptionChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.editDescription = event.target.value;
    };

    @action handleEditResolutionsChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.editResolutions = event.target.value;
    };

    @action handleEditCodecChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.editCodec = event.target.value;
    };

    @action saveEdit = () => {
        if (!this.editName.trim()) {
            return;
        }
        const id = this.editId;
        this.saving = true;
        this.error = null;
        // Unlike buildLibraryPayload (create), edit always sends every optional field —
        // including empty strings — so clearing a field in the UI actually clears it server-side.
        updateLibrary(id, {
            name: this.editName.trim(),
            description: this.editDescription.trim(),
            resolutions: this.editResolutions.trim(),
            codec: this.editCodec.trim(),
        })
            .then(action(() => {
                this.saving = false;
                this.editId = null;
                this.load();
            }))
            .catch(action((e) => {
                this.saving = false;
                this.error = e.message || String(e);
            }));
    };

    @action askReprocess = (id) => {
        this.reprocessId = id;
        this.reprocessResult = null;
        this.error = null;
    };

    @action cancelReprocess = () => {
        this.reprocessId = null;
    };

    @action confirmReprocess = () => {
        const id = this.reprocessId;
        this.reprocessing = true;
        reprocessLibrary(id)
            .then(action((result) => {
                this.reprocessing = false;
                this.reprocessId = null;
                this.reprocessResult = {libraryId: id, queued: (result && result.queued) || 0};
            }))
            .catch(action((e) => {
                this.reprocessing = false;
                this.reprocessId = null;
                this.error = e.message || String(e);
            }));
    };

    render() {
        if (this.loading) {
            return <div className="vo-page"><Loader /></div>;
        }

        return (
            <div className="vo-page">
                <div className="vo-card">
                    <h1>{translate('scale_videooptimizer.libraries_nav')}</h1>

                    <label className="vo-label">{translate('scale_videooptimizer.new_library')}</label>
                    <input
                        type="text"
                        className="vo-input"
                        value={this.newName}
                        placeholder={translate('scale_videooptimizer.library_name')}
                        onChange={this.handleNameChange}
                    />

                    <label className="vo-label">{translate('scale_videooptimizer.library_description')}</label>
                    <input
                        type="text"
                        className="vo-input"
                        value={this.newDescription}
                        onChange={this.handleDescriptionChange}
                    />

                    <label className="vo-label">{translate('scale_videooptimizer.library_resolutions')}</label>
                    <input
                        type="text"
                        className="vo-input"
                        value={this.newResolutions}
                        onChange={this.handleResolutionsChange}
                    />

                    <label className="vo-label">{translate('scale_videooptimizer.library_codec')}</label>
                    <input
                        type="text"
                        className="vo-input"
                        value={this.newCodec}
                        onChange={this.handleCodecChange}
                    />

                    <div className="vo-actions">
                        <Button skin="primary" onClick={this.handleCreate} loading={this.creating}>
                            {translate('scale_videooptimizer.create')}
                        </Button>
                    </div>

                    {this.libraries.length === 0 ? (
                        <div className="vo-empty">{translate('scale_videooptimizer.not_configured')}</div>
                    ) : (
                        <table className="vo-table" style={{width: '100%', marginTop: 24, borderCollapse: 'collapse'}}>
                            <tbody>
                                {this.libraries.map((library) => (
                                    <React.Fragment key={library.id}>
                                        <tr style={{borderTop: '1px solid #e4e7ec'}}>
                                            <td style={{padding: '12px 0'}}>
                                                <div style={{fontWeight: 600}}>{library.name}</div>
                                                {library.description && (
                                                    <div style={{color: '#667085', fontSize: 12, marginTop: 2}}>
                                                        {library.description}
                                                    </div>
                                                )}
                                                <div style={{color: '#98a2b3', fontSize: 11, marginTop: 2}}>
                                                    {library.id}
                                                </div>
                                            </td>
                                            <td style={{padding: '12px 0', color: '#667085', fontSize: 12, whiteSpace: 'nowrap'}}>
                                                <div>
                                                    {translate('scale_videooptimizer.library_videos_count', {
                                                        count: library.video_count || 0,
                                                    })}
                                                </div>
                                                <div>
                                                    {translate('scale_videooptimizer.library_storage')}: {formatBytes(library.storage_usage || 0)}
                                                </div>
                                            </td>
                                            <td style={{padding: '12px 0', textAlign: 'right', whiteSpace: 'nowrap'}}>
                                                <span className="vo-lib-actions">
                                                    <Button skin="link" onClick={() => this.startEdit(library)}>
                                                        {translate('scale_videooptimizer.edit')}
                                                    </Button>
                                                    <Button skin="link" onClick={() => this.askReprocess(library.id)}>
                                                        {translate('scale_videooptimizer.reprocess')}
                                                    </Button>
                                                    <Button skin="link" onClick={() => this.askDelete(library.id)}>
                                                        {translate('scale_videooptimizer.delete')}
                                                    </Button>
                                                </span>
                                            </td>
                                        </tr>
                                        {this.editId === library.id && (
                                            <tr>
                                                <td colSpan={3} style={{padding: '0 0 24px'}}>
                                                    <div style={{
                                                        background: '#f9fafb',
                                                        border: '1px solid #e4e7ec',
                                                        borderRadius: 6,
                                                        padding: '4px 16px 16px',
                                                    }}>
                                                        <label className="vo-label">{translate('scale_videooptimizer.library_name')}</label>
                                                        <input
                                                            type="text"
                                                            className="vo-input"
                                                            value={this.editName}
                                                            onChange={this.handleEditNameChange}
                                                        />

                                                        <label className="vo-label">{translate('scale_videooptimizer.library_description')}</label>
                                                        <input
                                                            type="text"
                                                            className="vo-input"
                                                            value={this.editDescription}
                                                            onChange={this.handleEditDescriptionChange}
                                                        />

                                                        <label className="vo-label">{translate('scale_videooptimizer.library_resolutions')}</label>
                                                        <input
                                                            type="text"
                                                            className="vo-input"
                                                            value={this.editResolutions}
                                                            onChange={this.handleEditResolutionsChange}
                                                        />

                                                        <label className="vo-label">{translate('scale_videooptimizer.library_codec')}</label>
                                                        <input
                                                            type="text"
                                                            className="vo-input"
                                                            value={this.editCodec}
                                                            onChange={this.handleEditCodecChange}
                                                        />

                                                        <div className="vo-actions">
                                                            <Button skin="primary" onClick={this.saveEdit} loading={this.saving}>
                                                                {translate('scale_videooptimizer.save')}
                                                            </Button>
                                                            <Button skin="secondary" onClick={this.cancelEdit}>
                                                                {translate('sulu_admin.cancel')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {this.reprocessResult && (
                        <div className="vo-message vo-message--success">
                            {translate('scale_videooptimizer.reprocess_queued', {count: this.reprocessResult.queued})}
                        </div>
                    )}

                    {this.error && <div className="vo-message vo-message--error">{this.error}</div>}
                </div>

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
