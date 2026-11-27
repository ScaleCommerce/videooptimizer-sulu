import {beforeEach, describe, expect, it} from 'vitest';
import {can, setPermissions} from '../../src/Resources/js/services/permissions';

describe('permissions', () => {
    beforeEach(() => setPermissions(null));

    it('allows everything while the server sent no permissions', () => {
        expect(can('videos', 'delete')).toBe(true);
        setPermissions(undefined);
        expect(can('settings', 'edit')).toBe(true);
    });

    it('follows the permissions of the admin config', () => {
        setPermissions({videos: {view: true, add: false, edit: true, delete: false}, settings: {view: true, edit: false}});

        expect(can('videos', 'view')).toBe(true);
        expect(can('videos', 'add')).toBe(false);
        expect(can('videos', 'delete')).toBe(false);
        expect(can('settings', 'edit')).toBe(false);
    });

    it('does not lock out areas or types the server did not mention', () => {
        setPermissions({videos: {view: false}});

        expect(can('libraries', 'edit')).toBe(true);
        expect(can('videos', 'edit')).toBe(true);
    });
});
