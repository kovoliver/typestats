import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types';

describe('Table - Data Cleaning & Imputation', () => {
    it('should drop rows with NA/null/NaN values via dropNa', () => {
        const data = [
            [1, null, 3, NaN],
            ['a', 'b', 'c', 'd']
        ];
        const infos: ColInfo[] = [
            { label: 'num', type: 'number' },
            { label: 'str', type: 'string' }
        ];
        const table = new Table(data, infos);
        const cleaned = table.dropNa('num');

        expect(cleaned.rowCount).toBe(2);
        expect(cleaned.getCol('num').values).toEqual([1, 3]);
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

        const filledMean = table.fillNaNumeric('val', 'MEAN');
        expect(filledMean.getCol('val').values).toEqual([2, 4, 4, 6]);
    });

    it('should fill NA values with literal values via fillNa ensuring strict type matching', () => {
        const data = [
            [1, null, 3],
            ['a', null, 'c']
        ];
        const infos: ColInfo[] = [
            { label: 'num', type: 'number' },
            { label: 'str', type: 'string' }
        ];
        const table = new Table(data, infos);

        const filled = table.fillNa('num', 0).fillNa('str', 'unknown');
        expect(filled.getCol('num').values).toEqual([1, 0, 3]);
        expect(filled.getCol('str').values).toEqual(['a', 'unknown', 'c']);

        expect(() => table.fillNa('num', 'not a number')).toThrow();
        expect(() => table.fillNa('str', 123)).toThrow();
    });
});