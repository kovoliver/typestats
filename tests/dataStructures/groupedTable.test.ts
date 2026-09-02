import { describe, it, expect } from 'vitest';
import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types/types';

describe('GroupedTable & Aggregations Integration Tests', () => {
    const mockData: any[][] = [
        ['IT', 'IT', 'HR', 'IT', 'HR', 'HR'],
        ['Dev', 'Dev', 'Rec', 'Ops', 'Rec', 'Rec'],
        [1000, 1200, 800, 1100, 900, 850]
    ];

    const mockColInfos: ColInfo[] = [
        { label: 'Department', type: 'string' },
        { label: 'Role', type: 'string' },
        { label: 'Salary', type: 'number' }
    ];

    it('should correctly group by multiple columns and perform count() with default and alias labels', () => {
        const table = new Table(mockData, mockColInfos);
        const grouped = table.groupBy('Department', 'Role');

        // Alapértelmezett count
        const countTable = grouped.count();
        console.log('\n--- COUNT (DEFAULT) ---');
        countTable.print();
        expect(countTable.getCol('count').values).toEqual([2, 3, 1]);

        // Aliased count: 'total_headcount'
        const countAliased = grouped.count('total_headcount');
        console.log('\n--- COUNT (ALIAS: total_headcount) ---');
        countAliased.print();
        expect(countAliased.getCol('total_headcount').values).toEqual([2, 3, 1]);
    });

    it('should correctly calculate sum() with optional alias', () => {
        const table = new Table(mockData, mockColInfos);
        const grouped = table.groupBy('Department', 'Role');

        // Default naming: Salary_sum
        const sumDefault = grouped.sum('Salary');
        console.log('\n--- SUM (DEFAULT: Salary_sum) ---');
        sumDefault.print();
        expect(sumDefault.getCol('Salary_sum').values).toEqual([2200, 2550, 1100]);

        // Custom alias naming: total_payroll
        const sumAliased = grouped.sum('Salary', 'total_payroll');
        console.log('\n--- SUM (ALIAS: total_payroll) ---');
        sumAliased.print();
        expect(sumAliased.getCol('total_payroll').values).toEqual([2200, 2550, 1100]);
    });

    it('should correctly calculate avg() with custom alias', () => {
        const table = new Table(mockData, mockColInfos);
        const grouped = table.groupBy('Department', 'Role');

        // Custom alias naming: average_salary
        const avgTable = grouped.avg('Salary', 'average_salary');
        console.log('\n--- AVG (ALIAS: average_salary) ---');
        avgTable.print();
        expect(avgTable.getCol('average_salary').values).toEqual([1100, 850, 1100]);
    });

    it('should calculate statistical metrics (min, max, std)', () => {
        const table = new Table(mockData, mockColInfos);
        const grouped = table.groupBy('Department');

        const minTable = grouped.min('Salary', 'min_salary');
        const maxTable = grouped.max('Salary', 'max_salary');
        const stdTable = grouped.std('Salary', 'salary_std');

        console.log('\n--- MIN (ALIAS: min_salary) ---');
        minTable.print();

        console.log('\n--- MAX (ALIAS: max_salary) ---');
        maxTable.print();

        console.log('\n--- STD (ALIAS: salary_std) ---');
        stdTable.print();

        expect(minTable.getCol('min_salary').values).toEqual([1000, 800]);
        expect(maxTable.getCol('max_salary').values).toEqual([1200, 900]);
        expect(stdTable.getCol('salary_std').values.length).toBe(2);
    });

    it('should return NaN for variance and std on single-element groups without throwing error', () => {
        const customData: any[][] = [
            ['IT', 'IT', 'Finance'],
            [1000, 1200, 5000]
        ];
        const customColInfos: ColInfo[] = [
            { label: 'Department', type: 'string' },
            { label: 'Salary', type: 'number' }
        ];

        const table = new Table(customData, customColInfos);
        const grouped = table.groupBy('Department');

        const varianceTable = grouped.variance('Salary', 'salary_var');
        const stdTable = grouped.std('Salary', 'salary_std');

        console.log('\n--- VARIANCE (SINGLE ELEMENT GROUP TEST) ---');
        varianceTable.print();

        console.log('\n--- STD (SINGLE ELEMENT GROUP TEST) ---');
        stdTable.print();

        const varValues = varianceTable.getCol('salary_var').values;
        const stdValues = stdTable.getCol('salary_std').values;

        expect(varValues[0]).not.toBeNaN();
        expect(varValues[1]).toBeNaN();

        expect(stdValues[0]).not.toBeNaN();
        expect(stdValues[1]).toBeNaN();
    });

    it('should throw error when calling aggregation on a non-existing column', () => {
        const table = new Table(mockData, mockColInfos);
        const grouped = table.groupBy('Department');

        expect(() => grouped.avg('InvalidCol')).toThrow('The provided column "InvalidCol" does not exist!');
    });
});