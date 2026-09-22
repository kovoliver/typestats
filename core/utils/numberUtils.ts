export function round(value: number, decimals?: number): number {
    if (decimals === undefined) return value;

    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

export function orderAsc(values: number[]): number[] {
    const len = values.length;
    if (len <= 1) return values.slice();

    if (len >= 10000) {
        const typed = new Float64Array(values);
        typed.sort();

        const sortedArray = new Array<number>(len);

        for (let i = 0; i < len; i++) {
            sortedArray[i] = typed[i];
        }

        return sortedArray;
    }

    return values.slice().sort((a, b) => a - b);
}

export function orderDesc(values: number[]): number[] {
    const len = values.length;
    if (len <= 1) return values.slice();

    if (len >= 10000) {
        const typed = new Float64Array(values);
        typed.sort();

        const sortedArray = new Array<number>(len);
        for (let i = 0; i < len; i++) {
            sortedArray[i] = typed[len - 1 - i];
        }

        return sortedArray;
    }

    return values.slice().sort((a, b) => b - a);
}

export function isInteger(value: number): boolean {
    return round(value, 0) === value;
}

export function rangeSequence(from: number, to: number) {
    return Array.from(
        { length: to - from + 1 },
        (_, i) => from + i
    );
}

/**
 * Clamps a number between a specified minimum and maximum value and rounds it to a given number of decimal places to eliminate floating-point calculation errors.
 * 
 * @param value - The numerical value to clamp.
 * @param min - The lower boundary.
 * @param max - The upper boundary.
 * @param digits - Number of decimal places to round the result to.
 * @returns The clamped and rounded value.
 * @throws {Error} If `digits` is not an integer or is less than 0.
 */
export function clamp(value: number, min: number, max: number, digits: number): number {
    if (!Number.isInteger(digits)) {
        throw new Error('The digits parameter must be a discrete value!');
    }

    if (digits < 0) {
        throw new Error('The digits parameter must be a non-negative integer!');
    }

    return parseFloat(Math.min(Math.max(value, min), max).toFixed(digits));
}

/**
 * Clamps a value between 0 and 1 and rounds it to a given number of decimal places (ideal for Eta-squared, Cramér's V, etc.).
 * 
 * @param value - The numerical value to clamp.
 * @param digits - Number of decimal places to round the result to.
 * @returns The clamped and rounded value between 0 and 1.
 * @throws {Error} If `digits` is invalid.
 */
export function clamp01(value: number, digits: number): number {
    return clamp(value, 0, 1, digits);
}

/**
 * Clamps a value between -1 and 1 and rounds it to a given number of decimal places (ideal for Pearson and Spearman correlations).
 * 
 * @param value - The numerical value to clamp.
 * @param digits - Number of decimal places to round the result to.
 * @returns The clamped and rounded value between -1 and 1.
 * @throws {Error} If `digits` is invalid.
 */
export function clampSymmetric(value: number, digits: number): number {
    return clamp(value, -1, 1, digits);
}

export function lre(computed: number, certified: number): number {
    if (certified === 0) {
        if (computed === 0) return Infinity;
        return -Math.log10(Math.abs(computed));
    }

    const relError = Math.abs(computed - certified) / Math.abs(certified);

    if (relError === 0) return Infinity;
    return Math.min(-Math.log10(relError), 15);
}

export function kahanSum(numbers: number[]): number {
    let sum = 0.0;
    let c = 0.0;

    for (let i = 0; i < numbers.length; i++) {
        const y = numbers[i] - c;
        const t = sum + y;
        c = (t - sum) - y;
        sum = t;
    }

    return sum;
}

export function kahanSumDotProduct(x: number[], y: number[]): number {
    let sum = 0.0;
    let c = 0.0;

    for (let i = 0; i < x.length; i++) {
        const product = x[i] * y[i];
        const yCorr = product - c;
        const t = sum + yCorr;
        c = (t - sum) - yCorr;
        sum = t;
    }

    return sum;
}

export function kahanSumPow(x: number[], pow: number): number {
    let sum = 0.0;
    let c = 0.0;

    for (let i = 0; i < x.length; i++) {
        const square = Math.pow(x[i], pow);
        const yCorr = square - c;
        const t = sum + yCorr;
        c = (t - sum) - yCorr;
        sum = t;
    }

    return sum;
}

export function neumaierSum(numbers: number[]): number {
    let sum = 0.0;
    let c = 0.0;

    for (let i = 0; i < numbers.length; i++) {
        const x = numbers[i];
        const t = sum + x;

        if (Math.abs(sum) >= Math.abs(x)) {
            c += (sum - t) + x;
        } else {
            c += (x - t) + sum;
        }

        sum = t;
    }

    return sum + c;
}

export function neumaierSumDotProduct(x: number[], y: number[]): number {
    let sum = 0.0;
    let c = 0.0;

    for (let i = 0; i < x.length; i++) {
        const product = x[i] * y[i];
        const t = sum + product;

        if (Math.abs(sum) >= Math.abs(product)) {
            c += (sum - t) + product;
        } else {
            c += (product - t) + sum;
        }

        sum = t;
    }

    return sum + c;
}

export function neumaierSumPow(x: number[], pow: number): number {
    let sum = 0.0;
    let c = 0.0;

    for (let i = 0; i < x.length; i++) {
        const value = Math.pow(x[i], pow);
        const t = sum + value;

        if (Math.abs(sum) >= Math.abs(value)) {
            c += (sum - t) + value;
        } else {
            c += (value - t) + sum;
        }

        sum = t;
    }

    return sum + c;
}


export function varianceAndCovariance(
    x: number[], y: number[], xMean: number, yMean: number): { xVar: number; cov: number } {
    const len = x.length;
    let varSum = 0;
    let varC = 0;
    let covSum = 0;
    let covC = 0;

    for (let i = 0; i < len; i++) {
        const xDiff = x[i] - xMean;
        const yDiff = y[i] - yMean;

        const vVal = xDiff * xDiff;
        const vT = varSum + vVal;

        if (Math.abs(varSum) >= Math.abs(vVal)) {
            varC += (varSum - vT) + vVal;
        } else {
            varC += (vVal - vT) + varSum;
        }

        varSum = vT;

        const cVal = xDiff * yDiff;
        const cT = covSum + cVal;

        if (Math.abs(covSum) >= Math.abs(cVal)) {
            covC += (covSum - cT) + cVal;
        } else {
            covC += (cVal - cT) + covSum;
        }

        covSum = cT;
    }

    varSum += varC;
    covSum += covC;

    const df = len - 1;

    return {
        xVar: varSum / df,
        cov: covSum / df
    };
}

export function neumaierDotProductAndSumPow2(x: number[], y: number[]): { xySum: number; x2Sum: number } {
    const len = x.length;
    let xySum = 0;
    let xyC = 0;
    let x2Sum = 0;
    let x2C = 0;

    for (let i = 0; i < len; i++) {
        const xi = x[i];
        const yi = y[i];

        const xyVal = xi * yi;
        const xyT = xySum + xyVal;

        if (Math.abs(xySum) >= Math.abs(xyVal)) {
            xyC += (xySum - xyT) + xyVal;
        } else {
            xyC += (xyVal - xyT) + xySum;
        }
        xySum = xyT;

        const x2Val = xi * xi;
        const x2T = x2Sum + x2Val;

        if (Math.abs(x2Sum) >= Math.abs(x2Val)) {
            x2C += (x2Sum - x2T) + x2Val;
        } else {
            x2C += (x2Val - x2T) + x2Sum;
        }
        x2Sum = x2T;
    }

    xySum += xyC;
    x2Sum += x2C;

    return { xySum, x2Sum };
}

/**
 * Calculates Mean Squared Error (MSE) on-the-fly using Neumaier summation.
 * 
 * @param yActual - Observed values array.
 * @param predict - Callback function returning predicted value (yHat) for index i.
 * @param degreesOfFreedom - Estimated parameter count (k). Defaults to 0.
 */
export function calculateMSE(
    yActual: ArrayLike<number>,
    predict: (i: number) => number,
    degreesOfFreedom: number = 0
): number {
    const n = yActual.length;

    if (n === 0) {
        return NaN;
    }

    const divisor = n - degreesOfFreedom;

    if (divisor <= 0) {
        throw new RangeError(
            `Degrees of freedom corrected divisor (${divisor}) must be positive.`
        );
    }

    let sum = 0;
    let c = 0;

    for (let i = 0; i < n; i++) {
        const yHat = predict(i);
        const diff = yActual[i] - yHat;
        const sqError = diff * diff;

        const t = sum + sqError;

        if (Math.abs(sum) >= Math.abs(sqError)) {
            c += (sum - t) + sqError;
        } else {
            c += (sqError - t) + sum;
        }

        sum = t;
    }

    return (sum + c) / divisor;
}