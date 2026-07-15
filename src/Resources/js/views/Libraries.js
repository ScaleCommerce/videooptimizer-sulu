// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Button, Loader, Dialog} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';
import {getLibraries, createLibrary, deleteLibrary} from '../services/api';

@observer
class Libraries extends React.Component<*> {
    @observable loading = true;
    @observable libraries = [];
    @observable newName = '';
    @observable creating = false;
    @observable error = null;
    @observable deleteId = null;
    @observable deleting = false;

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

    @action handleCreate = () => {
        if (!this.newName.trim()) {
            return;
        }
        this.creating = true;
        this.error = null;
        createLibrary({name: this.newName.trim()})
            .then(action(() => {
                this.newName = '';
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

    render() {
        if (this.loading) {
            return <div className="vo-page"><Loader /></div>;
        }

        return (
            <div className="vo-page">
                <div className="vo-card">
                    <h1>{translate('scale_videooptimizer.libraries_nav')}</h1>

                    <label className="vo-label">{translate('scale_videooptimizer.new_library')}</label>
                    <div className="vo-actions" style={{marginTop: 0}}>
                        <input
                            type="text"
                            className="vo-input"
                            value={this.newName}
                            placeholder={translate('scale_videooptimizer.library_name')}
                            onChange={this.handleNameChange}
                        />
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
                                    <tr key={library.id} style={{borderTop: '1px solid #e4e7ec'}}>
                                        <td style={{padding: '12px 0', fontWeight: 600}}>{library.name}</td>
                                        <td style={{padding: '12px 0', color: '#667085', fontSize: 12}}>{library.id}</td>
                                        <td style={{padding: '12px 0', textAlign: 'right'}}>
                                            <Button skin="link" onClick={() => this.askDelete(library.id)}>
                                                {translate('scale_videooptimizer.delete')}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
            </div>
        );
    }
}

export default Libraries;
