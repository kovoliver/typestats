import { describe, it, expect } from 'vitest';
import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types/types';
import DateColumn from '../../core/dataStructures/DateColumn';

describe('Table - Data Cleaning & Imputation', () => {
    describe('dropNa functionality', () => {
        it('should drop rows with NA/null/NaN values for a single column', () => {
            const data = [
                [1, null, 3, NaN],
                ['a', 'b', 'c', 'd'],
                [
                    new Date('2023-01-01'), null,
                    new Date('2023-01-03'),
                    new Date('2023-01-04')
                ]
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

        it('should handle array of labels with how="any" (default)', () => {
            const data = [
                [1, null, 3, NaN],
                ['a', null, 'c', 'd'],
                [
                    new Date('2023-01-01'), null,
                    new Date('2023-01-03'),
                    new Date('2023-01-04')
                ]
            ];
            const infos: ColInfo[] = [
                { label: 'num', type: 'number' },
                { label: 'str', type: 'string' },
                { label: 'date', type: 'date' }
            ];
            const table = new Table(data, infos);

            const cleanedAny = table.dropNa(['num', 'str'], 'any');
            expect(cleanedAny.rowCount).toBe(2);
            expect(cleanedAny.getCol('num').values).toEqual([1, 3]);
            expect(cleanedAny.getCol('str').values).toEqual(['a', 'c']);
        });

        it('should handle array of labels with how="all"', () => {
            const data = [
                [1, null, 3, NaN],
                ['a', null, 'c', 'd'],
                [
                    new Date('2023-01-01'), null,
                    new Date('2023-01-03'),
                    new Date('2023-01-04')
                ]
            ];
            const infos: ColInfo[] = [
                { label: 'num', type: 'number' },
                { label: 'str', type: 'string' },
                { label: 'date', type: 'date' }
            ];
            const table = new Table(data, infos);

            const cleanedAll = table.dropNa(['num', 'str'], 'all');
            expect(cleanedAll.rowCount).toBe(3);
            expect(cleanedAll.getCol('num').values).toEqual([1, 3, NaN]);
            expect(cleanedAll.getCol('str').values).toEqual(['a', 'c', 'd']);
        });

        it('should throw an error when empty label or empty array is passed', () => {
            const data = [[1, 2], ['a', 'b']];
            const infos: ColInfo[] = [
                { label: 'num', type: 'number' },
                { label: 'str', type: 'string' }
            ];
            const table = new Table(data, infos);

            expect(() => table.dropNa([])).toThrow('You must provide at least one label!');
            expect(() => table.dropNa('')).toThrow('You must provide at least one label!');
        });
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

        expect(() => table.replaceOutliers('str', 'mean', { min: 0, max: 10 })).toThrow(
            'Statistical imputation (mean, median, mode) is only applicable to numeric columns!'
        );

        expect(() => table.replaceOutliers('date', 'mean', { min: 0, max: 10 })).toThrow(
            'Statistical imputation (mean, median, mode) is only applicable to numeric columns!'
        );

        expect(() => table.replaceOutliersIQR('str', 'median')).toThrow(
            'Statistical imputation (mean, median, mode) is only applicable to numeric columns!'
        );

        expect(() => table.replaceOutliersIQR('date', 'median')).toThrow(
            'Statistical imputation (mean, median, mode) is only applicable to numeric columns!'
        );
    });

    describe('imputeSeries functionality', () => {
        it('should correctly apply LOCF (Last Observation Carried Forward) strategy', () => {
            const data = [[NaN, null, 10, 20, NaN, 50, NaN]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            const imputed = table.imputeTS('val', 'locf');
            expect(imputed.getCol('val').values).toEqual([10, 10, 10, 20, 20, 50, 50]);
        });

        it('should correctly apply NOCB (Next Observation Carried Backward) strategy', () => {
            const data = [[NaN, 10, NaN, NaN, 40, NaN]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            const imputed = table.imputeTS('val', 'nocb');
            expect(imputed.getCol('val').values).toEqual([10, 10, 40, 40, 40, 40]);
        });

        it('should correctly apply linear interpolation strategy', () => {
            const data = [[500, NaN, NaN, NaN, 600]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            const imputed = table.imputeTS('val', 'interpolation');


            expect(imputed.getCol('val').values).toEqual([500, 525, 550, 575, 600]);
        });

        it('should correctly apply movingAverage strategy with odd and even window sizes', () => {
            const data = [[10, 20, NaN, 40, 50]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            const imputedOdd = table.imputeTS('val', 'movingAverage', 3);
            expect(imputedOdd.getCol('val').values).toEqual([10, 20, 30, 40, 50]);

            const imputedEven = table.imputeTS('val', 'movingAverage', 4);
            const values = imputedEven.getCol('val').values;
            expect(values[2]).toBeCloseTo(23.3333, 4);
        });

        it('should preserve immutability and not mutate the original table', () => {
            const originalValues = [10, NaN, 30];
            const data = [[...originalValues]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            const imputed = table.imputeTS('val', 'locf');

            expect(imputed.getCol('val').values).toEqual([10, 10, 30]);
            expect(table.getCol('val').values).toEqual([10, NaN, 30]);
        });

        it('should throw an error when called on a non-numeric column', () => {
            const data = [['a', null, 'c']];
            const infos: ColInfo[] = [{ label: 'str', type: 'string' }];
            const table = new Table(data, infos);

            expect(() => table.imputeTS('str', 'locf')).toThrow(
                'The imputeTS method is only available for numeric columns!'
            );
        });

        it('should throw an error when an invalid imputation strategy is provided', () => {
            const data = [[10, NaN, 30]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            expect(() => table.imputeTS('val', 'invalid_strategy' as any)).toThrow(
                'The provided imputation strategy does not exist!'
            );
        });

        it('should throw an error when interpolation is impossible due to edge NaNs', () => {
            const dataStartNaN = [[NaN, 10, 20]];
            const dataEndNaN = [[10, 20, NaN]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];

            const tableStart = new Table(dataStartNaN, infos);
            const tableEnd = new Table(dataEndNaN, infos);

            expect(() => tableStart.imputeTS('val', 'interpolation')).toThrow(
                'The first element is invalid or an outlier; hence, interpolation is not possible!'
            );
            expect(() => tableEnd.imputeTS('val', 'interpolation')).toThrow(
                'The last elements are invalid or outliers; hence, interpolation is not possible!'
            );
        });

        it('should throw an error when movingAverage window contains no valid values', () => {
            const data = [[NaN, NaN, NaN, NaN]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            expect(() => table.imputeTS('val', 'movingAverage', 3)).toThrow(
                'The given dataset only has invalid values or outliers!'
            );
        });
    });

    describe('Time Series Outlier Replacement', () => {
        it('should replace fixed boundary outliers using replaceTSOutliers with linear interpolation', () => {
            const data = [[10, 999, 30, -500, 50]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            const cleaned = table.replaceTSOutliers('val', 'interpolation', { min: 0, max: 100 });
            expect(cleaned.getCol('val').values).toEqual([10, 20, 30, 40, 50]);
        });

        it('should replace fixed boundary outliers using replaceTSOutliers with LOCF and NOCB', () => {
            const data = [[10, 1000, 30, 40]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            const locfCleaned = table.replaceTSOutliers('val', 'locf', { max: 100 });
            expect(locfCleaned.getCol('val').values).toEqual([10, 10, 30, 40]);

            const nocbCleaned = table.replaceTSOutliers('val', 'nocb', { max: 100 });
            expect(nocbCleaned.getCol('val').values).toEqual([10, 30, 30, 40]);
        });

        it('should replace fixed boundary outliers using replaceTSOutliers with moving average', () => {
            const data = [[10, 20, 1000, 40, 50]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            const cleaned = table.replaceTSOutliers('val', 'movingAverage', { max: 500 }, 3);
            expect(cleaned.getCol('val').values).toEqual([10, 20, 30, 40, 50]);
        });

        it('should replace outliers based on dynamic IQR boundaries using replaceTSOutliersIqr', () => {
            const data = [[10, 12, 14, 15, 16, 18, 1000]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            const cleanedLocf = table.replaceTSOutliersIqr('val', 'locf', 1.5);
            expect(cleanedLocf.getCol('val').values).toEqual([10, 12, 14, 15, 16, 18, 18]);

            const cleanedMovingAvg = table.replaceTSOutliersIqr('val', 'movingAverage', 1.5, 3);
            const values = cleanedMovingAvg.getCol('val').values;

            expect(values[6]).toBe(18);
        });

        it('should throw an error when replaceTSOutliers is called without min or max boundary', () => {
            const data = [[10, 20, 30]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            expect(() => table.replaceTSOutliers('val', 'locf', {})).toThrow(
                'You must provide at least a min or a max boundary!'
            );
        });

        it('should throw an error when called on non-numeric columns', () => {
            const data = [['a', 'b', 'c']];
            const infos: ColInfo[] = [{ label: 'str', type: 'string' }];
            const table = new Table(data, infos);

            expect(() => table.imputeTS('str', 'locf')).toThrow(
                'The imputeTS method is only available for numeric columns!'
            );

            expect(() => table.replaceTSOutliers('str', 'locf', { min: 0 })).toThrow(
                'The replaceTSOutliers method is only available for numeric columns!'
            );

            expect(() => table.replaceTSOutliersIqr('str', 'locf')).toThrow(
                'The replaceTSOutliersIqr method is only available for numeric columns!'
            );
        });

        it('should preserve immutability and leave original table untouched', () => {
            const data = [[10, 999, 30]];
            const infos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const table = new Table(data, infos);

            const cleaned = table.replaceTSOutliers('val', 'interpolation', { max: 100 });

            expect(cleaned.getCol('val').values).toEqual([10, 20, 30]);
            expect(table.getCol('val').values).toEqual([10, 999, 30]);
        });
    });
});