export function round(value: number, decimals?: number): number {
    if (decimals === undefined) return value;

    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

export function orderAsc(values: number[]): number[] {
    const len = values.length;
    if (len <= 1) return [...values];

    if (len >= 10000) {
        const typed = Float64Array.from(values);
        typed.sort();
        return Array.from(typed);
    }

    return [...values].sort((a, b) => a - b);
}

export function orderDesc(values: number[]): number[] {
    const len = values.length;
    if (len <= 1) return [...values];

    if (len >= 10000) {
        const typed = Float64Array.from(values);
        typed.sort();
        typed.reverse();
        return Array.from(typed);
    }

    return [...values].sort((a, b) => b - a);
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