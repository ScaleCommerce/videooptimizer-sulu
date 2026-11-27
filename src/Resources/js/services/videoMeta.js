// @flow
// Tags and metadata of a video: parsing, validation and the PATCH payload. The limits mirror the API
// (and the proxy, which validates again): 20 tags of 1-50 characters without commas; 10 metadata keys
// of 1-40 characters `a-z 0-9 _ . -` (starting with a letter or digit) with string values of 1-64 characters.

export const MAX_TAGS = 20;
export const MAX_METADATA = 10;

const KEY_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,39}$/;

// "Promo, 2026,, promo" -> ["Promo", "2026"]: trimmed, no empties, unique ignoring case (first spelling wins).
export function parseTags(text: string): Array<string> {
    const seen = {};
    const tags = [];
    text.split(',').forEach((part) => {
        const tag = part.trim();
        const folded = tag.toLowerCase();
        if (tag !== '' && !seen[folded]) {
            seen[folded] = true;
            tags.push(tag);
        }
    });

    return tags;
}

// Translation key of the first problem, or null.
export function validateTags(tags: Array<string>): ?string {
    if (tags.length > MAX_TAGS) {
        return 'scale_videooptimizer.tags_too_many';
    }
    if (tags.some((tag) => tag.length > 50)) {
        return 'scale_videooptimizer.tag_too_long';
    }

    return null;
}

export type MetadataRow = {key: string, value: string};

export function metadataRows(metadata: ?Object): Array<MetadataRow> {
    return Object.keys(metadata || {}).sort().map((key) => ({key, value: String((metadata || {})[key])}));
}

// Translation key of the first problem in the edited rows, or null.
export function validateMetadata(rows: Array<MetadataRow>): ?string {
    const keys = {};
    for (let i = 0; i < rows.length; i++) {
        const key = rows[i].key.trim();
        const value = rows[i].value.trim();
        if (key === '' && value === '') {
            continue;
        }
        if (!KEY_PATTERN.test(key)) {
            return 'scale_videooptimizer.metadata_key_invalid';
        }
        if (keys[key]) {
            return 'scale_videooptimizer.metadata_key_duplicate';
        }
        keys[key] = true;
        if (value === '' || value.length > 64) {
            return 'scale_videooptimizer.metadata_value_invalid';
        }
    }
    if (Object.keys(keys).length > MAX_METADATA) {
        return 'scale_videooptimizer.metadata_too_many';
    }

    return null;
}

// The API merges metadata: a key sent is set, a key with null is removed, keys left out stay.
// Returns only what changed, or null when nothing did.
export function metadataPatch(original: ?Object, rows: Array<MetadataRow>): ?Object {
    const before = original || {};
    const after = {};
    rows.forEach((row) => {
        const key = row.key.trim();
        if (key !== '') {
            after[key] = row.value.trim();
        }
    });

    const patch = {};
    Object.keys(after).forEach((key) => {
        if (before[key] !== after[key]) {
            patch[key] = after[key];
        }
    });
    Object.keys(before).forEach((key) => {
        if (!(key in after)) {
            patch[key] = null;
        }
    });

    return Object.keys(patch).length > 0 ? patch : null;
}

export function sameTags(a: Array<string>, b: Array<string>): boolean {
    return a.length === b.length && a.every((tag, index) => tag === b[index]);
}
