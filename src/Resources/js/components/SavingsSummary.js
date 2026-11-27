// @flow
import React from 'react';
import {observer} from 'mobx-react';
import {observable, action} from 'mobx';
import {translate} from 'sulu-admin-bundle/utils';
import {getSavings} from '../services/api';
import {formatBytes, formatPercent, lastDaysRange} from '../services/format';

const RANGE_DAYS = 30;

// What VideoOptimizer saves compared to serving the original files: smaller files, and (when the API has
// traffic data) the estimated bandwidth saved in the last 30 days and since the beginning. Purely
// informational, so a failed request simply hides the box.
@observer
class SavingsSummary extends React.Component<*> {
    @observable savings = null;

    _unmounted = false;

    componentDidMount() {
        getSavings(lastDaysRange(RANGE_DAYS))
            .then(action((savings) => {
                if (!this._unmounted) { this.savings = savings; }
            }))
            .catch(() => {});
    }

    componentWillUnmount() {
        this._unmounted = true;
    }

    stat(label: string, value: string, hint: ?string) {
        return (
            <div className="vo-stat" key={label}>
                <div className="vo-stat__label">{label}</div>
                <div className="vo-stat__value">{value}</div>
                {hint && <div className="vo-stat__hint">{hint}</div>}
            </div>
        );
    }

    render() {
        const savings = this.savings;
        const compression = savings && savings.compression;
        if (!savings || !compression || !compression.videos) {
            return null;
        }
        const stats = [
            this.stat(translate('scale_videooptimizer.savings_videos'), String(compression.videos)),
            this.stat(
                translate('scale_videooptimizer.savings_smaller'),
                formatPercent(compression.reduced_percent) + ' %',
                formatBytes(compression.original_bytes) + ' → ' + formatBytes(compression.encoded_bytes)
            ),
        ];
        if (savings.traffic_available) {
            if (savings.range) {
                stats.push(this.stat(
                    translate('scale_videooptimizer.savings_bandwidth_range', {days: RANGE_DAYS}),
                    formatBytes(savings.range.saved_bytes),
                    formatPercent(savings.range.saved_percent) + ' % ' + translate('scale_videooptimizer.savings_of_delivered', {delivered: formatBytes(savings.range.delivered_bytes)})
                ));
            }
            if (savings.all_time) {
                stats.push(this.stat(
                    translate('scale_videooptimizer.savings_bandwidth_all'),
                    formatBytes(savings.all_time.saved_bytes),
                    formatPercent(savings.all_time.saved_percent) + ' % ' + translate('scale_videooptimizer.savings_of_delivered', {delivered: formatBytes(savings.all_time.delivered_bytes)})
                ));
            }
        }

        return (
            <div className="vo-savings">
                <h2 className="vo-savings__title">{translate('scale_videooptimizer.savings')}</h2>
                <div className="vo-stats">{stats}</div>
                <div className="vo-hint" style={{padding: '4px 0 0'}}>{translate('scale_videooptimizer.savings_help')}</div>
            </div>
        );
    }
}

export default SavingsSummary;
