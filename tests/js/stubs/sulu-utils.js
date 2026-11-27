// Test double for sulu-admin-bundle/utils: returns the key and the interpolated values, so assertions stay readable.
export function translate(key, values) {
    return values ? key + ' ' + JSON.stringify(values) : key;
}
