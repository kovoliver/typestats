import { describe, it, expect } from 'vitest';
import Regression from '../../calculations/inference/Regression';

describe('Regression Class', () => {
    describe('Constructor and Validation', () => {
        it('should initialize regression with valid datasets', () => {
            const reg = new Regression([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
            expect(reg).toBeInstanceOf(Regression);
        });

        it('should throw error if fewer than 2 values are provided', () => {
            expect(() => new Regression([1], [2])).toThrowError(
                'You must provide at least two dependent and independent variable values!'
            );
        });

        it('should throw error if array lengths do not match', () => {
            expect(() => new Regression([1, 2, 3], [2, 4])).toThrowError(
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
            expect(() => reg.linear()).toThrowError(
                'Regression could not be calculated because the \
                independent variable has zero variance!'
            );
        });
    });

    describe('Exponential Regression', () => {
        it('should calculate exponential regression coefficients correctly', () => {
            const x = [1, 2, 3, 4];
            const y = [2, 4, 8, 16]; // y = 2 * (2^x) approx
            const reg = new Regression(x, y);
            const result = reg.exponential();

            expect(result.b0).toBeGreaterThan(0);
            expect(result.b1).toBeCloseTo(2.0, 1);
        });

        it('should return cached exponential regression results on second call', () => {
            const reg = new Regression([1, 2, 3], [2, 4, 8]);
            const firstCall = reg.exponential();
            const secondCall = reg.exponential();

            expect(secondCall).toEqual(firstCall);
        });

        it('should throw error if dependent variable contains non-positive values', () => {
            const reg = new Regression([1, 2, 3], [2, 0, -1]);
            expect(() => reg.exponential()).toThrowError(
                'Exponential regression could not be calculated because of \
                non-positive values in the dependent variable!'
            );
        });
    });

    describe('Power Regression', () => {
        it('should calculate power regression coefficients correctly', () => {
            const x = [1, 2, 3, 4];
            const y = [1, 4, 9, 16]; // y = x^2
            const reg = new Regression(x, y);
            const result = reg.power();

            expect(result.b0).toBeCloseTo(1.0, 1);
            expect(result.b1).toBeCloseTo(2.0, 1);
        });

        it('should return cached power regression results on second call', () => {
            const reg = new Regression([1, 2, 3], [1, 4, 9]);
            const firstCall = reg.power();
            const secondCall = reg.power();

            expect(secondCall).toEqual(firstCall);
        });

        it('should throw error if x or y contains non-positive values in power regression', () => {
            const regNegativeX = new Regression([0, 1, 2], [1, 2, 3]);
            expect(() => regNegativeX.power()).toThrowError(
                'Power regression could not be calculated because of \
                non-positive values in either the independent or dependent variable!'
            );

            const regNegativeY = new Regression([1, 2, 3], [-1, 2, 3]);
            expect(() => regNegativeY.power()).toThrowError(
                'Power regression could not be calculated because of \
                non-positive values in either the independent or dependent variable!'
            );
        });
    });
});