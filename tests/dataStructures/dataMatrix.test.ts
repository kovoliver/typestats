import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataMatrix from '../../core/dataStructures/DataMatrix';
import { Table } from '../../core/dataStructures';
import { ColInfo } from '../../core/types';

describe('DataMatrix', () => {
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
            const colLabels = ['C1', 'C2'];
            const rowLabels = ['R1', 'R2', 'R3'];

            expect(() => new DataMatrix(values, colLabels, rowLabels)).toThrow(
                'All the rows must have the same number of values in the case of contingency tables!'
            );
        });

        it('should construct successfully with valid arguments', () => {
            const values = [[1, 2], [3, 4]];
            const colLabels = ['C1', 'C2'];
            const matrix = new DataMatrix(values, colLabels);

            expect(matrix.cols).toBe(2);
            expect(matrix.rows).toBe(2);
        });
    });

    describe('Getters', () => {
        it('should return correct row and col count', () => {
            const values = [
                [10, 20, 30],
                [40, 50, 60]
            ];
            const matrix = new DataMatrix(values, ['Col_A', 'Col_B']);

            expect(matrix.cols).toBe(2);
            expect(matrix.rows).toBe(3);
        });
    });

    describe('Statistical Methods (real values, 2x2 matrix)', () => {
        const values = [[1, 2], [3, 4]];
        const colLabels = ['C1', 'C2'];
        let matrix: DataMatrix;

        beforeEach(() => {
            matrix = new DataMatrix(values, colLabels);
        });

        it('should compute the correct grand mean in mainMean', () => {
            expect(matrix.mainMean()).toBeCloseTo(2.5, 10);
        });

        it('should compute the correct totalSSD', () => {
            expect(matrix.totalSSD()).toBeCloseTo(5.0, 10);
        });

        it('should compute the correct withinSSD (row-groups)', () => {
            expect(matrix.withinSSD()).toBeCloseTo(1.0, 10);
        });

        it('should compute the correct betweenSSD (row-groups)', () => {
            expect(matrix.betweenSSD()).toBeCloseTo(4.0, 10);
        });

        it('should satisfy totalSSD = betweenSSD + withinSSD', () => {
            expect(matrix.betweenSSD() + matrix.withinSSD()).toBeCloseTo(
                matrix.totalSSD(),
                10
            );
        });

        it('should compute the correct chiSquare (contingency test)', () => {
            expect(matrix.chiSquare()).toBeCloseTo(0.0793651, 6);
        });

        it('should compute the correct cramerV', () => {
            expect(matrix.cramerV()).toBeCloseTo(0.0890872, 6);
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

    describe('Table -> DataMatrix integration (toContingencyTable & toAnovaTable)', () => {
        const data = [
            [
                'Electronics', 'Electronics', 'Electronics', 'Electronics', 'Electronics',
                'Furniture', 'Furniture', 'Furniture', 'Furniture',
                'Accessories', 'Accessories', 'Accessories', 'Accessories', 'Accessories',
                'Stationery', 'Stationery', 'Stationery'
            ],
            [
                'SupplierA', 'SupplierA', 'SupplierB', 'SupplierB', 'SupplierC',
                'SupplierA', 'SupplierA', 'SupplierB', 'SupplierC',
                'SupplierA', 'SupplierB', 'SupplierB', 'SupplierC', 'SupplierC',
                'SupplierA', 'SupplierB', 'SupplierC'
            ],
            [
                150, 80, 45, 95, 60,
                20, 12, 110, 35,
                200, 130, 500, 140, 400,
                300, 250, 70
            ]
        ];

        const infos: ColInfo[] = [
            { label: 'category', type: 'string' },
            { label: 'supplier', type: 'string' },
            { label: 'stock_quantity', type: 'number' }
        ];

        const table = new Table(data, infos);

        describe('toContingencyTable', () => {
            it('should generate the correct shape and compute the true Cramér\'s V', () => {
                const contingencyTable = table.toContingencyTable('category', 'supplier');

                expect(contingencyTable.cols).toBe(4);
                expect(contingencyTable.rows).toBe(3);
                expect(contingencyTable.chiSquare()).toBeCloseTo(1.1805556, 5);
                expect(contingencyTable.cramerV()).toBeCloseTo(0.1863390, 5);
            });
        });

        describe('toAnovaTable', () => {
            it('should generate the correct shape and compute the true Eta Squared', () => {
                const anovaTable = table.toAnovaTable('category', 'stock_quantity');

                expect(anovaTable.cols).toBe(4);
                expect(anovaTable.rows).toBe(5);
                expect(anovaTable.totalSSD()).toBeCloseTo(304589.0588, 3);
                expect(anovaTable.betweenSSD()).toBeCloseTo(151595.6422, 3);
                expect(anovaTable.withinSSD()).toBeCloseTo(152993.4167, 3);
                expect(anovaTable.etaSquared()).toBeCloseTo(0.4977063, 5);
            });
        });
    });
});