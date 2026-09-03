export function round(value: number, decimals = -1): number {
    if (decimals === -1) return value;

    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

export function orderAsc(values: number[]): number[] {
    return values.sort((a, b) => a - b);
}

export function orderDesc(values: number[]): number[] {
    return values.sort((a, b) => b - a);
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