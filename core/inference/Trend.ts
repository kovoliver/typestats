import type { TrendType } from "../types/types.js";
import { Cache } from "../abstractions/abstractClasses.js";
import Matrix from "../math/Matrix.js";
import { neumaierSum, neumaierSumPow, neumaierSumDotProduct } 
from "../utils/numberUtils.js";

export default class Trend extends Cache {
    private _y: number[];
    private _lnY: number[] = [];
    private _xSum: number = 0;
    private _xSquaresSum: number = 0;
    private _ySum: number = 0;
    private _xySum: number = 0;
    private _lnySum: number = 0;
    private _lnxySum: number = 0;
    private _n: number;
    private _hasNonPositive: boolean = false;

    /**
     * Initialises the trend calculator with an array of observations.
     * 
     * @param values Array of numerical observations where indices represent sequential time units (x = 0, 1, ..., n-1). Must contain at least 2 items.
     * @throws {Error} If the input array contains fewer than 2 elements.
     */
    constructor(values: number[]) {
        super();

        if (values.length < 2) {
            throw new Error('You should give at least two values!');
        }

        this._y = values;
        this._n = this._y.length;
        this._hasNonPositive = values.some(v => v <= 0);
        const xValues = Array.from({ length: this._n }, (_, i) => i);

        this._xSum = neumaierSum(xValues);
        this._xSquaresSum = neumaierSumPow(xValues, 2);
        this._ySum = neumaierSum(this._y);
        this._xySum = neumaierSumDotProduct(xValues, this._y);

        if (!this._hasNonPositive) {
            this._lnY = this._y.map(v => Math.log(v));
            this._lnySum = neumaierSum(this._lnY);
            this._lnxySum = neumaierSumDotProduct(xValues, this._lnY);
        }
    }

    /**
     * Gets the total number of data points (sample size).
     * 
     * @returns The count of observations (N).
     */
    public get N(): number {
        return this._n;
    }

    private trend(xSum: number, ySum: number, xySum: number, xSquaresSum: number): { a: number, b: number } {
        const xSquareSumb1 = xSquaresSum * this.N;
        const xySumb1 = xySum * this.N;

        const xSumb2 = xSum * xSum;
        const ySumb2 = ySum * xSum;

        const denominator = xSquareSumb1 - xSumb2;
        const numerator = xySumb1 - ySumb2;

        const a = numerator / denominator;
        const b = (ySum - (a * xSum)) / this.N;

        return { a, b };
    }

    /**
     * Calculates the linear trend model using Ordinary Least Squares (OLS).
     * Model equation: ŷ = a * x + b
     * 
     * @returns An object containing slope (`a`) and y-intercept (`b`).
     */
    public linear(): { a: number, b: number } {
        return this.getCached('linear', () => {
            return this.trend(
                this._xSum,
                this._ySum,
                this._xySum,
                this._xSquaresSum
            );
        });
    }

    /**
     * Calculates the exponential trend model.
     * Model equation: ŷ = a * (b^x)
     * 
     * @returns An object containing scale factor (`a`) and growth base (`b`).
     * @throws {Error} If the dataset contains zero or negative values.
     */
    public exponential(): { a: number, b: number } {
        if (this._hasNonPositive) {
            throw new Error('Exponential trend cannot be calculated for zero or negative values.');
        }

        return this.getCached('exponential', () => {
            const funcObj = this.trend(
                this._xSum,
                this._lnySum,
                this._lnxySum,
                this._xSquaresSum
            );

            return {
                a: Math.exp(funcObj.b),
                b: Math.exp(funcObj.a),
            };
        });
    }

