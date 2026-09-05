import { describe, it, expect } from 'vitest';
import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types/types';
import DateColumn from '../../core/dataStructures/DateColumn';

describe('Table - Data Cleaning & Imputation', () => {
    it('should drop rows with NA/null/NaN values via dropNa', () => {
        const data = [
            [1, null, 3, NaN],
            ['a', 'b', 'c', 'd'],
            [new Date('2023-01-01'), null, new Date('2023-01-03'), new Date('2023-01-04')]
        ];
        const infos: ColInfo[] = [
            { label: 'num', type: 'number' },
            { label: 'str', type: 'string' },
            { label: 'date', type: 'date' }
        ];
        const table = new Table(data, infos);
        
        const cleanedNum = table.dropNa('num');
        expect(cleanedNum.rowCount).toBe(2);
        expect(cleanedNum.getCol('num').values).toEqual([1, 3]);

        const cleanedDate = table.dropNa('date');
        expect(cleanedDate.rowCount).toBe(3);
        expect(cleanedDate.getCol('date')).toBeInstanceOf(DateColumn);
        expect(cleanedDate.getCol('date').values).toEqual([
            new Date('2023-01-01'),
            new Date('2023-01-03'),
            new Date('2023-01-04')
        ]);
    });

    it('should drop outliers based on fixed Boundaries', () => {
        const data = [[10, 20, 15, 100, 5]];
        const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
        const table = new Table(data, infos);

        const cleaned = table.dropOutliers('val', { min: 8, max: 30 });
        expect(cleaned.rowCount).toBe(3);
        expect(cleaned.getCol('val').values).toEqual([10, 20, 15]);
    });

    it('should drop outliers using IQR rule (dropOutliersIqr)', () => {
        const data = [[10, 12, 14, 15, 16, 18, 100]];
        const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
        const table = new Table(data, infos);

        const cleaned = table.dropOutliersIqr('val', 1.5);
        expect(cleaned.rowCount).toBe(6);
    });

    it('should fill missing numeric values with MEAN/MEDIAN/MODE via fillNaNumeric', () => {
        const data = [[2, 4, null, 6]];
        const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
        const table = new Table(data, infos);

        const filledMean = table.fillNaNumeric('val', 'mean');
        expect(filledMean.getCol('val').values).toEqual([2, 4, 4, 6]);
    });

    it('should fill NA values with literal values via fillNa ensuring strict type matching', () => {
        const defaultDate = new Date('2023-01-01');
        const fillDate = new Date('2023-12-31');

        const data = [
            [1, null, 3],
            ['a', null, 'c'],
            [defaultDate, null, new Date('2023-05-05')]
        ];
        const infos: ColInfo[] = [
            { label: 'num', type: 'number' },
            { label: 'str', type: 'string' },
            { label: 'date', type: 'date' }
        ];
        const table = new Table(data, infos);

        const filled = table
            .fillNa('num', 0)
            .fillNa('str', 'unknown')
            .fillNa('date', fillDate);

        expect(filled.getCol('num').values).toEqual([1, 0, 3]);
        expect(filled.getCol('str').values).toEqual(['a', 'unknown', 'c']);
        expect(filled.getCol('date')).toBeInstanceOf(DateColumn);
        expect(filled.getCol('date').values).toEqual([
            defaultDate,
            fillDate,
            new Date('2023-05-05')
        ]);

        expect(() => table.fillNa('num', 'not a number')).toThrow();
        expect(() => table.fillNa('str', 123)).toThrow();
        expect(() => table.fillNa('date', 'not a date object')).toThrow();
        expect(() => table.fillNa('num', new Date())).toThrow();
    });

    it('should replace outliers with statistical values via replaceOutliers using Boundaries', () => {
        const data = [[10, 20, 100, 30]];
        const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
        const table = new Table(data, infos);

        const replaced = table.replaceOutliers('val', 'mean', { min: 5, max: 50 });
        expect(replaced.getCol('val').values).toEqual([10, 20, 20, 30]);
    });

    it('should replace outliers using IQR rule via replaceOutliersIQR', () => {
        const data = [[10, 12, 14, 15, 16, 18, 1000]];
        const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
        const table = new Table(data, infos);

        const replaced = table.replaceOutliersIQR('val', 'median', 1.5);
        
        expect(replaced.getCol('val').values).toEqual([10, 12, 14, 15, 16, 18, 14.5]);
    });

    it('should throw error if replaceOutliers or replaceOutliersIQR is called on a non-numeric column', () => {
        const data = [
            ['a', 'b', 'c'],
            [new Date('2023-01-01'), new Date('2023-01-02'), new Date('2023-01-03')]
        ];
        const infos: ColInfo[] = [
            { label: 'str', type: 'string' },
            { label: 'date', type: 'date' }
        ];
        const table = new Table(data, infos);

        expect(() => table.replaceOutliers('str', 'mean', { min: 0, max: 10 })).toThrowError(
            'Statistical imputation (MEAN, MEDIAN, MODE) is only applicable to numeric columns!'
        );

        expect(() => table.replaceOutliers('date', 'mean', { min: 0, max: 10 })).toThrowError(
            'Statistical imputation (MEAN, MEDIAN, MODE) is only applicable to numeric columns!'
        );

        expect(() => table.replaceOutliersIQR('str', 'median')).toThrowError(
            'Statistical imputation (MEAN, MEDIAN, MODE) is only applicable to numeric columns!'
        );

        expect(() => table.replaceOutliersIQR('date', 'median')).toThrowError(
            'Statistical imputation (MEAN, MEDIAN, MODE) is only applicable to numeric columns!'
        );
    });
});