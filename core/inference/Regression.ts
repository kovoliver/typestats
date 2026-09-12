import { RegressionType } from "../types/types.js";
import { covariance } from "../statistics/bivariate.js";
import { mean, variance } from "../statistics/univariate.js";
import { Cache } from "../abstractions/abstractClasses.js";
import { neumaierSumDotProduct, neumaierSumPow } from "../utils/numberUtils.js";

/**
 * Represents a statistical tool for calculating linear, exponential, and power regression models.
 * Calculates and caches the coefficients based on the provided independent and dependent variables.
 */
export default class Regression extends Cache {
    private _x: number[];
    private _y: number[];
    private _lnY: number[];
    private _lnX: number[];
    private _xMean: number;
    private _yMean: number;
    private _lnxMean: number | null = null;
    private _lnyMean: number | null = null;
    private _xHasNonPositive: boolean = false;
    private _yHasNonPositive: boolean = false;

    /**
     * Initializes the regression model with independent and dependent variable datasets.
     * 
     * @param {number[]} x - An array of values for the independent variable.
     * @param {number[]} y - An array of values for the dependent variable.
     * @throws {Error} If fewer than two values are provided for either array.
     * @throws {Error} If the lengths of the `x` and `y` arrays do not match.
     */
    constructor(x: number[], y: number[]) {
        super();

        if (x.length < 2 || y.length < 2) {
            throw new Error(
                'You must provide at least two dependent and independent variable values!'
            );
        }

        if (x.length !== y.length) {
            throw new Error(
                'You must add the same number of independent and dependent values!'
            );
        }

        this._x = x;
        this._y = y;
        this._lnY = [];
        this._lnX = [];
        this._xHasNonPositive = x.some((val) => val <= 0);
        this._yHasNonPositive = y.some((val) => val <= 0);

        if (!this._xHasNonPositive) {
            this._lnX = x.map((val) => Math.log(val));
            this._lnxMean = mean(this._lnX);
        }

        if (!this._yHasNonPositive) {
            this._lnY = y.map((val) => Math.log(val));
            this._lnyMean = mean(this._lnY);
        }

        this._xMean = mean(this._x);
        this._yMean = mean(this._y);
    }

    /**
     * Calculates the core regression coefficients (b0 and b1) using the least squares method.
     * 
     * @param {number[]} x - The input array for the independent variable (can be transformed to ln(x)).
     * @param {number[]} y - The input array for the dependent variable (can be transformed to ln(y)).
     * @param {RegressionType} type - The type of regression being calculated ('LINEAR', 'EXPONENTIAL', or 'POWER').
     * @returns {{ b0: number, b1: number }} An object containing the calculated intercept (b0) and slope (b1).
     * @throws {Error} If the variance of the independent variable is zero.
     */
    private calculate(
        x: number[],
        y: number[],
        type: RegressionType
    ): { b0: number, b1: number } {
        const xVar = variance(x);

        if (xVar === 0) {
            throw new Error(
                'Regression could not be calculated because the independent variable has zero variance!'
            );
        }

        const b1 = covariance(x, y) / xVar;

        const xMean = type === 'power' ? this._lnxMean : this._xMean;
        const yMean = type === 'linear' ? this._yMean : this._lnyMean;

        const b0 = yMean! - b1 * xMean!;

        return {
            b0, b1
        };
    }

    private calculateNoIntercept(
        x: number[],
        y: number[]
    ) {
        const xySum = neumaierSumDotProduct(x, y);
        const xSum = neumaierSumPow(x, 2);
        return xySum / xSum;
    }

    public linearNoItcpt(): number {
        return this.getCached('linear_no_itcpt', () => {
            return this.calculateNoIntercept(this._x, this._y);
        });
    }

    public exponentialNoItcpt(): number {
        if (this._yHasNonPositive) {
            throw new Error(
                'Exponential regression could not be calculated because of non-positive values in the dependent variable!'
            );
        }

        return this.getCached('exponential_no_itcpt', () => {
            return Math.exp(this.calculateNoIntercept(this._x, this._lnY));
        });
    }

    public powerNoItcpt(): number {
        if (this._xHasNonPositive || this._yHasNonPositive) {
            throw new Error(
                'Power regression could not be calculated because of non-positive values in either the independent or dependent variable!'
            );
        }

        return this.getCached('power_no_itcpt', () => {
            return this.calculateNoIntercept(this._lnX, this._lnY);
        });
    }

    /**
     * Calculates the linear regression parameters for the equation: y = b0 + b1 * x.
     * The result is cached after the first calculation.
     * 
     * @returns {{ b0: number, b1: number }} An object containing the y-intercept (b0) and the slope (b1).
     */
    public linear(): { b0: number, b1: number } {
        return this.getCached('linear', () => {
            return this.calculate(this._x, this._y, 'linear');
        });
    }

