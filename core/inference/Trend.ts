import type { TrendType } from "../types/types.js";
import { Cache } from "../abstractions/abstractClasses.js";
import Matrix from "../math/Matrix.js";
import { calculateMSE } from "../utils/numberUtils.js";

export default class Trend extends Cache {
    private _y: Float64Array;
    private _n: number;
    private _hasNonPositive: boolean = false;

    private _xSum: number = 0;
    private _xSquaresSum: number = 0;
    private _ySum: number = 0;
    private _xySum: number = 0;

    private _lnY: Float64Array | null = null;
    private _lnySum: number | null = null;
    private _lnxySum: number | null = null;

    /**
     * Initialises the trend calculator with an array of observations.
     * 
     * @param values Array of numerical observations where indices represent sequential time units (x = 0, 1, ..., n-1). Must contain at least 2 items.
     * @throws {Error} If the input array contains fewer than 2 elements.
     */
    constructor(values: Float64Array) {
        super();

        if (values.length < 2) {
            throw new Error('Trend calculation requires at least two data points!');
        }

        this._y = values;
        this._n = this._y.length;
        this._hasNonPositive = values.some(v => v <= 0);

        let xSum = 0, xC = 0;
        let x2Sum = 0, x2C = 0;
        let ySum = 0, yC = 0;
        let xySum = 0, xyC = 0;

        for (let i = 0; i < this._n; i++) {
            const x = i;
            const y = this._y[i];

            let t = xSum + x;
            xC += Math.abs(xSum) >= Math.abs(x) ? (xSum - t) + x : (x - t) + xSum;
            xSum = t;

            const x2 = x * x;
            t = x2Sum + x2;
            x2C += Math.abs(x2Sum) >= Math.abs(x2) ? (x2Sum - t) + x2 : (x2 - t) + x2Sum;
            x2Sum = t;

            t = ySum + y;
            yC += Math.abs(ySum) >= Math.abs(y) ? (ySum - t) + y : (y - t) + ySum;
            ySum = t;

            const xy = x * y;
            t = xySum + xy;
            xyC += Math.abs(xySum) >= Math.abs(xy) ? (xySum - t) + xy : (xy - t) + xySum;
            xySum = t;
        }

        this._xSum = xSum + xC;
        this._xSquaresSum = x2Sum + x2C;
        this._ySum = ySum + yC;
        this._xySum = xySum + xyC;
    }

    /**
     * Gets the total number of data points (sample size).
     * 
     * @returns The count of observations (N).
     */
    public get N(): number {
        return this._n;
    }

    private ensureLogTransformed(): { lnySum: number; lnxySum: number } {
        if (this._hasNonPositive) {
            throw new Error('Exponential trend cannot be calculated for zero or negative values.');
        }

        if (this._lnY === null) {
            this._lnY = new Float64Array(this._n);
            let lnySum = 0, lnyC = 0;
            let lnxySum = 0, lnxyC = 0;

            for (let i = 0; i < this._n; i++) {
                const lnVal = Math.log(this._y[i]);
                this._lnY[i] = lnVal;

                let t = lnySum + lnVal;
                lnyC += Math.abs(lnySum) >= Math.abs(lnVal) ? (lnySum - t) + lnVal : (lnVal - t) + lnySum;
                lnySum = t;

                const lnxy = i * lnVal;
                t = lnxySum + lnxy;
                lnxyC += Math.abs(lnxySum) >= Math.abs(lnxy) ? (lnxySum - t) + lnxy : (lnxy - t) + lnxySum;
                lnxySum = t;
            }

            this._lnySum = lnySum + lnyC;
            this._lnxySum = lnxySum + lnxyC;
        }

        return {
            lnySum: this._lnySum!,
            lnxySum: this._lnxySum!,
        };
    }

    /**
     * Internal OLS helper to compute linear parameters.
     * @returns {{ a: number, b: number }} Object where `a` is the y-intercept and `b` is the slope.
     */
    private trend(xSum: number, ySum: number, xySum: number, xSquaresSum: number): { a: number, b: number } {
        const xSquareSumb1 = xSquaresSum * this.N;
        const xySumb1 = xySum * this.N;

        const xSumb2 = xSum * xSum;
        const ySumb2 = ySum * xSum;

        const denominator = xSquareSumb1 - xSumb2;
        const numerator = xySumb1 - ySumb2;

        const slope = numerator / denominator;
        const intercept = (ySum - (slope * xSum)) / this.N;

        return {
            a: intercept,
            b: slope
        };
    }

