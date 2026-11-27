import {describe, expect, it} from 'vitest';
import {
    metadataPatch,
    metadataRows,
    parseTags,
    sameTags,
    validateMetadata,
    validateTags,
} from '../../src/Resources/js/services/videoMeta';

describe('tags', () => {
    it('parses a comma separated list: trimmed, no empties, unique ignoring case', () => {
        expect(parseTags(' Promo, 2026,, promo ,')).toEqual(['Promo', '2026']);
        expect(parseTags('')).toEqual([]);
    });

    it('enforces the API limits', () => {
        expect(validateTags(Array.from({length: 21}, (_, i) => 't' + i))).toBe('scale_videooptimizer.tags_too_many');
        expect(validateTags(['a'.repeat(51)])).toBe('scale_videooptimizer.tag_too_long');
        expect(validateTags(['ok'])).toBeNull();
    });

    it('compares tag sets in order', () => {
        expect(sameTags(['a', 'b'], ['a', 'b'])).toBe(true);
        expect(sameTags(['a'], ['a', 'b'])).toBe(false);
    });
});

describe('metadata', () => {
    it('shows the entries sorted by key', () => {
        expect(metadataRows({b: '2', a: '1'})).toEqual([{key: 'a', value: '1'}, {key: 'b', value: '2'}]);
        expect(metadataRows(null)).toEqual([]);
    });

    it('sends only changes: new and changed keys as values, removed keys as null', () => {
        const original = {cms_id: '1', old: 'x', same: 's'};
        const rows = [{key: 'cms_id', value: '2'}, {key: 'same', value: 's'}, {key: 'added', value: ' v '}, {key: '', value: ''}];

        expect(metadataPatch(original, rows)).toEqual({cms_id: '2', added: 'v', old: null});
    });

    it('reports no change when nothing differs', () => {
        expect(metadataPatch({a: '1'}, [{key: 'a', value: '1'}])).toBeNull();
        expect(metadataPatch(undefined, [])).toBeNull();
    });

    it('validates keys, values, duplicates and the entry limit', () => {
        expect(validateMetadata([{key: 'Cms', value: 'x'}])).toBe('scale_videooptimizer.metadata_key_invalid');
        expect(validateMetadata([{key: 'a', value: ''}])).toBe('scale_videooptimizer.metadata_value_invalid');
        expect(validateMetadata([{key: 'a', value: 'v'.repeat(65)}])).toBe('scale_videooptimizer.metadata_value_invalid');
        expect(validateMetadata([{key: 'a', value: '1'}, {key: 'a', value: '2'}])).toBe('scale_videooptimizer.metadata_key_duplicate');
        expect(validateMetadata(Array.from({length: 11}, (_, i) => ({key: 'k' + i, value: 'v'})))).toBe('scale_videooptimizer.metadata_too_many');
        expect(validateMetadata([{key: '', value: ''}, {key: 'cms_id', value: '42'}])).toBeNull();
    });
});
