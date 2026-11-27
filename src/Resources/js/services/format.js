// @flow
// Number and date formatting shared by the admin views.

// Formats a byte count as a human-readable size (e.g. 1536 -> "1.5 KB").
export function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exponent);

    return (exponent === 0 ? value : value.toFixed(1)) + ' ' + units[exponent];
}

// 78.24 -> "78.2" (locale-aware decimal separator); non-numbers give "0".
export function formatPercent(value: ?number, locale: ?string): string {
    const number = typeof value === 'number' && isFinite(value) ? value : 0;

    return new Intl.NumberFormat(locale || undefined, {maximumFractionDigits: 1}).format(number);
}

// UTC day as YYYY-MM-DD (the API's date format).
export function utcDay(date: Date): string {
    return date.toISOString().slice(0, 10);
}

// The last `days` UTC days up to and including today, as the API's from/to range (max. 366 days).
export function lastDaysRange(days: number, now: Date = new Date()): {from: string, to: string} {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));

    return {from: utcDay(from), to: utcDay(now)};
}