    /**
     * Calculates the exponential regression parameters for the equation: y = b0 * (b1 ^ x).
     * The result is cached after the first calculation.
     * 
     * @returns {{ b0: number, b1: number }} An object containing the scale factor (b0) and the growth/decay base (b1).
     * @throws {Error} If the dependent variable (y) contains non-positive values, as logarithms cannot be calculated.
     */
    public exponential(): { b0: number, b1: number } {
        if (this._yHasNonPositive) {
            throw new Error(
                'Exponential regression could not be calculated because of non-positive values in the dependent variable!'
            );
        }

        return this.getCached('exponential', () => {
            const funcObj = this.calculate(this._x, this._lnY, 'exponential');
            return {
                b0: Math.exp(funcObj.b0),
                b1: Math.exp(funcObj.b1)
            };
        });
    }

    /**
     * Calculates the power regression parameters for the equation: y = b0 * (x ^ b1).
     * The result is cached after the first calculation.
     * 
     * @returns {{ b0: number, b1: number }} An object containing the proportionality constant (b0) and the exponent (b1).
     * @throws {Error} If either the independent (x) or dependent (y) variable contains non-positive values.
     */
    public power(): { b0: number, b1: number } {
        if (this._xHasNonPositive || this._yHasNonPositive) {
            throw new Error(
                'Power regression could not be calculated because of non-positive values in either the independent or dependent variable!'
            );
        }

        return this.getCached('power', () => {
            const funcObj = this.calculate(this._lnX, this._lnY, 'power');
            return {
                b0: Math.exp(funcObj.b0),
                b1: funcObj.b1
            };
        });
    }

    public linearFunc(b0: number, b1: number, x: number): number {
        return b0 + x * b1;
    }

    public exponentialFunc(b0: number, b1: number, x: number): number {
        return b0 * b1 ** x;
    }

    public powerFunc(b0: number, b1: number, x: number): number {
        return b0 * x ** b1;
    }

    public RSD(regression: 'linear' | 'exponential' | 'power'): number {
        const rsdKey = `rsd_${regression}`;

        return this.getCached(rsdKey, () => {
            if (!this.containsCache(regression)) {
                throw new Error(
                    `Cannot calculate RSD for '${regression}' regression because the model coefficients have not been calculated yet. Call .${regression}() first!`
                );
            }

            const { b0, b1 } = this.getCached<{ b0: number; b1: number }>(
                regression,
                () => { throw new Error('Unreachable code'); }
            );

            const residuals = this._y.map((y, i) => {
                const x = this._x[i];
                let yHat = 0;

                switch (regression) {
                    case 'linear':
                        yHat = this.linearFunc(b0, b1, x);
                        break;
                    case 'power':
                        yHat = this.powerFunc(b0, b1, x);
                        break;
                    case 'exponential':
                        yHat = this.exponentialFunc(b0, b1, x);
                        break;
                }

                return y - yHat;
            });

            const sse = neumaierSumPow(residuals, 2);
            const df = this._y.length - 2;

            return Math.sqrt(sse / df);
        });
    }

    public RSDLinear() {
        return this.RSD('linear');
    }

    public RSDExponential() {
        return this.RSD('exponential');
    }

    public RSDPower() {
        return this.RSD('power');
    }

    public RSDNoItcpt(
        regression: 'linear_no_itcpt' | 'exponential_no_itcpt' | 'power_no_itcpt'
    ): number {
        const rsdKey = `rsd_no_itcpt_${regression}`;

        return this.getCached(rsdKey, () => {
            if (!this.containsCache(regression)) {
                throw new Error(
                    `Cannot calculate RSD for '${regression}' regression because the model coefficients have not been calculated yet. Call the corresponding method first!`
                );
            }

            const slope = this.getCached<number>(
                regression,
                () => { throw new Error('Unreachable code'); }
            );

            const residuals = this._y.map((y, i) => {
                const x = this._x[i];
                let yHat = 0;

                switch (regression) {
                    case 'linear_no_itcpt':
                        yHat = this.linearFunc(0, slope, x);
                        break;
                    case 'exponential_no_itcpt':
                        yHat = this.exponentialFunc(1, slope, x);
                        break;
                    case 'power_no_itcpt':
                        yHat = this.powerFunc(1, slope, x);
                        break;
                }

                return y - yHat;
            });

            const sse = neumaierSumPow(residuals, 2);
            const df = this._y.length - 1;

            return Math.sqrt(sse / df);
        });
    }

    public RSDLinearNoItcpt() {
        return this.RSDNoItcpt('linear_no_itcpt');
    }

    public RSDExponentialNoItcpt() {
        return this.RSDNoItcpt('exponential_no_itcpt');
    }

    public RSDPowerNoItcpt() {
        return this.RSDNoItcpt('power_no_itcpt');
    }
}