    /**
     * Calculates the linear trend model using Ordinary Least Squares (OLS).
     * Model equation: ŷ = a + b * x
     * 
     * @returns An object containing y-intercept (`a`) and slope (`b`).
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
        return this.getCached('exponential', () => {
            const { lnySum, lnxySum } = this.ensureLogTransformed();

            const funcObj = this.trend(
                this._xSum,
                lnySum,
                lnxySum,
                this._xSquaresSum
            );

            return {
                a: Math.exp(funcObj.a),
                b: Math.exp(funcObj.b),
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
            const eqComps = new Float64Array(degree * 2 + 1);
            const resultComps = new Float64Array(degree + 1);

            resultComps[0] = this._ySum;
            const equation: Float64Array[] = new Array(degree + 1);

            for (let deg = 0; deg <= degree * 2; deg++) {
                let compX = this._n;

                if (deg !== 0) {
                    let sum = 0, c = 0;
                    for (let i = 0; i < this._n; i++) {
                        const val = Math.pow(i, deg);
                        const t = sum + val;
                        c += Math.abs(sum) >= Math.abs(val) ? (sum - t) + val : (val - t) + sum;
                        sum = t;
                    }
                    compX = sum + c;
                }

                eqComps[deg] = compX;

                if (deg <= degree && deg !== 0) {
                    let compRes = 0, cRes = 0;
                    for (let i = 0; i < this._n; i++) {
                        const val = Math.pow(i, deg) * this._y[i];
                        const t = compRes + val;
                        cRes += Math.abs(compRes) >= Math.abs(val) ? (compRes - t) + val : (val - t) + compRes;
                        compRes = t;
                    }

                    resultComps[deg] = compRes + cRes;
                }
            }

            for (let i = 0; i <= degree; i++) {
                const eqLine = new Float64Array(degree + 1);

                for (let j = 0; j <= degree; j++) {
                    eqLine[j] = eqComps[i + j];
                }

                equation[i] = eqLine;
            }

            const m: Matrix = new Matrix(equation);
            const solved: Float64Array = m.solve(resultComps);

            const result: Record<string, number> = {};
            for (let i = 0; i < solved.length; i++) {
                result[`a${i}`] = solved[i];
            }

            return result;
        });
    }

    /**
     * Calculates the logarithmic trend model using transformed OLS: z = ln(x + 1).
     * Model equation: ŷ = a + b * ln(x + 1)
     * 
     * @returns An object containing constant term (`a`) and slope coefficient (`b`).
     * @throws {Error} If there is zero variance in x values or N < 2.
     */
    public logarithmic(): { a: number, b: number } {
        return this.getCached('logarithmic', () => {
            let zSum = 0, zC = 0;
            let z2Sum = 0, z2C = 0;
            let ziyi = 0, ziC = 0;

            for (let x = 0; x < this._n; x++) {
                const z = Math.log(x + 1);
                const y = this._y[x];

                let t = zSum + z;
                zC += Math.abs(zSum) >= Math.abs(z) ? (zSum - t) + z : (z - t) + zSum;
                zSum = t;

                const z2 = z * z;
                t = z2Sum + z2;
                z2C += Math.abs(z2Sum) >= Math.abs(z2) ? (z2Sum - t) + z2 : (z2 - t) + z2Sum;
                z2Sum = t;

                const zy = z * y;
                t = ziyi + zy;
                ziC += Math.abs(ziyi) >= Math.abs(zy) ? (ziyi - t) + zy : (zy - t) + ziyi;
                ziyi = t;
            }

            const totalZSum = zSum + zC;
            const totalZ2Sum = z2Sum + z2C;
            const totalZiyi = ziyi + ziC;

            const zAvg = totalZSum / this.N;
            const yMean = this._ySum / this.N;

            const numerator = this.N * totalZiyi - totalZSum * this._ySum;
            const denominator = this.N * totalZ2Sum - Math.pow(totalZSum, 2);

            if (denominator === 0) {
                throw new Error('Cannot fit logarithmic trend: Zero variance in x values (all x values are identical or N < 2).');
            }

            const slope = numerator / denominator;
            const intercept = yMean - slope * zAvg;

            return {
                a: intercept,
                b: slope
            };
        });
    }

    private getYHatLinear(a: number, b: number, x: number): number {
        return a + b * x;
    }

    private getYHatExponential(a: number, b: number, x: number): number {
        return a * Math.pow(b, x);
    }

    private getYHatPolynomial(variables: Float64Array, x: number): number {
        return variables.reduce((total, val, exp) => total + val * Math.pow(x, exp), 0);
    }

    private getYHatLogarithmic(a: number, b: number, x: number): number {
        return a + b * Math.log(x + 1);
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted linear trend model.
     * 
     * @param degreesOfFreedom - Estimated parameters count (k). Defaults to 0.
     * @returns The average of squared residuals for the linear model.
     */
    public MSELinear(degreesOfFreedom: number = 0): number {
        const funcObj = this.linear();

        return calculateMSE(
            this._y, 
            (i) => this.getYHatLinear(funcObj.a, funcObj.b, i),
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
        const funcObj = this.exponential();

        return calculateMSE(
            this._y,
            (i) => this.getYHatExponential(funcObj.a, funcObj.b, i),
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
        const keys = Object.keys(coeffsObj);
        const coeffs = new Float64Array(keys.length);
        
        for (let i = 0; i < keys.length; i++) {
            coeffs[i] = coeffsObj[keys[i]];
        }

        return calculateMSE(
            this._y,
            (i) => this.getYHatPolynomial(coeffs, i),
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
        const funcObj = this.logarithmic();

        return calculateMSE(
            this._y,
            (i) => this.getYHatLogarithmic(funcObj.a, funcObj.b, i),
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