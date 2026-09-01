import { describe, it, expect } from 'vitest';
import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types';
import NumberColumn from '../../core/dataStructures/NumberColumn';

describe('Strict Table Integration & Unit Test Suite', () => {
    const getDataset = () => {
        const mockData: any[][] = [
            ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'],
            [100, 250, null, 1000, 220, NaN],
            ['IT', 'HR', 'IT', 'FINANCE', 'HR', 'IT'],
            [true, false, true, true, false, false]
        ];

        const mockColInfos: ColInfo[] = [
            { label: 'Name', type: 'string' },
            { label: 'Salary', type: 'number' },
            { label: 'Dept', type: 'string' },
            { label: 'Active', type: 'bool' }
        ];

        return { mockData, mockColInfos };
    };

    describe('1. Construction & Column Type Casting', () => {
        it('should correctly initialize column types and report correct rowCount', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            expect(table.rowCount).toBe(6);
            expect(table.getCol('Salary')).toBeInstanceOf(NumberColumn);
        });

        it('should throw strict errors on invalid identifiers', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            expect(() => table.getCol('NonExisting')).toThrow('The provided identifier (NonExisting) does not exist!');
            expect(() => table.getCol(-1)).toThrow('The provided identifier (-1) does not exist!');
            expect(() => table.getCol(99)).toThrow('The provided identifier (99) does not exist!');
        });
    });

    describe('2. Label Management (setLabel)', () => {
        it('should rename labels and maintain colInfos synchronization', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            table.setLabel('Salary', 'Compensation');
            expect(table.getCol('Compensation').label).toBe('Compensation');
            expect(() => table.getCol('Salary')).toThrow();
        });

        it('should throw error when renaming to an existing label or empty string', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            expect(() => table.setLabel('Salary', 'Dept')).toThrow('A column with the label "Dept" already exists!');
            expect(() => table.setLabel('Salary', '')).toThrow('The new label must be a non-empty string!');
        });
    });

    describe('3. Ordering (orderByAsc & orderByDesc)', () => {
        it('should sort table strictly in ascending order while keeping rows synchronized', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);
            const sorted = table.orderByAsc('Name');

            expect(sorted.getCol('Name').values).toEqual(['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank']);
            expect(sorted.getCol('Dept').values).toEqual(['IT', 'HR', 'IT', 'FINANCE', 'HR', 'IT']);
        });

        it('should strictly preserve immutability during sorting', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);
            const originalFirstName = table.getCol('Name').values[0];

            const sorted = table.orderByDesc('Name');

            expect(table.getCol('Name').values[0]).toBe(originalFirstName);
            expect(sorted.getCol('Name').values[0]).toBe('Frank');
        });
    });

    describe('4. Logical Filtering (where, whereAll, whereAny)', () => {
        it('should filter with single where condition', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            const filtered = table.where('Dept', dept => dept === 'IT');
            expect(filtered.rowCount).toBe(3);
            expect(filtered.getCol('Name').values).toEqual(['Alice', 'Charlie', 'Frank']);
        });

        it('should execute strict AND logic via whereAll', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            const filtered = table.whereAll(
                ['Dept', 'Active'],
                [dept => dept === 'IT', active => active === true]
            );

            expect(filtered.rowCount).toBe(2);
            expect(filtered.getCol('Name').values).toEqual(['Alice', 'Charlie']);
        });

        it('should execute strict OR logic via whereAny', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            const filtered = table.whereAny(
                ['Dept', 'Active'],
                [dept => dept === 'FINANCE', active => active === false]
            );
            
            expect(filtered.rowCount).toBe(4);
            expect(filtered.getCol('Name').values).toEqual(['Bob', 'David', 'Eve', 'Frank']);
        });

        it('should throw error when whereAll argument lengths mismatch', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            expect(() => table.whereAll(['Dept', 'Active'], [dept => dept === 'IT'])).toThrow(
                'The number of labels must match the number of filter functions!'
            );
        });
    });

    describe('5. Column Selection & Dropping (select & drop)', () => {
        it('should project specified columns maintaining requested order in select', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            const selected = table.select('Dept', 'Name');
            expect(selected.getCol(0).label).toBe('Dept');
            expect(selected.getCol(1).label).toBe('Name');
            expect(() => selected.getCol('Salary')).toThrow();
        });

        it('should drop specified columns cleanly using drop', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            const dropped = table.drop('Salary', 'Active');
            expect(dropped.getCol(0).label).toBe('Name');
            expect(dropped.getCol(1).label).toBe('Dept');
            expect(() => dropped.getCol('Salary')).toThrow();
        });
    });

    describe('6. Immutable Column Additions (addColumnFirst, addColumnLast, addColumnAt)', () => {
        it('should add columns at correct positions without mutating original table', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            const ids = [1, 2, 3, 4, 5, 6];
            const idInfo: ColInfo = { label: 'ID', type: 'number' };

            const addedFirst = table.addColumnFirst(ids, idInfo);
            expect(addedFirst.getCol(0).label).toBe('ID');
            expect(table.getCol(0).label).toBe('Name'); // Immutable check

            const addedAt = table.addColumnAt(ids, idInfo, 2);
            expect(addedAt.getCol(2).label).toBe('ID');
            expect(addedAt.getCol(3).label).toBe('Dept');
        });

        it('should throw error on mismatched row counts during addition', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            const invalidIds = [1, 2]; // Needs 6 rows
            const idInfo: ColInfo = { label: 'ID', type: 'number' };

            expect(() => table.addColumnLast(invalidIds, idInfo)).toThrow(
                'The provided values length (2) does not match table row count (6)!'
            );
        });
    });

    describe('7. Data Cleaning & Outlier Management (dropNa, dropOutliers, dropOutliersIqr)', () => {
        it('should drop null and NaN rows strictly using dropNa', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            // Salary has null at index 2 and NaN at index 5
            const cleaned = table.dropNa('Salary');

            expect(cleaned.rowCount).toBe(4);
            expect(cleaned.getCol('Name').values).toEqual(['Alice', 'Bob', 'David', 'Eve']);
            expect(cleaned.getCol('Salary').values).toEqual([100, 250, 1000, 220]);
        });

        it('should drop boundary outliers strictly using dropOutliers', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            // Boundaries: min=150, max=500
            const cleaned = table.dropOutliers('Salary', { min: 150, max: 500 });

            // Retains Bob (250) and Eve (220)
            expect(cleaned.rowCount).toBe(2);
            expect(cleaned.getCol('Name').values).toEqual(['Bob', 'Eve']);
            expect(cleaned.getCol('Salary').values).toEqual([250, 220]);
        });

        it('should drop IQR outliers strictly using dropOutliersIqr', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            // 1000 is an extreme outlier in Salary
            const cleaned = table.dropOutliersIqr('Salary', 1.5);

            expect(cleaned.getCol('Salary').values).not.toContain(1000);
            expect(cleaned.getCol('Name').values).not.toContain('David');
        });

        it('should throw error when calling dropOutliers or dropOutliersIqr on non-numeric columns', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            expect(() => table.dropOutliers('Name', { min: 10, max: 20 })).toThrow(
                'Dropping outliers by boundaries is only supported on numeric columns!'
            );

            expect(() => table.dropOutliersIqr('Dept', 1.5)).toThrow(
                'Outlier removal based on IQR is only supported on numeric columns!'
            );
        });
    });
});