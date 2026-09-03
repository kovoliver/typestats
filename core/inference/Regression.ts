import { RegressionType } from "../types/types.js";
import { covariance } from "../statistics/bivariate.js";
import { mean, variance } from "../statistics/univariate.js";

/**
 * Represents a statistical tool for calculating linear, exponential, and power regression models.
 * Calculates and caches the coefficients based on the provided independent and dependent variables.
 */
export default class Regression {
    private _x: number[];
    private _y: number[];
    private _lnY: number[];
    private _lnX: number[];
    private _xMean: number;
    private _yMean: number;
    private _lnxMean: number|null = null;
    private _lnyMean: number|null = null;
    private _b0: number | null = null;
    private _b1: number | null = null;
    private _b0Exp: number | null = null;
    private _b1Exp: number | null = null;
    private _b0Pow: number | null = null;
    private _b1Pow: number | null = null;
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
                'Regression could not be calculated because the \
                independent variable has zero variance!'
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

    /**
     * Calculates the linear regression parameters for the equation: y = b0 + b1 * x.
     * The result is cached after the first calculation.
     * 
     * @returns {{ b0: number, b1: number }} An object containing the y-intercept (b0) and the slope (b1).
     */
    public linear(): { b0: number, b1: number } {
        if (this._b0 !== null && this._b1 !== null) {
            return {
                b0: this._b0,
                b1: this._b1
            };
        }

        const funcObj = this.calculate(
            this._x, this._y, 'linear'
        );

        this._b0 = funcObj.b0;
        this._b1 = funcObj.b1;

        return {
            b0: this._b0,
            b1: this._b1
        };
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
                'Exponential regression could not be calculated because of \
                non-positive values in the dependent variable!'
            );
        }

        if (this._b0Exp !== null && this._b1Exp !== null) {
            return {
                b0: this._b0Exp,
                b1: this._b1Exp
            };
        }

        const funcObj = this.calculate(
            this._x, this._lnY, 'exponential'
        );

        this._b0Exp = Math.exp(funcObj.b0);
        this._b1Exp = Math.exp(funcObj.b1);

        return {
            b0: this._b0Exp,
            b1: this._b1Exp
        };
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
                'Power regression could not be calculated because of \
                non-positive values in either the independent or dependent variable!'
            );
        }

        if (this._b0Pow !== null && this._b1Pow !== null) {
            return {
                b0: this._b0Pow,
                b1: this._b1Pow
            };
        }

        const funcObj = this.calculate(
            this._lnX, this._lnY, 'power'
        );

        this._b0Pow = Math.exp(funcObj.b0);
        this._b1Pow = funcObj.b1;

        return {
            b0: this._b0Pow,
            b1: this._b1Pow
        };
    }
}