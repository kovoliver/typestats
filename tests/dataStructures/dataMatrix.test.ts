import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataMatrix from '../../core/dataStructures/DataMatrix';

vi.mock('../../core/statistics/univariate.js', () => ({
    mean: vi.fn((arr: number[]) => 42),
}));

vi.mock('../../core/statistics/bivariate.js', () => ({
    totalSSD: vi.fn((val: number[][]) => 100),
    withinSSD: vi.fn((val: number[][]) => 40),
    betweenSSD: vi.fn((val: number[][]) => 60),
    chiSquare: vi.fn((val: number[][]) => 15.5),
    cramerV: vi.fn((val: number[][]) => 0.45),
}));

describe('DataMatrix', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor & Validation', () => {
        it('should throw an error if values array is empty', () => {
            expect(() => new DataMatrix([], ['ColA', 'ColB'])).toThrow(
                'You did not provide any values!'
            );
        });

        it('should throw an error if provided lines are empty arrays', () => {
            expect(() => new DataMatrix([[], []], ['ColA', 'ColB'])).toThrow(
                'The lines you provided are empty!'
            );
        });

        it('should throw an error when rowLabels are provided but rows have unequal lengths', () => {
            const values = [
                [1, 2, 3],
                [4, 5]
            ];
            const colLabels = ['C1', 'C2', 'C3'];
            const rowLabels = ['R1', 'R2'];

            expect(() => new DataMatrix(values, colLabels, rowLabels)).toThrow(
                'All the rows must have the same number of values in the case of contingency tables!'
            );
        });

        it('should construct successfully with valid arguments', () => {
            const values = [[1, 2], [3, 4]];
            const colLabels = ['C1', 'C2'];
            const matrix = new DataMatrix(values, colLabels);

            expect(matrix.rows).toBe(2);
            expect(matrix.cols).toBe(2);
        });
    });

    describe('Getters', () => {
        it('should return correct row and col count', () => {
            const values = [
                [10, 20, 30],
                [40, 50, 60]
            ];
            const matrix = new DataMatrix(values, ['A', 'B', 'C']);

            expect(matrix.rows).toBe(2);
            expect(matrix.cols).toBe(3);
        });
    });

    describe('Statistical Methods', () => {
        const values = [[1, 2], [3, 4]];
        const colLabels = ['C1', 'C2'];
        let matrix: DataMatrix;

        beforeEach(() => {
            matrix = new DataMatrix(values, colLabels);
        });

        it('should call mean function in mainMean', () => {
            const result = matrix.mainMean();
            expect(result).toBe(42);
        });

        it('should call totalSSD function', () => {
            const result = matrix.totalSSD();
            expect(result).toBe(100);
        });

        it('should call withinSSD function', () => {
            const result = matrix.withinSSD();
            expect(result).toBe(40);
        });

        it('should call betweenSSD function', () => {
            const result = matrix.betweenSSD();
            expect(result).toBe(60);
        });

        it('should call chiSquare function', () => {
            const result = matrix.chiSquare();
            expect(result).toBe(15.5);
        });

        it('should call cramerV function', () => {
            const result = matrix.cramerV();
            expect(result).toBe(0.45);
        });
    });

    describe('Print Methods', () => {
        it('should print a 5x5 data matrix to console in printTable', () => {
            const consoleSpy = vi.spyOn(console, 'table');
            
            const values5x5 = [
                [11, 12, 13, 14, 15],
                [21, 22, 23, 24, 25],
                [31, 32, 33, 34, 35],
                [41, 42, 43, 44, 45],
                [51, 52, 53, 54, 55]
            ];
            const colLabels5 = ['Col_A', 'Col_B', 'Col_C', 'Col_D', 'Col_E'];

            const matrix = new DataMatrix(values5x5, colLabels5);

            matrix.printTable();

            expect(consoleSpy).toHaveBeenCalledOnce();
            consoleSpy.mockRestore();
        });

        it('should print a 5x5 contingency table to console in printContingencyTable', () => {
            const consoleSpy = vi.spyOn(console, 'table');

            const values5x5 = [
                [10, 20, 30, 40, 50],
                [15, 25, 35, 45, 55],
                [12, 22, 32, 42, 52],
                [18, 28, 38, 48, 58],
                [14, 24, 34, 44, 54]
            ];
            const colLabels5 = ['Cat_V1', 'Cat_V2', 'Cat_V3', 'Cat_V4', 'Cat_V5'];
            const rowLabels5 = ['Group_1', 'Group_2', 'Group_3', 'Group_4', 'Group_5'];

            const matrix = new DataMatrix(values5x5, colLabels5, rowLabels5);

            matrix.printContingencyTable();

            expect(consoleSpy).toHaveBeenCalledOnce();
            consoleSpy.mockRestore();
        });
    });
});