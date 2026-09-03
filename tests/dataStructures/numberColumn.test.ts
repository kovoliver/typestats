import { describe, it, expect, beforeEach } from 'vitest';
import NumberColumn from '../../core/dataStructures/NumberColumn';

describe('NumberColumn', () => {
    let rawData: (number | string | null | undefined)[];
    let column: NumberColumn;

    beforeEach(() => {
        rawData = [10, 20, 30, 40, 50, '60', null, NaN, undefined];
        column = new NumberColumn(rawData, 'TestColumn');
    });

    describe('Initialization & Data Preparation', () => {
        it('should correctly initialize label and prepare values', () => {
            expect(column.label).toBe('TestColumn');
            expect(column.values).toEqual([10, 20, 30, 40, 50, 60, NaN, NaN, NaN]);
        });

        it('should return only valid numeric values via getValidValues()', () => {
            expect(column.countValid()).toBe(6);
            expect(column.countMissing()).toBe(3);
        });
    });

    describe('Univariate Descriptive Statistics', () => {
        it('should compute min and max correctly', () => {
            expect(column.min()).toBe(10);
            expect(column.max()).toBe(60);
        });

        it('should compute mean, range and sum of squared deviations (ssd)', () => {
            expect(column.mean()).toBe(35); // (10+20+30+40+50+60) / 6 = 35
            expect(column.range()).toBe(50); // 60 - 10 = 50
            expect(column.ssd()).toBe(1750);
        });

        it('should compute variance, skewness and kurtosis', () => {
            expect(column.variance()).toBeGreaterThan(0);
            expect(typeof column.skewness()).toBe('number');
            expect(typeof column.kurtosis()).toBe('number');
        });

        it('should compute percentiles, quartiles and IQR', () => {
            expect(column.median()).toBe(35);
            expect(column.q1()).toBeLessThan(column.median());
            expect(column.q3()).toBeGreaterThan(column.median());
            expect(column.iqr()).toBe(column.q3() - column.q1());
            
            expect(column.percentile(0.5)).toBe(column.median()); 
        });

        it('should calculate correct IQR boundaries', () => {
            const boundaries = column.getIqrBoundaries(1.5);
            expect(boundaries).toHaveProperty('min');
            expect(boundaries).toHaveProperty('max');
            expect(boundaries.min).toBeLessThan(column.q1());
            expect(boundaries.max).toBeGreaterThan(column.q3());
        });
    });

    describe('Data Preparation & Transformations', () => {
        it('should remove empty rows in-place', () => {
            const newColumn = column.removeEmptyRows();
            expect(newColumn.values).toEqual([10, 20, 30, 40, 50, 60]);
            expect(newColumn.countMissing()).toBe(0);
        });

        it('should replace empty values with mean imputation', () => {
            const newColumn = column.replaceEmptyValues('MEAN');
            expect(newColumn.countMissing()).toBe(0);
            expect(newColumn.values).toContain(35);
        });

        it('should replace outliers based on IQR boundaries while preserving NaNs', () => {
            const outlierCol = new NumberColumn([10, 12, 11, 13, 1000, NaN], 'Outliers');
            const newColumn = outlierCol.replaceOutliersIqr('MEDIAN');
            expect(newColumn.values[4]).not.toBe(1000);
            expect(newColumn.values[5]).toBeNaN();
        });

        it('should standardize values properly on clean datasets', () => {
            const cleanCol = new NumberColumn([10, 20, 30, 40, 50], 'Clean');
            const newColumn = cleanCol.standardize();
            expect(newColumn.mean()).toBeCloseTo(0, 5);
        });

        it('should normalize values to [0, 1] range on clean datasets', () => {
            const cleanCol = new NumberColumn([10, 20, 30, 40, 50], 'Clean');
            const newColumn = cleanCol.normalize();
            expect(newColumn.min()).toBe(0);
            expect(newColumn.max()).toBe(1);
        });
    });

    describe('Sorting & Cache Invalidation', () => {
        it('should sort values in ascending order and clear cache', () => {
            const unsorted = new NumberColumn([50, 10, 40, 20, 30], 'Unsorted');
            const meanBefore = unsorted.mean(); // Cache-eli a mean-t
            
            const newColumn = unsorted.orderAsc();
            expect(newColumn.values).toEqual([10, 20, 30, 40, 50]);
            expect(unsorted.mean()).toBe(meanBefore); // Újrahasználható a mean, de a cache törlődött
        });

        it('should sort values in descending order', () => {
            const unsorted = new NumberColumn([10, 50, 20, 40, 30], 'Unsorted');
            const newColumn = unsorted.orderDesc();
            expect(newColumn.values).toEqual([50, 40, 30, 20, 10]);
        });
    });

    describe('Bivariate Statistics & Regression', () => {
        let xCol: NumberColumn;
        let yCol: NumberColumn;

        beforeEach(() => {
            xCol = new NumberColumn([1, 2, 3, 4, 5], 'X');
            yCol = new NumberColumn([2, 4, 6, 8, 10], 'Y');
        });

        it('should calculate covariance and correlation', () => {
            expect(xCol.covariance(yCol)).toBeGreaterThan(0);
            expect(xCol.correlation(yCol)).toBeCloseTo(1, 5); // Tökéletes lineáris kapcsolat
        });

        it('should compute linear regression parameters', () => {
            const reg = xCol.linearRegression(yCol);
            expect(reg).toHaveProperty('b0');
            expect(reg).toHaveProperty('b1');
            expect(reg.b1).toBeCloseTo(2, 5); // y = 0 + 2x
        });

        it('should compute exponential and power regression parameters', () => {
            const expReg = xCol.exponentialRegression(yCol);
            const powReg = xCol.powerRegression(yCol);
            
            expect(expReg).toHaveProperty('b0');
            expect(powReg).toHaveProperty('b1');
        });
    });

    describe('Time-Series Trends', () => {
        let trendCol: NumberColumn;

        beforeEach(() => {
            trendCol = new NumberColumn([10, 20, 30, 40, 50], 'TrendData');
        });

        it('should calculate linear, exponential and logarithmic trends', () => {
            expect(trendCol.linearTrend()).toBeDefined();
            expect(trendCol.exponentialTrend()).toBeDefined();
            expect(trendCol.logarithmicTrend()).toBeDefined();
        });

        it('should calculate polynomial trend with dynamic degree key in cache', () => {
            const poly2 = trendCol.polynomialTrend(2);
            const poly3 = trendCol.polynomialTrend(3);
            
            expect(poly2).toBeDefined();
            expect(poly3).toBeDefined();
            expect(poly2).not.toEqual(poly3);
        });
    });
});