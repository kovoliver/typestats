import { describe, it, expect } from 'vitest';
import Trend from '../../calculations/inference/Trend';
import type { TrendType } from '../../types';

describe('Trend', () => {
    describe('Constructor and basic properties', () => {
        it('throws an error if instantiated with fewer than 2 values', () => {
            expect(() => new Trend([])).toThrowError();
            expect(() => new Trend([1])).toThrowError();
        });

        it('correctly sets the sample size N', () => {
            const trend = new Trend([10, 20, 30, 40]);
            expect(trend.N).toBe(4);
        });
    });

    describe('Linear Trend', () => {
        const linearData = [3, 5, 7, 9, 11];

        it('calculates linear trend parameters correctly', () => {
            const trend = new Trend(linearData);
            const { a, b } = trend.linear();
            
            expect(a).toBeCloseTo(2, 5);
            expect(b).toBeCloseTo(3, 5);
        });

        it('calculates MSE for linear trend correctly', () => {
            const trend = new Trend(linearData);
            expect(trend.MSELinear()).toBeCloseTo(0, 5);
        });
    });

    describe('Exponential Trend', () => {
        const exponentialData = [3, 6, 12, 24, 48];

        it('throws an error if data contains zero or negative values', () => {
            expect(() => new Trend([0, 2, 4]).exponential()).toThrowError();
            expect(() => new Trend([5, -1, 3]).exponential()).toThrowError();
        });

        it('calculates exponential trend parameters correctly', () => {
            const trend = new Trend(exponentialData);
            const { a, b } = trend.exponential();
            
            expect(a).toBeCloseTo(3, 5);
            expect(b).toBeCloseTo(2, 5);
        });

        it('calculates MSE for exponential trend correctly', () => {
            const trend = new Trend(exponentialData);
            expect(trend.MSEExponential()).toBeCloseTo(0, 5);
        });
    });

    describe('Polynomial Trend', () => {
        const polynomialData = [1, 6, 17, 34, 57];

        it('throws an error for invalid degrees', () => {
            const trend = new Trend(polynomialData);
            
            expect(() => trend.polynomial(1)).toThrowError();
            expect(() => trend.polynomial(6)).toThrowError();
            expect(() => trend.polynomial(2.5)).toThrowError();
        });

        it('calculates polynomial trend parameters correctly', () => {
            const trend = new Trend(polynomialData);
            const coeffs = trend.polynomial(2);
            
            expect(coeffs.a0).toBeCloseTo(1, 4);
            expect(coeffs.a1).toBeCloseTo(2, 4);
            expect(coeffs.a2).toBeCloseTo(3, 4);
        });

        it('uses cache for subsequent calls with the same degree', () => {
            const trend = new Trend(polynomialData);
            const firstCall = trend.polynomial(2);
            const secondCall = trend.polynomial(2);
            
            expect(firstCall).toBe(secondCall);
        });

        it('calculates MSE for polynomial trend correctly', () => {
            const trend = new Trend(polynomialData);
            expect(trend.MSEPolynomial(2)).toBeCloseTo(0, 4);
        });
    });

    describe('Logarithmic Trend', () => {
        const logarithmicData = [
            3,
            3 + 2 * Math.log(2),
            3 + 2 * Math.log(3),
            3 + 2 * Math.log(4)
        ];

        it('calculates logarithmic trend parameters correctly', () => {
            const trend = new Trend(logarithmicData);
            const { a, b } = trend.logarithmic();
            
            expect(a).toBeCloseTo(2, 5);
            expect(b).toBeCloseTo(3, 5);
        });

        it('calculates MSE for logarithmic trend correctly', () => {
            const trend = new Trend(logarithmicData);
            expect(trend.MSELogarithmic()).toBeCloseTo(0, 5);
        });
    });

    describe('Unified MSE Method', () => {
        const data = [3, 5, 7, 9];
        const trend = new Trend(data);

        it('routes to MSELinear correctly', () => {
            expect(trend.MSE('LINEAR')).toBeCloseTo(0, 5);
        });

        it('routes to MSEExponential correctly', () => {
            expect(trend.MSE('EXPONENTIAL')).toBeGreaterThan(0);
        });

        it('routes to MSELogarithmic correctly', () => {
            expect(trend.MSE('LOGARITHMIC')).toBeGreaterThan(0);
        });

        it('throws an error if POLYNOMIAL is called without a degree', () => {
            expect(() => trend.MSE('POLYNOMIAL')).toThrowError();
        });

        it('routes to MSEPolynomial correctly when degree is provided', () => {
            expect(trend.MSE('POLYNOMIAL', 2)).toBeGreaterThanOrEqual(0);
        });

        it('throws an error for unknown trend types', () => {
            expect(() => trend.MSE('UNKNOWN_TYPE' as TrendType)).toThrowError();
        });
    });
});