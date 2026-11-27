// @flow
// What the current admin user may do with VideoOptimizer, as sent by the server in the admin config
// (config key `scale_videooptimizer`, field `permissions`, per area and permission type). The API refuses forbidden calls
// either way: this only hides the buttons. Without a config (e.g. an older server part) everything is allowed.

let permissions: ?{[string]: {[string]: boolean}} = null;

export function setPermissions(value: mixed) {
    permissions = value && typeof value === 'object' ? ((value: any): {[string]: {[string]: boolean}}) : null;
}

export function can(area: string, type: string): boolean {
    if (!permissions) {
        return true;
    }
    const entry = permissions[area];
    if (!entry || typeof entry[type] !== 'boolean') {
        return true;
    }

    return entry[type];
}
