import {describe, expect, it} from 'vitest';
import {formatBytes, formatPercent, lastDaysRange, utcDay} from '../../src/Resources/js/services/format';

describe('format', () => {
    it('formats byte sizes', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(-5)).toBe('0 B');
        expect(formatBytes(512)).toBe('512 B');
        expect(formatBytes(1536)).toBe('1.5 KB');
        expect(formatBytes(5 * 1024 ** 3)).toBe('5.0 GB');
        expect(formatBytes(3 * 1024 ** 5)).toBe('3072.0 TB');
    });

    it('formats percentages with at most one decimal', () => {
        expect(formatPercent(78.24, 'en')).toBe('78.2');
        expect(formatPercent(78.25, 'de')).toBe('78,3');
        expect(formatPercent(80, 'en')).toBe('80');
        expect(formatPercent(undefined, 'en')).toBe('0');
        expect(formatPercent(NaN, 'en')).toBe('0');
    });

    it('builds the UTC day range ending today', () => {
        expect(utcDay(new Date('2026-11-27T23:30:00Z'))).toBe('2026-11-27');
        expect(lastDaysRange(30, new Date('2026-11-27T23:30:00Z'))).toEqual({from: '2026-10-29', to: '2026-11-27'});
        expect(lastDaysRange(1, new Date('2026-03-01T00:10:00Z'))).toEqual({from: '2026-03-01', to: '2026-03-01'});
    });
});
