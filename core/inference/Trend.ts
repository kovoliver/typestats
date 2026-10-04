import type { TrendType } from "../types/types.js";
import { Cache } from "../abstractions/abstractClasses.js";
import Matrix from "../math/Matrix.js";
import {
    calculateMSE
} from "../utils/numberUtils.js";
import {
    getYandXYsum,
    getLogYandLogXYsum,
    getLogarithmicSums,
    getPolynomialSums
} from "../wasm.js";

/**
 * Trend models fitted on an equally spaced series.
 *
 * Convention: the time index is 1-based, i.e. x = t = 1, 2, ..., n
 * (the same convention as statsmodels' `add_trend` or Excel's `TREND` with omitted x).
 * Consequently, the intercept of the linear model (and the scale factor of the
 * exponential model) refers to t = 0, one step before the first observation.
 */
export default class Trend extends Cache {
    private _y: Float64Array;
    private _x: Float64Array | null = null;
    private _n: number;
    private _hasNonPositive: boolean = false;
    private _xMean: number;
    private _xVar: number;
    private _xSum: number;
    private _xSquaresSum: number;
    private _ySum: number = 0;
    private _xySum: number = 0;

    private _lnY: Float64Array | null = null;
    private _lnySum: number | null = null;
    private _lnxySum: number | null = null;

    /**
     * Initialises the trend calculator with an array of observations.
     * 
     * @param values Array of numerical observations where indices represent sequential time units (x = 1, 2, ..., n). Must contain at least 2 items.
     * @throws {Error} If the input array contains fewer than 2 elements.
     */
    constructor(values: Float64Array) {
        super();

        const n = values.length;
        if (n < 2) {
            throw new Error('Trend calculation requires at least two data points!');
        }

        this._y = values;
        this._n = n;
        this._hasNonPositive = values.some(v => v <= 0);

        this._xMean = (n + 1) / 2;
        this._xVar = (n * n - 1) / 12;
        this._xSum = (n * (n + 1)) / 2;
        this._xSquaresSum = (n * (n + 1) * (2 * n + 1)) / 6;

        const [ySum, xySum] = getYandXYsum(values);

        this._ySum = ySum;
        this._xySum = xySum;
    }

    /**
     * Gets the total number of data points (sample size).
     * 
     * @returns The count of observations (N).
     */
    public get N(): number {
        return this._n;
    }

    /**
     * Lazy accessor for explicit x-array [1, 2, ..., n], instantiated only when MSE or polynomial/log trends require it.
     */
    private get X(): Float64Array {
        if (this._x === null) {
            this._x = new Float64Array(this._n);
            for (let i = 0; i < this._n; i++) {
                this._x[i] = i + 1;
            }
        }
        return this._x;
    }

    private ensureLogTransformed(): { lnySum: number; lnxySum: number } {
        if (this._hasNonPositive) {
            throw new Error('Exponential trend cannot be calculated for zero or negative values.');
        }

        if (this._lnY === null) {
            const { lny_sum, lnxy_sum, ln_y } = getLogYandLogXYsum(this._y);

            this._lnY = ln_y;
            this._lnySum = lny_sum;
            this._lnxySum = lnxy_sum;
        }

        return {
            lnySum: this._lnySum!,
            lnxySum: this._lnxySum!,
        };
    }

    /**
     * Helper to compute OLS parameters using closed-form Cov(x, y) / Var(x) logic.
     */
    private computeOLS(ySum: number, xySum: number): { a: number; b: number } {
        const yMean = ySum / this._n;
        const covXY = (xySum / this._n) - (this._xMean * yMean);

        const slope = covXY / this._xVar;
        const intercept = yMean - (slope * this._xMean);

        return { a: intercept, b: slope };
    }

    /**
     * Calculates the linear trend model using Ordinary Least Squares (OLS).
     * Model equation: ŷ = a + b * x, where x = 1, 2, ..., n.
     * 
     * @returns An object containing y-intercept (`a`, the value at x = 0) and slope (`b`).
     */
    public linear(): { a: number; b: number } {
        return this.getCached('linear', () => {
            return this.computeOLS(this._ySum, this._xySum);
        });
    }

    /**
     * Calculates the exponential trend model.
     * Model equation: ŷ = a * (b^x), where x = 1, 2, ..., n.
     * 
     * @returns An object containing scale factor (`a`, the value at x = 0) and growth base (`b`).
     * @throws {Error} If the dataset contains zero or negative values.
     */
    public exponential(): { a: number; b: number } {
        return this.getCached('exponential', () => {
            const { lnySum, lnxySum } = this.ensureLogTransformed();
            const funcObj = this.computeOLS(lnySum, lnxySum);

            return {
                a: Math.exp(funcObj.a),
                b: Math.exp(funcObj.b),
            };
        });
    }

