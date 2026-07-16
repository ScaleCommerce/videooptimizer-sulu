// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {Button} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';
import VideoSelectionOverlay from './VideoSelectionOverlay';

@observer
class VideoOptimizerField extends React.Component<*> {
    @observable overlayOpen = false;

    @action openOverlay = () => {
        this.overlayOpen = true;
    };

    @action closeOverlay = () => {
        this.overlayOpen = false;
    };

    handleSelect = (value: Object) => {
        this.props.onChange(value);
        this.props.onFinish();
    };

    handleRemove = () => {
        this.props.onChange(undefined);
        this.props.onFinish();
    };

    render() {
        const {value} = this.props;
        const hasVideo = value && value.uuid;

        return (
            <div className="vo-field">
                {hasVideo ? (
                    <div className="vo-field-preview">
                        {value.posterUrl
                            ? <img className="vo-field-thumb" src={value.posterUrl} alt={value.title || ''} />
                            : <span className="vo-field-thumb" />}
                        <div className="vo-field-meta">
                            <b>{value.title || translate('scale_videooptimizer.field_label')}</b>
                            <span className="vo-field-badge">{translate('scale_videooptimizer.selected')}</span>
                            <div className="vo-field-buttons">
                                <Button skin="secondary" onClick={this.openOverlay}>
                                    {translate('scale_videooptimizer.change_video')}
                                </Button>
                                <Button skin="link" onClick={this.handleRemove}>
                                    {translate('scale_videooptimizer.remove_video')}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="vo-field-empty">
                        <p>{translate('scale_videooptimizer.no_video')}</p>
                        <Button skin="primary" onClick={this.openOverlay}>
                            {translate('scale_videooptimizer.select_video')}
                        </Button>
                    </div>
                )}

                <VideoSelectionOverlay
                    open={this.overlayOpen}
                    onClose={this.closeOverlay}
                    onSelect={this.handleSelect}
                    locale={this.props.formInspector && this.props.formInspector.locale}
                />
            </div>
        );
    }
}

export default VideoOptimizerField;
