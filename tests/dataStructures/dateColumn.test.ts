import { describe, it, expect } from 'vitest';
import DateColumn from '../../core/dataStructures/DateColumn';

describe('DateColumn Class', () => {
    const rawData = [
        '2023-01-15T10:30:45.500Z', // Index 0: Sunday, Jan 15, 2023
        '2023-06-20T18:15:00.000Z', // Index 1: Tuesday, Jun 20, 2023
        null,                       // Index 2: Null
        'invalid-date-string',      // Index 3: Invalid -> Null
        new Date('2024-02-29T00:00:00.000Z') // Index 4: Leap year date
    ];

    const col = new DateColumn(rawData, 'created_at');

    describe('Initialization & Index Access', () => {
        it('should parse valid dates and convert invalid ones to null', () => {
            expect(col.getElementByIndex(0)).toBeInstanceOf(Date);
            expect(col.getElementByIndex(2)).toBeNull();
            expect(col.getElementByIndex(3)).toBeNull();
        });

        it('should throw error for invalid indices', () => {
            expect(() => col.getElementByIndex(-1)).toThrow('You must provide a valid index!');
            expect(() => col.getElementByIndex(100)).toThrow('You must provide a valid index!');
            expect(() => col.getElementByIndex(1.5)).toThrow('You must provide a valid index!');
        });
    });

    describe('Getters for Date Components', () => {
        it('should extract correct date components', () => {
            expect(col.getYear(0)).toBe(2023);
            expect(col.getMonth(0)).toBe(1); // January (1-based)
            expect(col.getMonthName(0)).toBe('January');
            expect(col.getDayOfTheMonth(0)).toBe(15);
            expect(col.getDay(0)).toBe(0); // Sunday
            expect(col.getDayOfTheWeek(0)).toBe('Sunday');
        });

        it('should return null for null date entries', () => {
            expect(col.getYear(2)).toBeNull();
            expect(col.getMonthName(2)).toBeNull();
            expect(col.getHours(2)).toBeNull();
        });
    });

    describe('Date Comparisons', () => {
        it('should compare two dates correctly', () => {
            expect(col.compare(0, 1)).toBe(-1);
            expect(col.compare(1, 0)).toBe(1);
            expect(col.compare(0, 0)).toBe(0);
        });

        it('should throw an error if one date is null during comparison', () => {
            expect(() => col.compare(0, 2)).toThrow('One of the dates are invalid!');
        });

        it('should compare date with external Date object', () => {
            const external = new Date('2023-01-15T10:30:45.500Z');
            expect(col.compareDates(0, external)).toBe(0);
        });
    });

    describe('Date Difference (getDiff)', () => {
        it('should calculate difference in days/hours correctly', () => {
            // Index 0: Jan 15, Index 1: Jun 20
            const diffDays = col.getDiff(1, 0, 'days');
            expect(diffDays).toBe(156);
        });

        it('should throw error when trying to calculate diff with null date', () => {
            expect(() => col.getDiff(0, 2, 'days')).toThrow('One of the dates is invalid at the given indices!');
        });
    });

    describe('Arithmetic (add & subtract)', () => {
        it('should add time units correctly', () => {
            const result = col.add(0, 5, 'days');
            expect(result?.toISOString()).toBe('2023-01-20T10:30:45.500Z');
        });

        it('should subtract time units correctly', () => {
            const result = col.subtract(0, 1, 'hours');
            expect(result?.toISOString()).toBe('2023-01-15T09:30:45.500Z');
        });

        it('should return null when adding to a null date entry', () => {
            expect(col.add(2, 5, 'days')).toBeNull();
        });

        it('should throw error if amount is not integer', () => {
            expect(() => col.add(0, 2.5, 'days')).toThrow("You must provide a valid 'amount' argument!");
        });
    });

    describe('Formatting (format)', () => {
        it('should format date using valid patterns', () => {
            expect(col.format(0, 'yyyy-MM-dd')).toBe('2023-01-15');
        });

        it('should throw error if component order is invalid or incomplete', () => {
            expect(() => col.format(0, 'dd-MM-yyyy')).toThrow(); // Invalid order (d before y)
            expect(() => col.format(0, 'yyyy-MM')).toThrow(); // Missing 'd'
        });

        it('should throw error when formatting a null date', () => {
            expect(() => col.format(2, 'yyyy-MM-dd')).toThrow('The date is invalid at the given index!');
        });
    });

    describe('Sorting & Range Operations', () => {
        it('should order dates ascending with nulls at the end', () => {
            const sortedAsc = col.orderAsc();
            expect(sortedAsc.getElementByIndex(0)?.toISOString()).toBe('2023-01-15T10:30:45.500Z');
            expect(sortedAsc.getElementByIndex(2)?.toISOString()).toBe('2024-02-29T00:00:00.000Z');
            expect(sortedAsc.getElementByIndex(3)).toBeNull(); // Nulls pushed to back
        });

        it('should find min, max, and range correctly', () => {
            expect(col.min()?.toISOString()).toBe('2023-01-15T10:30:45.500Z');
            expect(col.max()?.toISOString()).toBe('2024-02-29T00:00:00.000Z');

            const range = col.range();
            expect(range.min?.toISOString()).toBe('2023-01-15T10:30:45.500Z');
            expect(range.max?.toISOString()).toBe('2024-02-29T00:00:00.000Z');
        });
    });

    describe('Filtering & Transformations', () => {
        it('should filter within date range', () => {
            const start = new Date('2023-01-01');
            const end = new Date('2023-01-31');
            const filtered = col.filterRange(start, end);

            expect(filtered.values.length).toBe(1);
            expect(filtered.getElementByIndex(0)?.toISOString()).toBe('2023-01-15T10:30:45.500Z');
        });

        it('should floor date to specified unit', () => {
            const floored = col.floor('days');
            expect(floored.getElementByIndex(0)?.toISOString()).toBe('2023-01-15T00:00:00.000Z');
        });

        it('should compute diffColumn against another DateColumn', () => {
            const col2 = new DateColumn([
                '2023-01-10T10:30:45.500Z',
                '2023-06-20T18:15:00.000Z',
                '2023-01-01T00:00:00.000Z',
                null,
                null
            ], 'start_dates');

            const diffs = col.diffColumn(col2, 'days');
            expect(diffs).toEqual([5, 0, null, null, null]);
        });

        it('should throw error in diffColumn if column lengths do not match', () => {
            const shortCol = new DateColumn(['2023-01-01'], 'short');
            expect(() => col.diffColumn(shortCol, 'days')).toThrow('Columns must have the same length!');
        });
    });
});