    /**
     * Calculates a polynomial trend model of a specified degree using matrix inversion.
     * Model equation: ŷ = a0 + a1*x + a2*(x^2) + ... + ak*(x^k)
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
            const eqComps: number[] = [];
            const resultComps: number[] = [];
            const xValues = Array.from({ length: this._n }, (_, i) => i);

            resultComps.push(this._ySum);
            const equation: number[][] = [];

            for (let deg = 0; deg <= degree * 2; deg++) {
                const compX = deg !== 0 ? neumaierSumPow(xValues, deg) : this._n;
                eqComps.push(compX);

                if (deg <= degree && deg !== 0) {
                    const xPowers = xValues.map(x => Math.pow(x, deg));
                    const compRes = neumaierSumDotProduct(xPowers, this._y);
                    resultComps.push(compRes);
                }
            }

            for (let i = 0; i <= degree; i++) {
                const eqLine: number[] = [];

                for (let j = i; j < degree + i + 1; j++) {
                    eqLine.push(eqComps[j]);
                }

                equation.push(eqLine);
            }

            const m: Matrix = new Matrix(equation);
            const solved: number[] = m.solve(resultComps);

            return solved.reduce<Record<string, number>>((acc, val, i) => {
                acc[`a${i}`] = val;
                return acc;
            }, {});
        });
    }

    /**
     * Calculates the logarithmic trend model using transformed OLS: z = ln(x + 1).
     * Model equation: ŷ = a * ln(x + 1) + b
     * 
     * @returns An object containing slope coefficient (`a`) and constant term (`b`).
     * @throws {Error} If there is zero variance in x values or N < 2.
     */
    public logarithmic(): { a: number, b: number } {
        return this.getCached('logarithmic', () => {
            const zValues = Array.from({ length: this._n }, (_, x) => Math.log(x + 1));

            const zSum = neumaierSum(zValues);
            const zSquaresSum = neumaierSumPow(zValues, 2);
            const ziyi = neumaierSumDotProduct(zValues, this._y);

            const zAvg = zSum / this.N;
            const yMean = this._ySum / this.N;

            const numerator = this.N * ziyi - zSum * this._ySum;
            const denominator = this.N * zSquaresSum - Math.pow(zSum, 2);

            if (denominator === 0) {
                throw new Error('Cannot fit logarithmic trend: Zero variance in x values (all x values are identical or N < 2).');
            }

            const a = numerator / denominator;
            const b = yMean - a * zAvg;

            return { a, b };
        });
    }

    private getYHatLinear(a: number, b: number, x: number): number {
        return a * x + b;
    }

    private getYHatExponential(a: number, b: number, x: number): number {
        return a * Math.pow(b, x);
    }

    private getYHatPolynomial(variables: number[], x: number): number {
        return variables.reduce((total, val, exp) => total + val * Math.pow(x, exp), 0);
    }

    private getYHatLogarithmic(a: number, b: number, x: number): number {
        return a * Math.log(x + 1) + b;
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted linear trend model.
     * 
     * @returns The average of squared residuals for the linear model.
     */
    public MSELinear(): number {
        const funcObj = this.linear();

        const sqErrors = this._y.map((val, i) => {
            const yHat = this.getYHatLinear(funcObj.a, funcObj.b, i);
            return Math.pow(val - yHat, 2);
        });

        return neumaierSum(sqErrors) / this._n;
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted exponential trend model.
     * 
     * @returns The average of squared residuals for the exponential model.
     */
    public MSEExponential(): number {
        const funcObj = this.exponential();

        const sqErrors = this._y.map((val, i) => {
            const yHat = this.getYHatExponential(funcObj.a, funcObj.b, i);
            return Math.pow(val - yHat, 2);
        });

        return neumaierSum(sqErrors) / this._n;
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted polynomial trend model of a given degree.
     * 
     * @param degree The polynomial degree (integer between 2 and 5).
     * @returns The average of squared residuals for the polynomial model.
     */
    public MSEPolynomial(degree: number): number {
        const coeffsObj = this.polynomial(degree);
        const coeffs = Object.values(coeffsObj);

        const sqErrors = this._y.map((val, i) => {
            const yHat = this.getYHatPolynomial(coeffs, i);
            return Math.pow(val - yHat, 2);
        });

        return neumaierSum(sqErrors) / this._n;
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted logarithmic trend model.
     * 
     * @returns The average of squared residuals for the logarithmic model.
     */
    public MSELogarithmic(): number {
        const funcObj = this.logarithmic();

        const sqErrors = this._y.map((val, i) => {
            const yHat = this.getYHatLogarithmic(funcObj.a, funcObj.b, i);
            return Math.pow(val - yHat, 2);
        });

        return neumaierSum(sqErrors) / this._n;
    }

    /**
     * Unified method to compute the Mean Squared Error (MSE) for any supported trend type.
     * 
     * @param trendType The target trend model ('linear' | 'exponential' | 'polynomial' | 'logarithmic').
     * @param degree Required only when trendType is 'polynomial'. Integer between 2 and 5.
     * @returns The Mean Squared Error of the specified trend model.
     * @throws {Error} If trendType is 'polynomial' but degree is not provided, or if trendType is unknown.
     */
    public MSE(trendType: TrendType, degree?: number): number {
        if (trendType === 'polynomial' && !degree) {
            throw new Error('Degree is required for polynomial trend calculation.');
        }

        switch (trendType) {
            case 'linear':
                return this.MSELinear();
            case 'exponential':
                return this.MSEExponential();
            case 'polynomial':
                return this.MSEPolynomial(degree!);
            case 'logarithmic':
                return this.MSELogarithmic();
        }

        throw new Error('Unknown trend type!');
    }
}