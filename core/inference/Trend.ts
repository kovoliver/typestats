import type { TrendType } from "../types/types";
import Matrix from "../math/Matrix";

export default class Trend {
    private _y: number[];
    private _lnY: number[] = [];
    private _xSum: number = 0;
    private _xSquaresSum: number = 0;
    private _ySum: number = 0;
    private _xySum: number = 0;
    private _lnySum: number = 0;
    private _lnxySum: number = 0;
    private _n: number;
    private _a: number | null = null;
    private _b: number | null = null;
    private _expA: number | null = null;
    private _expB: number | null = null;
    private _logA:number|null = null;
    private _logB:number|null = null;
    private _hasNonPositive: boolean = false;
    private _polyCache: Map<number, Record<string, number>> = new Map();

    /**
     * Initialises the trend calculator with an array of observations.
     * 
     * @param values Array of numerical observations where indices represent sequential time units (x = 0, 1, ..., n-1). Must contain at least 2 items.
     * @throws {Error} If the input array contains fewer than 2 elements.
     */
    constructor(values: number[]) {
        if (values.length < 2) {
            throw new Error('You should give at least two values!');
        }

        this._y = values;
        this._n = this._y.length;
        this._hasNonPositive = values.some(v => v <= 0);

        for (let x = 0; x < this._n; x++) {
            const y = this._y[x];

            this._xSum += x;
            this._xSquaresSum += x * x;
            this._ySum += y;
            this._xySum += x * y;

            if (!this._hasNonPositive) {
                const lny = Math.log(y);
                this._lnY.push(lny);
                this._lnySum += lny;
                this._lnxySum += x * lny;
            }
        }
    }

    /**
     * Gets the total number of data points (sample size).
     * 
     * @returns The count of observations (N).
     */
    public get N() {
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
        if (this._a !== null && this._b !== null) {
            return { a: this._a, b: this._b };
        }

        const funcObj = this.trend(
            this._xSum,
            this._ySum,
            this._xySum,
            this._xSquaresSum
        );

        this._a = funcObj.a;
        this._b = funcObj.b;

        return funcObj;
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

        if (this._expA !== null && this._expB !== null) {
            return { a: this._expA, b: this._expB };
        }

        const funcObj = this.trend(
            this._xSum,
            this._lnySum,
            this._lnxySum,
            this._xSquaresSum
        );

        this._expA = Math.exp(funcObj.b);
        this._expB = Math.exp(funcObj.a);

        return {
            a: this._expA,
            b: this._expB,
        };
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

        if (this._polyCache.has(degree)) {
            return this._polyCache.get(degree)!;
        }

        const eqComps = [];
        const resultComps = [];
        const ySums = this._y.reduce((total, val) => total + val, 0);
        resultComps.push(ySums);
        const equation = [];

        for (let deg = 0; deg <= degree * 2; deg++) {
            const compX = deg !== 0 ?
                this._y.reduce((total, _, x) => total + Math.pow(x, deg), 0)
                : this._y.length;

            eqComps.push(compX);

            if (deg <= degree && deg !== 0) {
                const compRes = this._y.reduce(
                    (total, val, x) => total + Math.pow(x, deg) * val, 0
                );

                resultComps.push(compRes);
            }
        }

        for (let i = 0; i <= degree; i++) {
            const eqLine = [];

            for (let j = i; j < degree + i + 1; j++) {
                eqLine.push(eqComps[j]);
            }

            equation.push(eqLine);
        }

        const m: Matrix = new Matrix(equation);

        const solved: number[] = m.solve(resultComps);

        const coeffs = solved.reduce<Record<string, number>>((acc, val, i) => {
            acc[`a${i}`] = val;
            return acc;
        }, {});

        this._polyCache.set(degree, coeffs);

        return coeffs;
    }

