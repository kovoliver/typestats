import { describe, it, expect } from 'vitest';
import FrequencyTable from '../../calculations/statistics/FrequencyTable';

describe('FrequencyTable Class', () => {
    const intervals: [number, number][] = [
        [10, 20],
        [20, 30],
        [30, 40],
        [40, 50]
    ];
    const frequencies = [5, 10, 15, 10];

    describe('Constructor and Validation', () => {
        it('should create an instance successfully', () => {
            const table = new FrequencyTable(intervals, frequencies);
            expect(table).toBeInstanceOf(FrequencyTable);
            expect(table.frequency).toBe(40);
        });

        it('should throw an error if intervals and frequencies length mismatch', () => {
            expect(() => new FrequencyTable([[10, 20]], [5, 10])).toThrowError(
                'Class intervals and frequencies must contain the same number of values!'
            );
        });
    });

    describe('Basic Vectors and Midpoints', () => {
        const table = new FrequencyTable(intervals, frequencies);

        it('should calculate midpoints correctly', () => {
            expect(table.midPoints).toEqual([15, 25, 35, 45]);
        });

        it('should return raw frequencies', () => {
            expect(table.frequencies).toEqual(frequencies);
        });

        it('should calculate cumulative frequencies correctly', () => {
            expect(table.cumulativeFrequencies).toEqual([5, 15, 30, 40]);
        });

        it('should calculate relative frequencies correctly', () => {
            expect(table.relativeFrequencies).toEqual([5/40, 10/40, 15/40, 10/40]);
        });

        it('should calculate cumulative relative frequencies correctly', () => {
            expect(table.cumulativeRelativeFrequencies).toEqual([5/40, 15/40, 30/40, 40/40]);
        });
    });

    describe('Value Sums and Aggregations', () => {
        const table = new FrequencyTable(intervals, frequencies);

        it('should calculate value sums per interval and grand total', () => {
            // Midpoints * frequencies: [15*5, 25*10, 35*15, 45*10] = [75, 250, 525, 450]
            expect(table.valueSums).toEqual([75, 250, 525, 450]);
            expect(table.valueSum).toBe(1300);
        });

        it('should calculate cumulative value sums', () => {
            expect(table.cumulativeValueSums).toEqual([75, 325, 850, 1300]);
        });

        it('should calculate relative and cumulative relative value sums', () => {
            expect(table.relativeValueSums[0]).toBeCloseTo(75 / 1300, 5);
            expect(table.cumulativeRelativeValueSums[3]).toBe(1);
        });

        it('should return complete frequency table object via getter', () => {
            const ft = table.frequencyTable;
            expect(ft).toHaveProperty('midPoints');
            expect(ft).toHaveProperty('frequencies');
            expect(ft).toHaveProperty('cumulativeFrequencies');
            expect(ft.frequencies).toEqual(frequencies);
        });
    });

    describe('Descriptive Statistics (Mean, Variance, Std, SSD)', () => {
        const table = new FrequencyTable(intervals, frequencies);

        it('should calculate estimated mean correctly', () => {
            // 1300 / 40 = 32.5
            expect(table.avg).toBe(32.5);
        });

        it('should calculate sum of squared deviations (SSD)', () => {
            expect(table.ssd).toBeGreaterThan(0);
        });

        it('should calculate population and sample variance', () => {
            expect(table.variance).toBeGreaterThan(0);
            expect(table.sampleVariance).toBeGreaterThan(table.variance);
        });

        it('should calculate population and sample standard deviation', () => {
            expect(table.std).toBeCloseTo(Math.sqrt(table.variance), 5);
            expect(table.sampleStd).toBeCloseTo(Math.sqrt(table.sampleVariance), 5);
        });

        it('should calculate relative standard deviation (RSD)', () => {
            expect(typeof table.relativeStd(false)).toBe('number');
            expect(typeof table.relativeStd(true)).toBe('number');
        });
    });

    describe('Higher Moments (Skewness, Kurtosis)', () => {
        const table = new FrequencyTable(intervals, frequencies);

        it('should calculate central moments, skewness, and kurtosis', () => {
            expect(typeof table.centralMoment(2)).toBe('number');
            expect(typeof table.skewness()).toBe('number');
            expect(typeof table.kurtosis()).toBe('number');
            expect(typeof table.excessKurtosis()).toBe('number');
        });
    });

    describe('Range, Modes, and Quantiles (Median, Quartiles, IQR)', () => {
        const table = new FrequencyTable(intervals, frequencies);

        it('should calculate range correctly', () => {
            // Max upper bound (50) - Min lower bound (10) = 40
            expect(table.range).toBe(40);
        });

        it('should calculate estimated modes', () => {
            const modes = table.modes;
            expect(Array.isArray(modes)).toBe(true);
            expect(modes.length).toBe(1);
        });

        it('should calculate quantiles with validation', () => {
            expect(table.median).toBeCloseTo(table.kvantile(2, 1), 5);
            expect(table.q1).toBeCloseTo(table.kvantile(4, 1), 5);
            expect(table.q3).toBeCloseTo(table.kvantile(4, 3), 5);
            expect(table.iqr).toBe(table.q3 - table.q1);

            // Error cases
            expect(() => table.kvantile(2.5, 1)).toThrowError('Quantile parameters n and k must be integers!');
            expect(() => table.kvantile(0, 1)).toThrowError('Quantile value n must be greater than zero!');
            expect(() => table.kvantile(4, 4)).toThrowError('k must be greater than 0 and less than n!');
        });
    });
});