    /**
     * Calculates a polynomial trend model of a specified degree using matrix inversion.
     * Model equation: ŷ = a0 + a1*x + a2*(x^2) + ... + ak*(x^k), where x = 1, 2, ..., n.
     * 
     * @param degree The degree of the polynomial. Must be an integer between 2 and 5.
     * @returns An object mapping coefficient names (`a0`, `a1`, etc.) to their fitted values.
     * @throws {Error} If degree is not an integer or is outside the range [2, 5].
     */
    public polynomial(degree: number): Record<string, number> {
        if (!Number.isInteger(degree) || degree < 2 || degree > 5) {
            throw new Error(`Invalid polynomial degree: ${degree}. Degree must be an integer between 2 and 5.`);
        }

        return this.getCached(`polynomial_${degree}`, () => {
            const sums = getPolynomialSums(this.X, this._y, degree);

            const eqComps = sums.subarray(0, degree * 2 + 1);
            const resultComps = new Float64Array(degree + 1);

            resultComps[0] = this._ySum;
            resultComps.set(sums.subarray(degree * 2 + 1), 1);

            const equation: Float64Array[] = new Array(degree + 1);

            for (let i = 0; i <= degree; i++) {
                equation[i] = eqComps.slice(i, i + degree + 1);
            }

            const m = new Matrix(equation);
            const solved = m.solve(resultComps);

            const result: Record<string, number> = {};
            for (let i = 0; i < solved.length; i++) {
                result[`a${i}`] = solved[i];
            }

            return result;
        });
    }

    /**
     * Calculates the logarithmic trend model using transformed OLS: z = ln(x).
     * Model equation: ŷ = a + b * ln(x), where x = 1, 2, ..., n.
     * 
     * @returns An object containing constant term (`a`) and slope coefficient (`b`).
     * @throws {Error} If there is zero variance in x values or N < 2.
     */
    public logarithmic(): { a: number; b: number } {
        return this.getCached('logarithmic', () => {
            const [totalZSum, totalZ2Sum, totalZiyi] = getLogarithmicSums(this.X, this._y);

            const zAvg = totalZSum / this.N;
            const yMean = this._ySum / this.N;

            const numerator =
                this.N * totalZiyi - totalZSum * this._ySum;

            const denominator =
                this.N * totalZ2Sum - Math.pow(totalZSum, 2);

            if (denominator === 0) {
                throw new Error(
                    'Cannot fit logarithmic trend: Zero variance in x values (all x values are identical or N < 2).'
                );
            }

            const slope = numerator / denominator;
            const intercept = yMean - slope * zAvg;

            return {
                a: intercept,
                b: slope
            };
        });
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted linear trend model.
     * 
     * @param degreesOfFreedom - Estimated parameters count (k). Defaults to 0.
     * @returns The average of squared residuals for the linear model.
     */
    public MSELinear(degreesOfFreedom: number = 0): number {
        const { a, b } = this.linear();

        return calculateMSE(
            this._y,
            this.X,
            'linear',
            Float64Array.of(a, b),
            degreesOfFreedom
        );
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted exponential trend model.
     * 
     * @param degreesOfFreedom - Estimated parameters count (k). Defaults to 0.
     * @returns The average of squared residuals for the exponential model.
     */
    public MSEExponential(degreesOfFreedom: number = 0): number {
        const { a, b } = this.exponential();

        return calculateMSE(
            this._y,
            this.X,
            'exponential',
            Float64Array.of(a, b),
            degreesOfFreedom
        );
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted polynomial trend model of a given degree.
     * 
     * @param degree The polynomial degree (integer between 2 and 5).
     * @param degreesOfFreedom - Estimated parameters count (k). Defaults to 0.
     * @returns The average of squared residuals for the polynomial model.
     */
    public MSEPolynomial(degree: number, degreesOfFreedom: number = 0): number {
        const coeffsObj = this.polynomial(degree);
        const coeffs = new Float64Array(degree + 1);

        for (let i = 0; i <= degree; i++) {
            coeffs[i] = coeffsObj[`a${i}`];
        }

        return calculateMSE(
            this._y,
            this.X,
            'polynomial',
            coeffs,
            degreesOfFreedom
        );
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted logarithmic trend model.
     * 
     * @param degreesOfFreedom - Estimated parameters count (k). Defaults to 0.
     * @returns The average of squared residuals for the logarithmic model.
     */
    public MSELogarithmic(degreesOfFreedom: number = 0): number {
        const { a, b } = this.logarithmic();

        return calculateMSE(
            this._y,
            this.X,
            'logarithmic',
            Float64Array.of(a, b),
            degreesOfFreedom
        );
    }

    /**
     * Unified method to compute the Mean Squared Error (MSE) for any supported trend type.
     * 
     * @param trendType The target trend model ('linear' | 'exponential' | 'polynomial' | 'logarithmic').
     * @param degree Required only when trendType is 'polynomial'. Integer between 2 and 5.
     * @param degreesOfFreedom Optional degrees of freedom parameter (k). Defaults to 0.
     * @returns The Mean Squared Error of the specified trend model.
     * @throws {Error} If trendType is 'polynomial' but degree is not provided, or if trendType is unknown.
     */
    public MSE(trendType: TrendType, degree?: number, degreesOfFreedom: number = 0): number {
        if (trendType === 'polynomial' && !degree) {
            throw new Error('Degree is required for polynomial trend calculation.');
        }

        switch (trendType) {
            case 'linear':
                return this.MSELinear(degreesOfFreedom);
            case 'exponential':
                return this.MSEExponential(degreesOfFreedom);
            case 'polynomial':
                return this.MSEPolynomial(degree!, degreesOfFreedom);
            case 'logarithmic':
                return this.MSELogarithmic(degreesOfFreedom);
        }

        throw new Error('Unknown trend type!');
    }
}