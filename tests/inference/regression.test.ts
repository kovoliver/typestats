import { describe, it, expect } from 'vitest';
import Regression from '../../core/inference/Regression';

describe('Regression Class', () => {
    describe('Constructor and Validation', () => {
        it('should initialize regression with valid datasets', () => {
            const reg = new Regression(
                new Float64Array([1, 2, 3, 4, 5]),
                new Float64Array([2, 4, 5, 4, 5])
            );
            expect(reg).toBeInstanceOf(Regression);
        });

        it('should throw error if fewer than 2 values are provided', () => {
            expect(() => new Regression(new Float64Array([1]), new Float64Array([2]))).toThrow(
                'You must provide at least two dependent and independent variable values!'
            );
        });

        it('should throw error if array lengths do not match', () => {
            expect(() => new Regression(new Float64Array([1, 2, 3]), new Float64Array([2, 4]))).toThrow(
                'You must add the same number of independent and dependent values!'
            );
        });
    });

    describe('Linear Regression', () => {
        it('should calculate linear regression coefficients correctly', () => {
            const x = new Float64Array([1, 2, 3, 4, 5]);
            const y = new Float64Array([2, 4, 5, 4, 5]);
            const reg = new Regression(x, y);
            const result = reg.linear();

            expect(result.b0).toBeCloseTo(2.2, 4);
            expect(result.b1).toBeCloseTo(0.6, 4);
        });

        it('should return cached linear regression results on second call', () => {
            const reg = new Regression(
                new Float64Array([1, 2, 3]),
                new Float64Array([2, 4, 6])
            );
            const firstCall = reg.linear();
            const secondCall = reg.linear();

            expect(secondCall).toEqual(firstCall);
        });

        it('should throw error if independent variable has zero variance in linear regression', () => {
            const reg = new Regression(
                new Float64Array([3, 3, 3]),
                new Float64Array([2, 4, 6])
            );
            expect(() => reg.linear()).toThrow(
                'Regression could not be calculated because the independent variable has zero variance!'
            );
        });
    });

    describe('Exponential Regression', () => {
        it('should calculate exact exponential regression coefficients', () => {
            const x = new Float64Array([1, 2, 3, 4]);
            const y = new Float64Array([3.6, 6.48, 11.664, 20.9952]);
            const reg = new Regression(x, y);
            const result = reg.exponential();

            expect(result.b0).toBeCloseTo(2.0, 4);
            expect(result.b1).toBeCloseTo(1.8, 4);
        });

        it('should return cached exponential regression results on second call', () => {
            const reg = new Regression(
                new Float64Array([1, 2, 3]),
                new Float64Array([2, 4, 8])
            );
            const firstCall = reg.exponential();
            const secondCall = reg.exponential();

            expect(secondCall).toEqual(firstCall);
        });

        it('should throw error if dependent variable contains non-positive values', () => {
            const reg = new Regression(
                new Float64Array([1, 2, 3]),
                new Float64Array([2, 0, -1])
            );
            expect(() => reg.exponential()).toThrow(
                'Exponential regression could not be calculated because of non-positive values in the dependent variable!'
            );
        });
    });

    describe('Power Regression', () => {
        it('should calculate exact power regression coefficients', () => {
            const x = new Float64Array([1, 4, 9, 16]);
            const y = new Float64Array([2, 16, 54, 128]);
            const reg = new Regression(x, y);
            const result = reg.power();

            expect(result.b0).toBeCloseTo(2.0, 4);
            expect(result.b1).toBeCloseTo(1.5, 4);
        });

        it('should return cached power regression results on second call', () => {
            const reg = new Regression(
                new Float64Array([1, 2, 3]),
                new Float64Array([1, 4, 9])
            );
            const firstCall = reg.power();
            const secondCall = reg.power();

            expect(secondCall).toEqual(firstCall);
        });

        it('should throw error if x or y contains non-positive values in power regression', () => {
            const regNegativeX = new Regression(
                new Float64Array([0, 1, 2]),
                new Float64Array([1, 2, 3])
            );
            expect(() => regNegativeX.power()).toThrow(
                'Power regression could not be calculated because of non-positive values in either the independent or dependent variable!'
            );

            const regNegativeY = new Regression(
                new Float64Array([1, 2, 3]),
                new Float64Array([-1, 2, 3])
            );
            expect(() => regNegativeY.power()).toThrow(
                'Power regression could not be calculated because of non-positive values in either the independent or dependent variable!'
            );
        });
    });

    describe('RSD (Residual Standard Deviation) Calculation', () => {
        it('should throw error if regression model has not been calculated before RSD call', () => {
            const reg = new Regression(
                new Float64Array([1, 2, 3, 4, 5]),
                new Float64Array([2, 4, 5, 4, 5])
            );

            expect(() => reg.RSD('linear')).toThrow(
                "Cannot calculate RSD for 'linear' regression because the model coefficients have not been calculated yet. Call .linear() first!"
            );
        });

        it('should calculate exact RSD for linear regression', () => {
            const x = new Float64Array([1, 2, 3, 4, 5]);
            const y = new Float64Array([2, 4, 5, 4, 5]);
            const reg = new Regression(x, y);

            reg.linear();
            const rsd = reg.RSD('linear');

            expect(rsd).toBeCloseTo(0.894427, 4);
        });

        it('should calculate exact RSD for exponential regression', () => {
            const x = new Float64Array([1, 2, 3, 4]);
            const y = new Float64Array([2, 4, 8, 16]);
            const reg = new Regression(x, y);

            reg.exponential();
            const expRsd = reg.RSD('exponential');

            expect(expRsd).toBeCloseTo(0.0, 4);
        });

        it('should calculate exact RSD for power regression', () => {
            const x = new Float64Array([1, 2, 3, 4, 5]);
            const y = new Float64Array([2, 5, 9, 15, 27]);
            const reg = new Regression(x, y);

            reg.power();
            const powerRsd = reg.RSD('power');

            expect(powerRsd).toBeCloseTo(2.656087, 4);
            expect(Number.isNaN(powerRsd)).toBe(false);
        });

        it('should return cached RSD on subsequent calls', () => {
            const x = new Float64Array([1, 2, 3, 4, 5]);
            const y = new Float64Array([2, 4, 5, 4, 5]);
            const reg = new Regression(x, y);

            reg.linear();
            const firstRsd = reg.RSD('linear');
            const secondRsd = reg.RSD('linear');

            expect(secondRsd).toBe(firstRsd);
        });
    });

    describe('Advanced Regression & RSD Validation with Precise Expectations', () => {
        it('should calculate linear regression correctly for negative and decimal values (10+ elements)', () => {
            const x = new Float64Array([-5.25, -4.10, -3.15, -2.05, -1.10, 0.20, 1.15, 2.30, 3.40, 4.55]);
            const y = new Float64Array([-12.85, -10.20, -8.15, -5.90, -3.40, -0.15, 2.45, 5.10, 7.80, 10.35]);
            const reg = new Regression(x, y);
            const result = reg.linear();

            expect(result.b0).toBeCloseTo(-0.522550, 6);
            expect(result.b1).toBeCloseTo(2.401112, 6);

            reg.linear();
            const rsd = reg.RSD('linear');
            expect(rsd).toBeCloseTo(0.241529, 6);
            expect(Number.isNaN(rsd)).toBe(false);
        });

        it('should calculate exponential regression and RSD precisely across 100s, 1000s, and 10k scales', () => {
            const x100 = new Float64Array([100.25, 105.50, 110.75, 115.20, 120.40, 125.80, 130.15, 135.60, 140.90, 145.30]);
            const y100 = new Float64Array([205.54, 223.12, 242.21, 262.93, 285.42, 309.83, 336.32, 365.07, 396.28, 430.15]);
            const reg100 = new Regression(x100, y100);
            const res100 = reg100.exponential();
            const rsd100 = reg100.RSD('exponential');
            expect(res100.b0).toBeCloseTo(39.801597, 6);
            expect(res100.b1).toBeCloseTo(1.016486, 6);
            expect(rsd100).toBeCloseTo(1.517261, 6);

            const x1000 = new Float64Array([1100.5, 1220.4, 1340.2, 1460.8, 1580.1, 1700.5, 1820.3, 1940.9, 2060.2, 2180.7]);
            const y1000 = new Float64Array([150.25, 170.85, 194.25, 220.85, 251.15, 285.65, 324.85, 369.45, 420.25, 478.05]);
            const reg1000 = new Regression(x1000, y1000);
            const res1000 = reg1000.exponential();
            const rsd1000 = reg1000.RSD('exponential');
            expect(res1000.b0).toBeCloseTo(46.199247, 6);
            expect(res1000.b1).toBeCloseTo(1.001072, 6);
            expect(rsd1000).toBeCloseTo(0.122325, 6);

            const x10k = new Float64Array([10050.2, 11020.5, 12010.8, 13040.1, 14025.4, 15060.7, 16010.3, 17050.6, 18020.9, 19040.2]);
            const y10k = new Float64Array([450.12, 490.25, 533.90, 581.40, 633.15, 689.50, 750.90, 817.85, 890.80, 970.30]);
            const reg10k = new Regression(x10k, y10k);
            const res10k = reg10k.exponential();
            const rsd10k = reg10k.RSD('exponential');
            expect(res10k.b0).toBeCloseTo(191.314125, 6);
            expect(res10k.b1).toBeCloseTo(1.000085, 6);
            expect(rsd10k).toBeCloseTo(1.093967, 6);
        });

        it('should calculate power regression and RSD precisely across 100s, 1000s, and 10k scales', () => {
            const x100 = new Float64Array([110.5, 125.2, 140.8, 155.1, 170.4, 185.7, 200.2, 215.9, 230.1, 245.6]);
            const y100 = new Float64Array([12.45, 14.10, 15.80, 17.35, 18.95, 20.50, 22.05, 23.60, 25.10, 26.65]);
            const reg100 = new Regression(x100, y100);
            const res100 = reg100.power();
            const rsd100 = reg100.RSD('power');
            expect(res100.b0).toBeCloseTo(0.143811, 6);
            expect(res100.b1).toBeCloseTo(0.949355, 6);
            expect(rsd100).toBeCloseTo(0.057047, 6);

            const x1000 = new Float64Array([1150.2, 1300.5, 1450.8, 1600.1, 1750.4, 1900.7, 2050.3, 2200.6, 2350.9, 2500.2]);
            const y1000 = new Float64Array([45.20, 51.10, 56.80, 62.30, 67.75, 73.10, 78.40, 83.65, 88.85, 94.05]);
            const reg1000 = new Regression(x1000, y1000);
            const res1000 = reg1000.power();
            const rsd1000 = reg1000.RSD('power');
            expect(res1000.b0).toBeCloseTo(0.060761, 6);
            expect(res1000.b1).toBeCloseTo(0.939160, 6);
            expect(rsd1000).toBeCloseTo(0.232682, 6);

            const x10k = new Float64Array([10500.2, 12050.5, 13500.8, 15050.1, 16500.4, 18050.7, 19500.3, 21050.6, 22500.9, 24050.2]);
            const y10k = new Float64Array([120.50, 137.80, 154.20, 171.10, 187.35, 204.05, 220.15, 236.80, 252.85, 269.45]);
            const reg10k = new Regression(x10k, y10k);
            const res10k = reg10k.power();
            const rsd10k = reg10k.RSD('power');
            expect(res10k.b0).toBeCloseTo(0.015059, 6);
            expect(res10k.b1).toBeCloseTo(0.970771, 6);
            expect(rsd10k).toBeCloseTo(0.182177, 6);
        });
    });
});