import { RegressionType } from "../../types";
import { covariance } from "../statistics/bivariate";
import { mean, variance } from "../statistics/univariate";

export default class Regression {
    private _x: number[];
    private _y: number[];
    private _lnY: number[];
    private _lnX: number[];
    private _xMean: number;
    private _yMean: number;
    private _lnxMean: number;
    private _lnyMean: number;
    private _b0: number | null = null;
    private _b1: number | null = null;
    private _b0Exp: number | null = null;
    private _b1Exp: number | null = null;
    private _b0Pow: number | null = null;
    private _b1Pow: number | null = null;
    private _xHasNonPositive: boolean = false;
    private _yHasNonPositive: boolean = false;

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

        if (!this._xHasNonPositive)
            this._lnX = x.map((val) => Math.log(val));

        if (!this._yHasNonPositive)
            this._lnY = y.map((val) => Math.log(val));

        this._xMean = mean(this._x);
        this._yMean = mean(this._y);
        this._lnxMean = mean(this._lnX);
        this._lnyMean = mean(this._lnY);
    }

    private calculate(
        x: number[],
        y: number[],
        type: RegressionType
    ): { b0: number, b1: number } {
        const xVar = variance(x);

        if (xVar === 0) {
            throw new Error(
                'Regression could not be calculated because the\
                independent variable has zero variance!'
            );
        }

        const b1 = covariance(x, y) / xVar;

        const xMean = type === 'POWER' ? this._lnxMean : this._xMean;
        const yMean = type === 'LINEAR' ? this._yMean : this._lnyMean;

        const b0 = yMean - b1 * xMean;

        return {
            b0, b1
        };
    }

    public linear() {
        if (this._b0 !== null && this._b1 !== null) {
            return {
                b0: this._b0,
                b1: this._b1
            };
        }

        const funcObj = this.calculate(
            this._x, this._y, 'LINEAR'
        );

        this._b0 = funcObj.b0;
        this._b1 = funcObj.b1;

        return {
            b0: this._b0,
            b1: this._b1
        };
    }

    public exponential() {
        if (this._yHasNonPositive) {
            throw new Error(
                'Exponential regression could not be calculated because of\
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
            this._x, this._lnY, 'EXPONENTIAL'
        );

        this._b0Exp = Math.exp(funcObj.b0);
        this._b1Exp = Math.exp(funcObj.b1);

        return {
            b0: this._b0Exp,
            b1: this._b1Exp
        };
    }

    public power() {
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
            this._lnX, this._lnY, 'POWER'
        );

        this._b0Pow = Math.exp(funcObj.b0);
        this._b1Pow = funcObj.b1;

        return {
            b0: this._b0Pow,
            b1: this._b1Pow
        };
    }
}