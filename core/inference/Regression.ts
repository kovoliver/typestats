import { RegressionType } from "../types/types.js";
import { mean } from "../statistics/univariate.js";
import { Cache } from "../abstractions/abstractClasses.js";
import { varianceAndCovariance, neumaierDotProductAndSumPow2, calculateMSE }
    from "../utils/numberUtils.js";

/**
 * Represents a statistical tool for calculating linear, exponential, and power regression models.
 * Calculates and caches the coefficients based on the provided independent and dependent variables.
 */
export default class Regression extends Cache {
    private _x: Float64Array;
    private _y: Float64Array;
    private _lnY: Float64Array | null = null;
    private _lnX: Float64Array | null = null;
    private _xMean: number;
    private _yMean: number;
    private _lnxMean: number | null = null;
    private _lnyMean: number | null = null;
    private _xHasNonPositive: boolean = false;
    private _yHasNonPositive: boolean = false;

    constructor(x: Float64Array, y: Float64Array) {
        super();

        const len = x.length;

        if (len < 2 || y.length < 2) {
            throw new Error(
                'You must provide at least two dependent and independent variable values!'
            );
        }

        if (len !== y.length) {
            throw new Error(
                'You must add the same number of independent and dependent values!'
            );
        }

        this._x = x;
        this._y = y;

        for (let i = 0; i < len; i++) {
            if (!this._xHasNonPositive && x[i] <= 0) this._xHasNonPositive = true;
            if (!this._yHasNonPositive && y[i] <= 0) this._yHasNonPositive = true;
            if (this._xHasNonPositive && this._yHasNonPositive) break;
        }

        this._xMean = mean(this._x);
        this._yMean = mean(this._y);
    }

    private getLnX(): { arr: Float64Array; mean: number } {
        if (!this._lnX) {
            const len = this._x.length;
            const lnX = new Float64Array(len);
            for (let i = 0; i < len; i++) {
                lnX[i] = Math.log(this._x[i]);
            }
            this._lnX = lnX;
            this._lnxMean = mean(lnX);
        }
        return { arr: this._lnX, mean: this._lnxMean! };
    }

    private getLnY(): { arr: Float64Array; mean: number } {
        if (!this._lnY) {
            const len = this._y.length;
            const lnY = new Float64Array(len);
            for (let i = 0; i < len; i++) {
                lnY[i] = Math.log(this._y[i]);
            }
            this._lnY = lnY;
            this._lnyMean = mean(lnY);
        }
        return { arr: this._lnY, mean: this._lnyMean! };
    }

    private calculate(
        x: Float64Array,
        y: Float64Array,
        type: RegressionType
    ): { b0: number; b1: number } {
        const xMean = type === 'power' ? this.getLnX().mean : this._xMean;
        const yMean = type === 'linear' ? this._yMean : this.getLnY().mean;

        const { xVar, cov } = varianceAndCovariance(x, y, xMean, yMean);

        if (xVar === 0) {
            throw new Error(
                'Regression could not be calculated because the independent variable has zero variance!'
            );
        }

        const b1 = cov / xVar;
        const b0 = yMean - b1 * xMean;

        return { b0, b1 };
    }

    private calculateNoIntercept(x: Float64Array, y: Float64Array): number {
        const { xySum, x2Sum } = neumaierDotProductAndSumPow2(x, y);

        if (x2Sum === 0) {
            throw new Error(
                'Regression could not be calculated because the independent variable has zero sum of squares!'
            );
        }

        return xySum / x2Sum;
    }

    public linearNoIntercept(): number {
        return this.getCached('linear_no_intercept', () => {
            return this.calculateNoIntercept(this._x, this._y);
        });
    }

    public exponentialNoIntercept(): number {
        if (this._yHasNonPositive) {
            throw new Error(
                'Exponential regression could not be calculated because of non-positive values in the dependent variable!'
            );
        }

        return this.getCached('exponential_no_intercept', () => {
            return Math.exp(this.calculateNoIntercept(this._x, this.getLnY().arr));
        });
    }

    public powerNoIntercept(): number {
        if (this._xHasNonPositive || this._yHasNonPositive) {
            throw new Error(
                'Power regression could not be calculated because of non-positive values in either the independent or dependent variable!'
            );
        }

        return this.getCached('power_no_intercept', () => {
            return this.calculateNoIntercept(this.getLnX().arr, this.getLnY().arr);
        });
    }

    public linear(): { b0: number; b1: number } {
        return this.getCached('linear', () => {
            return this.calculate(this._x, this._y, 'linear');
        });
    }

    public exponential(): { b0: number; b1: number } {
        if (this._yHasNonPositive) {
            throw new Error(
                'Exponential regression could not be calculated because of non-positive values in the dependent variable!'
            );
        }

        return this.getCached('exponential', () => {
            const funcObj = this.calculate(this._x, this.getLnY().arr, 'exponential');
            return {
                b0: Math.exp(funcObj.b0),
                b1: Math.exp(funcObj.b1)
            };
        });
    }

    public power(): { b0: number; b1: number } {
        if (this._xHasNonPositive || this._yHasNonPositive) {
            throw new Error(
                'Power regression could not be calculated because of non-positive values in either the independent or dependent variable!'
            );
        }

        return this.getCached('power', () => {
            const funcObj = this.calculate(this.getLnX().arr, this.getLnY().arr, 'power');
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
        return b0 * Math.pow(b1, x);
    }

    public powerFunc(b0: number, b1: number, x: number): number {
        return b0 * Math.pow(x, b1);
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

            let predict: (i: number) => number;

            if (regression === 'linear') {
                predict = (i) => this.linearFunc(b0, b1, this._x[i]);
            } else if (regression === 'exponential') {
                predict = (i) => this.exponentialFunc(b0, b1, this._x[i]);
            } else {
                predict = (i) => this.powerFunc(b0, b1, this._x[i]);
            }

            const mseVal = calculateMSE(this._y, predict, 2);
            return Math.sqrt(mseVal);
        });
    }

    public RSDLinear(): number {
        return this.RSD('linear');
    }

    public RSDExponential(): number {
        return this.RSD('exponential');
    }

    public RSDPower(): number {
        return this.RSD('power');
    }

    public RSDNoIntercept(
        regression: 'linear_no_intercept' | 'exponential_no_intercept' | 'power_no_intercept'
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

            let predict: (i: number) => number;

            if (regression === 'linear_no_intercept') {
                predict = (i) => this._x[i] * slope;
            } else if (regression === 'exponential_no_intercept') {
                predict = (i) => Math.pow(slope, this._x[i]);
            } else {
                predict = (i) => Math.pow(this._x[i], slope);
            }

            const mseVal = calculateMSE(this._y, predict, 1);
            return Math.sqrt(mseVal);
        });
    }

    public RSDLinearNoIntercept(): number {
        return this.RSDNoIntercept('linear_no_intercept');
    }

    public RSDExponentialNoIntercept(): number {
        return this.RSDNoIntercept('exponential_no_intercept');
    }

    public RSDPowerNoIntercept(): number {
        return this.RSDNoIntercept('power_no_intercept');
    }
}