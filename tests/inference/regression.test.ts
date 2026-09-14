import { describe, it, expect } from 'vitest';
import Regression from '../../core/inference/Regression';

describe('Regression Class', () => {
    describe('Constructor and Validation', () => {
        it('should initialize regression with valid datasets', () => {
            const reg = new Regression([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
            expect(reg).toBeInstanceOf(Regression);
        });

        it('should throw error if fewer than 2 values are provided', () => {
            expect(() => new Regression([1], [2])).toThrow(
                'You must provide at least two dependent and independent variable values!'
            );
        });

        it('should throw error if array lengths do not match', () => {
            expect(() => new Regression([1, 2, 3], [2, 4])).toThrow(
                'You must add the same number of independent and dependent values!'
            );
        });
    });

    describe('Linear Regression', () => {
        it('should calculate linear regression coefficients correctly', () => {
            const x = [1, 2, 3, 4, 5];
            const y = [2, 4, 5, 4, 5];
            const reg = new Regression(x, y);
            const result = reg.linear();

            expect(result.b0).toBeCloseTo(2.2, 4);
            expect(result.b1).toBeCloseTo(0.6, 4);
        });

        it('should return cached linear regression results on second call', () => {
            const reg = new Regression([1, 2, 3], [2, 4, 6]);
            const firstCall = reg.linear();
            const secondCall = reg.linear();

            expect(secondCall).toEqual(firstCall);
        });

        it('should throw error if independent variable has zero variance in linear regression', () => {
            const reg = new Regression([3, 3, 3], [2, 4, 6]);
            expect(() => reg.linear()).toThrow(
                'Regression could not be calculated because the independent variable has zero variance!'
            );
        });
    });

    describe('Exponential Regression', () => {
        it('should calculate exact exponential regression coefficients', () => {
            const x = [1, 2, 3, 4];
            const y = [3.6, 6.48, 11.664, 20.9952]; 
            const reg = new Regression(x, y);
            const result = reg.exponential();

            expect(result.b0).toBeCloseTo(2.0, 4);
            expect(result.b1).toBeCloseTo(1.8, 4);
        });

        it('should return cached exponential regression results on second call', () => {
            const reg = new Regression([1, 2, 3], [2, 4, 8]);
            const firstCall = reg.exponential();
            const secondCall = reg.exponential();

            expect(secondCall).toEqual(firstCall);
        });

        it('should throw error if dependent variable contains non-positive values', () => {
            const reg = new Regression([1, 2, 3], [2, 0, -1]);
            expect(() => reg.exponential()).toThrow(
                'Exponential regression could not be calculated because of non-positive values in the dependent variable!'
            );
        });
    });

    describe('Power Regression', () => {
        it('should calculate exact power regression coefficients', () => {
            const x = [1, 4, 9, 16];
            const y = [2, 16, 54, 128];
            const reg = new Regression(x, y);
            const result = reg.power();

            expect(result.b0).toBeCloseTo(2.0, 4);
            expect(result.b1).toBeCloseTo(1.5, 4);
        });

        it('should return cached power regression results on second call', () => {
            const reg = new Regression([1, 2, 3], [1, 4, 9]);
            const firstCall = reg.power();
            const secondCall = reg.power();

            expect(secondCall).toEqual(firstCall);
        });

        it('should throw error if x or y contains non-positive values in power regression', () => {
            const regNegativeX = new Regression([0, 1, 2], [1, 2, 3]);
            expect(() => regNegativeX.power()).toThrow(
                'Power regression could not be calculated because of non-positive values in either the independent or dependent variable!'
            );

            const regNegativeY = new Regression([1, 2, 3], [-1, 2, 3]);
            expect(() => regNegativeY.power()).toThrow(
                'Power regression could not be calculated because of non-positive values in either the independent or dependent variable!'
            );
        });
    });

    describe('RSD (Residual Standard Deviation) Calculation', () => {
        it('should throw error if regression model has not been calculated before RSD call', () => {
            const reg = new Regression([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);

            expect(() => reg.RSD('linear')).toThrow(
                "Cannot calculate RSD for 'linear' regression because the model coefficients have not been calculated yet. Call .linear() first!"
            );
        });

        it('should calculate exact RSD for linear regression', () => {
            const x = [1, 2, 3, 4, 5];
            const y = [2, 4, 5, 4, 5];
            const reg = new Regression(x, y);

            reg.linear();
            const rsd = reg.RSD('linear');

            expect(rsd).toBeCloseTo(0.894427, 4);
        });

        it('should calculate exact RSD for exponential regression', () => {
            const x = [1, 2, 3, 4];
            const y = [2, 4, 8, 16];
            const reg = new Regression(x, y);

            reg.exponential();
            const expRsd = reg.RSD('exponential');

            expect(expRsd).toBeCloseTo(0.0, 4);
        });

        it('should calculate exact RSD for power regression', () => {
            const x = [1, 2, 3, 4, 5];
            const y = [2, 5, 9, 15, 27];
            const reg = new Regression(x, y);

            reg.power();
            const powerRsd = reg.RSD('power');

            expect(powerRsd).toBeCloseTo(2.656087, 4);
            expect(Number.isNaN(powerRsd)).toBe(false);
        });

        it('should return cached RSD on subsequent calls', () => {
            const x = [1, 2, 3, 4, 5];
            const y = [2, 4, 5, 4, 5];
            const reg = new Regression(x, y);

            reg.linear();
            const firstRsd = reg.RSD('linear');
            const secondRsd = reg.RSD('linear');

            expect(secondRsd).toBe(firstRsd);
        });
    });
});