// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Loader} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';
import {getLibraries, getVideos, posterFor} from '../services/api';
import VideoDetail from '../components/VideoDetail';

@observer
class Videos extends React.Component<*> {
    @observable loading = true;
    @observable libraries = [];
    @observable libraryId = '';
    @observable videos = [];
    @observable loadingVideos = false;
    @observable selected = null;
    @observable error = null;

    componentDidMount() {
        getLibraries()
            .then(action((libraries) => {
                this.libraries = libraries;
                this.loading = false;
                if (libraries[0]) {
                    this.selectLibrary(libraries[0].id);
                }
            }))
            .catch(action((e) => { this.loading = false; this.error = e.message || String(e); }));
    }

    @action selectLibrary = (id) => {
        this.libraryId = id;
        this.selected = null;
        this.videos = [];
        this.loadingVideos = true;
        getVideos(id)
            .then(action((videos) => { this.videos = videos; this.loadingVideos = false; }))
            .catch(action((e) => { this.loadingVideos = false; this.error = e.message || String(e); }));
    };

    @action open = (video) => { this.selected = video; };
    @action back = () => { this.selected = null; };
    @action onChanged = (video) => { this.selected = video; this.videos = this.videos.map((v) => v.uuid === video.uuid ? video : v); };
    @action onDeleted = () => { const id = this.selected.uuid; this.selected = null; this.videos = this.videos.filter((v) => v.uuid !== id); };

    render() {
        if (this.loading) {
            return <div className="vo-page"><Loader /></div>;
        }

        return (
            <div className="vo-page">
                <div className="vo-card">
                    <h1>{translate('scale_videooptimizer.videos_nav')}</h1>
                    <select className="vo-select" value={this.libraryId} onChange={(e) => this.selectLibrary(e.target.value)}>
                        {this.libraries.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>

                    {this.selected ? (
                        <React.Fragment>
                            <button type="button" className="vo-tab" onClick={this.back}>← {translate('scale_videooptimizer.back')}</button>
                            <VideoDetail video={this.selected} onChanged={this.onChanged} onDeleted={this.onDeleted} />
                        </React.Fragment>
                    ) : this.loadingVideos ? <Loader /> : (
                        <div className="vo-video-grid">
                            {this.videos.map((video) => (
                                <button key={video.uuid} type="button" className="vo-video" onClick={() => this.open(video)}>
                                    {posterFor(video) ? <img src={posterFor(video)} alt="" /> : <span className="vo-video-ph">▶</span>}
                                    <span className="vo-video-title">{video.title || video.uuid}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {this.error && <div className="vo-message vo-message--error">{this.error}</div>}
                </div>
            </div>
        );
    }
}

export default Videos;