    /**
     * Calculates the logarithmic trend model using transformed OLS: z = ln(x + 1).
     * Model equation: ŷ = a * ln(x + 1) + b
     * 
     * @returns An object containing slope coefficient (`a`) and constant term (`b`).
     * @throws {Error} If there is zero variance in x values or N < 2.
     */
    public logarithmic() {
        if(this._logA !== null && this._logB !== null) {
            return {
                a:this._logA,
                b:this._logB,
            }
        }

        let zAvg = this._y.reduce((total, _, x)=> total + Math.log(x + 1), 0)/this.N;
        let yMean = this._ySum/this.N;

        const ziyi = this._y.reduce((total, y, x)=> total + y * Math.log(x + 1), 0);
        const zSum = this._y.reduce((total, _, x)=> total + Math.log(x + 1), 0);
        const zSquaresSum = this._y.reduce((total, _, x)=> total + Math.log(x + 1) ** 2, 0);

        const numerator = this.N * ziyi - zSum * this._ySum;
        const denominator = this.N * zSquaresSum - zSum ** 2;

        if(denominator === 0) {
            throw new Error('Cannot fit logarithmic trend: Zero variance in x values (all x values are identical or N < 2).');
        }

        const a = numerator / denominator;
        const b = yMean - a * zAvg;

        this._logA = a;
        this._logB = b;

        return {a, b};
    }

    private getYHatLinear(a: number, b: number, x: number,) {
        return a * x + b;
    }

    private getYHatExponential(a: number, b: number, x: number) {
        return a * Math.pow(b, x);
    }

    private getYHatPolynomial(variables: number[], x: number) {
        return variables.reduce((total, val, exp) => total + val * Math.pow(x, exp), 0);
    }

    private getYHatLogarithmic(a: number, b: number, x: number) {
        return a * Math.log(x + 1) + b;
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted linear trend model.
     * 
     * @returns The average of squared residuals for the linear model.
     */
    public MSELinear() {
        const funcObj = this.linear();

        return this._y.reduce((total, val, i) => {
            let yHat = this.getYHatLinear(funcObj.a, funcObj.b, i);

            return total + Math.pow(val - yHat, 2);
        }, 0) / this._n;
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted exponential trend model.
     * 
     * @returns The average of squared residuals for the exponential model.
     */
    public MSEExponential() {
        const funcObj = this.exponential();

        return this._y.reduce((total, val, i) => {
            let yHat = this.getYHatExponential(funcObj.a, funcObj.b, i);

            return total + Math.pow(val - yHat, 2);
        }, 0) / this._n;
    }

    /**
     * Calculates the Mean Squared Error (MSE) for the fitted polynomial trend model of a given degree.
     * 
     * @param degree The polynomial degree (integer between 2 and 5).
     * @returns The average of squared residuals for the polynomial model.
     */
    public MSEPolynomial(degree: number) {
        const coeffsObj = this.polynomial(degree);
        const coeffs = Object.values(coeffsObj);

        return this._y.reduce((total, val, i) => {
            let yHat = this.getYHatPolynomial(coeffs, i);
            return total + Math.pow(val - yHat, 2);
        }, 0) / this._n;
    }
    
    /**
     * Calculates the Mean Squared Error (MSE) for the fitted logarithmic trend model.
     * 
     * @returns The average of squared residuals for the logarithmic model.
     */
    public MSELogarithmic() {
        const funcObj = this.logarithmic();

        return this._y.reduce((total, val, i) => {
            const yHat = this.getYHatLogarithmic(funcObj.a, funcObj.b, i);
            return total + Math.pow(val - yHat, 2);
        }, 0) / this._n;
    }

    /**
     * Unified method to compute the Mean Squared Error (MSE) for any supported trend type.
     * 
     * @param trendType The target trend model ('LINEAR' | 'EXPONENTIAL' | 'POLYNOMIAL' | 'LOGARITHMIC').
     * @param degree Required only when trendType is 'POLYNOMIAL'. Integer between 2 and 5.
     * @returns The Mean Squared Error of the specified trend model.
     * @throws {Error} If trendType is 'POLYNOMIAL' but degree is not provided, or if trendType is unknown.
     */
    public MSE(trendType:TrendType, degree?:number) {
        if(trendType === 'POLYNOMIAL' && !degree) {
            throw new Error('Degree is required for polynomial trend calculation.');
        }

        switch(trendType) {
            case 'LINEAR':
                return this.MSELinear();
            case 'EXPONENTIAL':
                return this.MSEExponential();
            case 'POLYNOMIAL':
                return this.MSEPolynomial(degree!);
            case 'LOGARITHMIC':
                return this.MSELogarithmic();
        }

        throw new Error('Unknown trend type!');
    }
}