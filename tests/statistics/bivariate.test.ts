import { describe, it, expect } from 'vitest';
import getColumns, {
    totalCount,
    getColumn,
    calcCombinationTable,
    chiSquare,
    cramerV,
    withinSSD,
    totalSSD,
    betweenSSD,
    etaSquared,
    covariance,
    correlation,
    getRanks,
    rankCorrelation
} from '../../calculations/statistics/bivariate';

describe('Bivariate and Matrix Statistical Functions', () => {
    const contingencyTable = [
        [10, 20],
        [30, 40]
    ];

    describe('Contingency Table and Matrix Operations', () => {
        it('should calculate total count correctly', () => {
            expect(totalCount(contingencyTable)).toBe(100);
            expect(() => totalCount([])).toThrowError('The data table should contain at least one row!');
        });

        it('should extract a specific column correctly', () => {
            expect(getColumn(contingencyTable, 0)).toEqual([10, 30]);
            expect(() => getColumn(contingencyTable, 5)).toThrowError('The given column does not exist!');
        });

        it('should extract all columns via default export', () => {
            expect(getColumns(contingencyTable)).toEqual([
                [10, 30],
                [20, 40]
            ]);
        });

        it('should calculate combination table (marginal totals) correctly', () => {
            const comb = calcCombinationTable(contingencyTable);
            expect(comb).toEqual([
                [10, 20, 30],
                [30, 40, 70],
                [40, 60, 100]
            ]);
        });
    });

    describe('Independence Test and Association (Chi-Square & Cramér V)', () => {
        it('should calculate Chi-Square statistic', () => {
            const chi = chiSquare(contingencyTable, 2);
            expect(typeof chi).toBe('number');
            expect(chi).toBeGreaterThanOrEqual(0);
        });

        it('should calculate Cramérs V coefficient within [0, 1]', () => {
            const v = cramerV(contingencyTable, 4);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
        });
    });

    describe('ANOVA SSD and Eta Squared', () => {
        const groupTable = [
            [2, 4],
            [3, 5],
            [4, 6]
        ];

        it('should calculate within, total, and between SSD correctly', () => {
            expect(typeof withinSSD(groupTable)).toBe('number');
            expect(typeof totalSSD(groupTable)).toBe('number');
            expect(typeof betweenSSD(groupTable)).toBe('number');
        });

        it('should calculate within, total, and between SSD correctly', () => {
            const testTable = [
                [1, 2, 3], 
                [3, 4, 5], 
                [5, 6, 7]
            ];
            
            expect(betweenSSD(testTable)).toBe(24);
        });

        it('should calculate Eta Squared effect size', () => {
            const eta = etaSquared(groupTable, 4);
            expect(eta).toBeGreaterThanOrEqual(0);
            expect(eta).toBeLessThanOrEqual(1);
        });
    });

    describe('Covariance and Pearson Correlation', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [2, 4, 6, 8, 10];

        it('should calculate population and sample covariance', () => {
            expect(covariance(x, y, false)).toBe(4);
            expect(covariance(x, y, true)).toBe(5);
            expect(() => covariance([1], [2], true)).toThrowError('Sample covariance requires at least 2 data points.');
            expect(() => covariance([1, 2], [1], false)).toThrowError('The number of elements must match in the two arrays!');
        });

        it('should calculate Pearson correlation coefficient', () => {
            expect(correlation(x, y)).toBe(1);
            expect(correlation([5, 5, 5], [1, 2, 3])).toBe(0); // Zero std dev edge case
        });
    });

    describe('Ranks and Spearman Correlation', () => {
        it('should compute fractional ranks correctly', () => {
            const ranks = getRanks([10, 20, 20, 30]);
            expect(ranks.get(10)).toBe(1);
            expect(ranks.get(20)).toBe(2.5);
            expect(ranks.get(30)).toBe(4);
            expect(() => getRanks([1])).toThrowError('Values array must contain at least 2 numbers!');
        });

        it('should calculate Spearman rank correlation coefficient', () => {
            const x = [1, 2, 3, 4, 5];
            const y = [1, 2, 4, 3, 5];
            const r = rankCorrelation(x, y, false, 2);
            expect(typeof r).toBe('number');
            expect(r).toBeGreaterThanOrEqual(-1);
            expect(r).toBeLessThanOrEqual(1);
        });
    });
});