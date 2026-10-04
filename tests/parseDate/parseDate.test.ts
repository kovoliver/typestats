import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { displayDateString, toUTCTimestampFast } from '../../core/utils/utils';

const ZONES: [string, number][] = [
    ['UTC', 0],
    ['Europe/Budapest', -60],
    ['America/New_York', 300],
    ['America/Los_Angeles', 480],
    ['Asia/Tokyo', -540],
    ['Asia/Kolkata', -330],
    ['Asia/Kathmandu', -345],
    ['Australia/Sydney', -660],
];

type Case = {
    input: string;
    iso: string;
    display: string;
};

const c = (input: string, iso: string, display: string): Case => ({ input, iso, display });

const ZONELESS: Case[] = [
    c('2024-01-01',                    '2024-01-01T00:00:00.000Z', '2024-01-01'),
    c('2024-01-01 00:00:00',           '2024-01-01T00:00:00.000Z', '2024-01-01'),
    c('2024-01-01T00:00:00',           '2024-01-01T00:00:00.000Z', '2024-01-01'),
    c('2024-01-01 12:30:45',           '2024-01-01T12:30:45.000Z', '2024-01-01 12:30:45'),
    c('2024-01-01T12:30:45',           '2024-01-01T12:30:45.000Z', '2024-01-01 12:30:45'),
    c('2024-01-01 12:30',              '2024-01-01T12:30:00.000Z', '2024-01-01 12:30:00'),
    c('2024-01-01T12:30',              '2024-01-01T12:30:00.000Z', '2024-01-01 12:30:00'),
    c('2024-01-01 12:30:45.123',       '2024-01-01T12:30:45.123Z', '2024-01-01 12:30:45'),
    c('2024-01-01T12:30:45.123',       '2024-01-01T12:30:45.123Z', '2024-01-01 12:30:45'),
    c('2025-05-11 12:12:12',           '2025-05-11T12:12:12.000Z', '2025-05-11 12:12:12'),
    c('05/11/2025 12:12:12',           '2025-05-11T12:12:12.000Z', '2025-05-11 12:12:12'),
    c('12/31/2023 23:59:59',           '2023-12-31T23:59:59.000Z', '2023-12-31 23:59:59'),
    c('Jan 1 2024 12:30:00',           '2024-01-01T12:30:00.000Z', '2024-01-01 12:30:00'),
    c('January 1, 2024 12:30:00',      '2024-01-01T12:30:00.000Z', '2024-01-01 12:30:00'),
    c('2024-02-29 12:00:00',           '2024-02-29T12:00:00.000Z', '2024-02-29 12:00:00'),
    c('2024-12-31 23:59:59',           '2024-12-31T23:59:59.000Z', '2024-12-31 23:59:59'),
    c('2024-06-15 00:00:01',           '2024-06-15T00:00:01.000Z', '2024-06-15 00:00:01'),
    c('1999-12-31 23:59:59',           '1999-12-31T23:59:59.000Z', '1999-12-31 23:59:59'),
    c('2024-07-01 12:00:00',           '2024-07-01T12:00:00.000Z', '2024-07-01 12:00:00'),
    c('2024-10-27 02:30:00',           '2024-10-27T02:30:00.000Z', '2024-10-27 02:30:00'),
    c('2024-11-03 01:30:00',           '2024-11-03T01:30:00.000Z', '2024-11-03 01:30:00'),
    c('2024-04-07 02:30:00',           '2024-04-07T02:30:00.000Z', '2024-04-07 02:30:00'),
];

const ZONED: Case[] = [
    c('2024-01-01T12:30:45Z',          '2024-01-01T12:30:45.000Z', '2024-01-01 12:30:45'),
    c('2024-01-01T12:30:45z',          '2024-01-01T12:30:45.000Z', '2024-01-01 12:30:45'),
    c('2024-01-01T12:30:45.123Z',      '2024-01-01T12:30:45.123Z', '2024-01-01 12:30:45'),
    c('2024-01-01T00:00:00Z',          '2024-01-01T00:00:00.000Z', '2024-01-01'),
    c('2024-01-01T12:30:45+00:00',     '2024-01-01T12:30:45.000Z', '2024-01-01 12:30:45'),
    c('2024-01-01T12:30:45+08:00',     '2024-01-01T04:30:45.000Z', '2024-01-01 04:30:45'),
    c('2024-01-01T12:30:45+0800',      '2024-01-01T04:30:45.000Z', '2024-01-01 04:30:45'),
    c('2024-01-01T12:30:45-05:00',     '2024-01-01T17:30:45.000Z', '2024-01-01 17:30:45'),
    c('2024-01-01T12:30:45-0500',      '2024-01-01T17:30:45.000Z', '2024-01-01 17:30:45'),
    c('2024-01-01T12:30:45+05:30',     '2024-01-01T07:00:45.000Z', '2024-01-01 07:00:45'),
    c('2024-01-01T12:30:45+05:45',     '2024-01-01T06:45:45.000Z', '2024-01-01 06:45:45'),
    c('2024-07-01T12:00:00+02:00',     '2024-07-01T10:00:00.000Z', '2024-07-01 10:00:00'),
    c('2020-04-13T00:00:00.000+08:00', '2020-04-12T16:00:00.000Z', '2020-04-12 16:00:00'),
    c('2024-01-01T01:00:00+02:00',     '2023-12-31T23:00:00.000Z', '2023-12-31 23:00:00'),
    c('2024-01-01 12:30:45 UTC',       '2024-01-01T12:30:45.000Z', '2024-01-01 12:30:45'),
    c('2024-01-01 12:30:45 GMT',       '2024-01-01T12:30:45.000Z', '2024-01-01 12:30:45'),
    c('Mon, 01 Jan 2024 12:30:45 GMT', '2024-01-01T12:30:45.000Z', '2024-01-01 12:30:45'),
    c('Mon, 01 Jan 2024 12:30:45 +0100', '2024-01-01T11:30:45.000Z', '2024-01-01 11:30:45'),
    c('Mon Jan 01 2024 12:30:45 GMT+0100 (Central European Standard Time)',
                                       '2024-01-01T11:30:45.000Z', '2024-01-01 11:30:45'),
];

