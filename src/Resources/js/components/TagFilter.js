// @flow
import React from 'react';
import {translate} from 'sulu-admin-bundle/utils';

type Props = {
    tags: Array<{name: string, video_count?: number}>,
    value: string,
    onChange: (value: string) => void,
};

// Filters a video list by one tag (the API returns only videos carrying it). Hidden while the organization has no tags.
export default function TagFilter({tags, value, onChange}: Props) {
    if (tags.length === 0) {
        return null;
    }

    return (
        <select
            className="vo-input vo-input--auto"
            aria-label={translate('scale_videooptimizer.filter_by_tag')}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        >
            <option value="">{translate('scale_videooptimizer.all_tags')}</option>
            {tags.map((tag) => (
                <option key={tag.name} value={tag.name}>{tag.name} ({tag.video_count || 0})</option>
            ))}
        </select>
    );
}
