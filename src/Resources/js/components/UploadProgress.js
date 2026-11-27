// @flow
import React from 'react';
import {Button} from 'sulu-admin-bundle/components';
import {translate} from 'sulu-admin-bundle/utils';

type Props = {
    status: ?string,
    // 0-100 while parts are uploaded, null otherwise (processing, ingest).
    percent: ?number,
    // Only given while the upload can still be cancelled (before the last part is complete).
    onCancel: ?() => void,
};

// Status line of a running upload: text, progress bar and a cancel button.
export default function UploadProgress({status, percent, onCancel}: Props) {
    if (!status) {
        return null;
    }
    const hasPercent = typeof percent === 'number';

    return (
        <div className="vo-upload-status" role="status">
            <span>{status}{hasPercent ? ' ' + String(percent) + ' %' : ''}</span>
            {hasPercent && <progress className="vo-progress" max="100" value={percent} />}
            {onCancel && <Button skin="link" onClick={onCancel}>{translate('scale_videooptimizer.cancel_upload')}</Button>}
        </div>
    );
}