const INVALID: string[] = [
    '',
    '   ',
    'abc',
    'aéskdjf élakjsdaf GMT',
    '2024-13-01',
    '2024-01-32 12:00:00',
    '2024-01-01 25:00:00',
];

const GAP_CASES: Case[] = [
    c('2024-03-31 02:30:00', '2024-03-31T02:30:00.000Z', '2024-03-31 02:30:00'),
    c('2024-03-10 02:30:00', '2024-03-10T02:30:00.000Z', '2024-03-10 02:30:00'),
    c('2024-10-06 02:30:00', '2024-10-06T02:30:00.000Z', '2024-10-06 02:30:00'),
];

function existsLocally(input: string): boolean {
    const [datePart, timePart] = input.split(' ');
    const [y, mo, d] = datePart.split('-').map(Number);
    const [h, mi] = timePart.split(':').map(Number);
    const local = new Date(y, mo - 1, d, h, mi);
    return local.getHours() === h && local.getMinutes() === mi;
}

function expectCase({ input, iso, display }: Case): void {
    const ts = toUTCTimestampFast(input);

    expect(ts, `timestamp: ${input}`).toBe(Date.parse(iso));
    expect(new Date(ts as number).toISOString(), `ISO: ${input}`).toBe(iso);
    expect(displayDateString(new Date(ts as number)), `display: ${input}`).toBe(display);
}

describe.each(ZONES)('toUTCTimestampFast - TZ=%s', (tz, expectedOffset) => {
    const originalTZ = process.env.TZ;

    beforeAll(() => {
        process.env.TZ = tz;
    });

    afterAll(() => {
        if (originalTZ === undefined) delete process.env.TZ;
        else process.env.TZ = originalTZ;
    });

    it('should properly set the timezone offset', () => {
        expect(new Date(2024, 0, 1).getTimezoneOffset()).toBe(expectedOffset);
    });

    describe('zoneless input = UTC', () => {
        it.each(ZONELESS.map(x => [x.input, x] as const))('%s', (_label, tc) => {
            expectCase(tc);
        });
    });

    describe('zoned input: provided zone is applied', () => {
        it.each(ZONED.map(x => [x.input, x] as const))('%s', (_label, tc) => {
            expectCase(tc);
        });
    });

    describe('invalid input = null', () => {
        it.each(INVALID.map(x => [JSON.stringify(x), x] as const))('%s', (_label, input) => {
            expect(toUTCTimestampFast(input)).toBeNull();
        });
    });

    describe('trim', () => {
        it('should ignore surrounding whitespace', () => {
            const ts = toUTCTimestampFast('  2024-01-01 12:30:45  ');
            expect(ts).toBe(Date.UTC(2024, 0, 1, 12, 30, 45));
        });
    });

    describe('DST gap (known limitation)', () => {
        it.each(GAP_CASES.map(x => [x.input, x] as const))('%s', (_label, tc) => {
            if (existsLocally(tc.input)) {
                expectCase(tc);
            } else {
                expect(() => expectCase(tc)).toThrow();
            }
        });
    });
});

describe('toUTCTimestampFast - same input yields same result across all timezones', () => {
    const originalTZ = process.env.TZ;

    afterAll(() => {
        if (originalTZ === undefined) delete process.env.TZ;
        else process.env.TZ = originalTZ;
    });

    it.each([
        '2024-01-01 12:30:45',
        '2024-01-01',
        '2024-01-01T12:30:45Z',
        '2020-04-13T00:00:00.000+08:00',
    ])('%s', (input) => {
        const results = new Set();

        for (const [tz] of ZONES) {
            process.env.TZ = tz;
            results.add(toUTCTimestampFast(input));
        }

        expect(results.size).toBe(1);
    });
});