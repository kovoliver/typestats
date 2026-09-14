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
} from '../../core/statistics/bivariate';

describe('Bivariate and Matrix Statistical Functions', () => {
    describe('Contingency Table and Matrix Operations', () => {
        const contingencyTable = [
            [10, 20],
            [30, 40]
        ];

        it('should calculate total count correctly', () => {
            expect(totalCount(contingencyTable)).toBe(100);
            expect(() => totalCount([])).toThrow('The data table should contain at least one row!');
        });

        it('should extract a specific column correctly', () => {
            expect(getColumn(contingencyTable, 0)).toEqual([10, 30]);
            expect(() => getColumn(contingencyTable, 5)).toThrow('The given column does not exist!');
        });

        it('should extract all columns via getColumns', () => {
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

    describe('Independence Test and Association (Cramér V)', () => {
        it('Table 1 (2x2 asymmetric): should calculate exact Cramér V', () => {
            const table = [
                [10, 20],
                [30, 40]
            ];

            expect(cramerV(table)).toBeCloseTo(0.089087, 6);
        });

        it('Table 2 (2x2 independent): should return 0 for Cramér V on perfectly independent table', () => {
            const table = [
                [10, 20],
                [20, 40]
            ];
            expect(cramerV(table)).toBe(0);
        });

        it('Table 3 (3x2 non-square): should calculate exact Cramér V for non-square matrix', () => {
            const table = [
                [20, 6],
                [25, 12],
                [38, 40]
            ];
            expect(cramerV(table)).toBeCloseTo(0.237830, 6);
        });

        it('Table 4 (3x3 square): should calculate exact Cramér V for 3x3 matrix', () => {
            const table = [
                [50, 10, 20],
                [15, 45, 30],
                [25, 20, 55]
            ];
            expect(cramerV(table)).toBeCloseTo(0.350283, 6);
        });
    });

    describe('ANOVA SSD and Eta Squared', () => {
        const groupTable = [
            [2, 4],
            [3, 5],
            [4, 6]
        ];

        it('should calculate exact Within, Between, and Total SSD', () => {
            expect(withinSSD(groupTable)).toBe(6);
            expect(betweenSSD(groupTable)).toBe(4);
            expect(totalSSD(groupTable)).toBe(10);
        });

        it('should calculate exact Eta Squared effect size', () => {
            const eta = etaSquared(groupTable, 4);
            expect(eta).toBe(0.4);
        });

        it('should satisfy the identity SSD_total = SSD_within + SSD_between', () => {
            const testTable = [
                [1, 2, 3],
                [3, 4, 5],
                [5, 6, 7]
            ];
            const w = withinSSD(testTable);
            const b = betweenSSD(testTable);
            const t = totalSSD(testTable);

            expect(b).toBe(24);
            expect(w + b).toBe(t);
        });

        it('Table 1 (3 groups of 2): should calculate exact Within, Between, Total SSD, and Eta Squared', () => {
            const groupTable = [
                [2, 4],
                [3, 5],
                [4, 6]
            ];

            expect(betweenSSD(groupTable)).toBe(4);
            expect(withinSSD(groupTable)).toBe(6);
            expect(totalSSD(groupTable)).toBe(10);
            expect(etaSquared(groupTable, 6)).toBe(0.4);
        });

        it('Table 2 (3 groups of 3): should satisfy SSD partition identity and calculate exact Eta Squared', () => {
            const testTable = [
                [1, 2, 3],
                [3, 4, 5],
                [5, 6, 7]
            ];

            const b = betweenSSD(testTable);
            const w = withinSSD(testTable);
            const t = totalSSD(testTable);

            expect(b).toBe(24);
            expect(w).toBe(6);
            expect(t).toBe(30);
            expect(w + b).toBe(t);
            expect(etaSquared(testTable, 6)).toBe(0.8);
        });

        it('Table 3 (3 groups of unequal sizes): should handle groups with varying sample sizes', () => {
            const unequalGroups = [
                [10, 12, 14],
                [20, 22],
                [30, 32, 34, 36]
            ];

            expect(betweenSSD(unequalGroups)).toBeCloseTo(770, 6);
            expect(withinSSD(unequalGroups)).toBe(30);
            expect(totalSSD(unequalGroups)).toBe(800);
            expect(etaSquared(unequalGroups, 4)).toBeCloseTo(0.9625, 4);
        });

        it('Table 4 (4 groups of 4): should calculate exact SSD components and effect size for larger datasets', () => {
            const largerGroups = [
                [5, 7, 8, 10],
                [12, 14, 15, 19],
                [20, 21, 23, 24],
                [30, 32, 35, 39]
            ];

            expect(betweenSSD(largerGroups)).toBeCloseTo(1522.75, 2);
            expect(withinSSD(largerGroups)).toBeCloseTo(95, 6);
            expect(totalSSD(largerGroups)).toBeCloseTo(1617.75, 2);
            expect(etaSquared(largerGroups, 6)).toBeCloseTo(0.941276, 6);
        });
    });

    describe('Covariance and Pearson Correlation', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [2, 4, 6, 8, 10];

        it('should calculate population and sample covariance', () => {
            expect(covariance(x, y, false)).toBe(4);
            expect(covariance(x, y, true)).toBe(5);
            expect(() => covariance([1], [2], true)).toThrow('Sample covariance requires at least 2 data points.');
            expect(() => covariance([1, 2], [1], false)).toThrow('The number of elements must match in the two arrays!');
        });

        it('should calculate Pearson correlation coefficient', () => {
            expect(correlation(x, y)).toBe(1);
            expect(correlation([5, 5, 5], [1, 2, 3])).toBe(0);
            expect(correlation([5, 7, 9, 11, 12, 23], [1, 4, 6, 7, 9, 10])).toBeCloseTo(0.8465, 4);
        }); 1

        it('should correctly compute negative linear correlation', () => {
            const x = [1, 2, 3, 4, 5];
            const y = [5, 4, 2, 1, 0];

            const r = correlation(x, y, true, 4);
            expect(r).toBeCloseTo(-0.991, 3);
        });

        it('should compute accurate correlation for real decimal data', () => {
            const x = [10, 20, 30, 40, 50];
            const y = [12, 24, 28, 42, 58];

            const r = correlation(x, y, true, 4);
            expect(r).toBeCloseTo(0.983, 3);
        });

        it('should be numerically stable with large numbers and offsets', () => {
            const x = [1e9 + 1, 1e9 + 2, 1e9 + 3, 1e9 + 4, 1e9 + 5];
            const y = [100.5, 200.5, 300.5, 400.5, 500.5];

            const r = correlation(x, y);
            expect(r).toBeCloseTo(1.0, 4);
        });

        it('should handle zero variance (constant array) safely without crashing', () => {
            const x = [5, 5, 5, 5, 5];
            const y = [1, 2, 3, 4, 5];

            const r = correlation(x, y);
            expect(r).toBe(0);
        });
    });

    describe('Ranks and Spearman Correlation', () => {
        describe('getRanks', () => {
            it('should compute fractional ranks correctly for ties and distinct values', () => {
                const ranks = getRanks([10, 20, 20, 30]);
                expect(ranks.get(10)).toBe(1);
                expect(ranks.get(20)).toBe(2.5);
                expect(ranks.get(30)).toBe(4);
            });

            it('should throw error when array length is less than 2', () => {
                expect(() => getRanks([1])).toThrow('Values array must contain at least 2 numbers!');
            });
        });

        describe('rankCorrelation (Spearman)', () => {
            it('should calculate exact Spearman rank correlation coefficient', () => {
                const x = [1, 2, 3, 4, 5];
                const y = [1, 2, 4, 3, 5];

                expect(rankCorrelation(x, y)).toBe(0.9);
            });

            it('should return 1 for perfectly monotonic increasing data', () => {
                const x = [10, 20, 30, 40];
                const y = [5, 15, 25, 35];
                expect(rankCorrelation(x, y)).toBe(1);
            });

            it('should return -1 for perfectly monotonic decreasing data', () => {
                const x = [1, 2, 3, 4];
                const y = [40, 30, 20, 10];
                expect(rankCorrelation(x, y)).toBe(-1);
            });

            it('should correctly handle tied ranks', () => {
                const x = [10, 20, 20, 30, 40];
                const y = [1, 2, 3, 3, 5];

                const r = rankCorrelation(x, y, false, 4);
                expect(r).toBeCloseTo(0.9211, 4);
            });

            it('should calculate Spearman correlation for small sample with single tie', () => {
                const x = [5, 10, 10, 15, 20];
                const y = [2, 4, 6, 6, 10];

                const r = rankCorrelation(x, y, false, 4);
                expect(r).toBeCloseTo(0.921, 3);
            });

            it('should calculate Spearman correlation with multiple and triple ties', () => {
                const x = [10, 10, 10, 20, 30, 40];
                const y = [5, 15, 25, 25, 25, 50];

                const r = rankCorrelation(x, y, false, 4);
                expect(r).toBeCloseTo(0.806, 3);
            });

            it('should calculate Spearman correlation for negative association with ties', () => {
                const x = [1, 2, 3, 3, 5, 6];
                const y = [10, 8, 8, 4, 2, 1];

                const r = rankCorrelation(x, y, false, 4);
                expect(r).toBeCloseTo(-0.9559, 4);
            });

            it('should calculate Spearman correlation when values repeat in sequence', () => {
                const x = [100, 100, 200, 200, 300, 300];
                const y = [10, 30, 20, 40, 30, 50];

                const r = rankCorrelation(x, y, false, 4);
                expect(r).toBeCloseTo(0.606, 3);
            });

            it('should throw error if input arrays have different lengths', () => {
                expect(() => rankCorrelation([1, 2], [1])).toThrow();
            });
        });
    });
});