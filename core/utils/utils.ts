/**
 * Checks if a given value is considered empty (`null`, `undefined`, empty string, or `NaN`).
 *
 * @template T
 * @param {T} value - The value to evaluate.
 * @returns {boolean} `true` if the value is empty or `NaN`, `false` otherwise.
 */
export function isEmpty<T>(value: T): boolean {
    if (typeof value === 'number') {
        return isNaN(value);
    }

    return value === null || value === "" || value === undefined;
}

/**
 * Returns the provided value if it is not empty; otherwise, returns a default fallback value.
 *
 * @template T
 * @param {T} value - The input value to check.
 * @param {T} defaultVal - The fallback value to use if the input value is empty.
 * @returns {T} The original value or the default fallback value.
 */
export function defaultValue<T>(value: T, defaultVal: T): T {
    return !isEmpty(value) ? value : defaultVal;
}

/**
 * Flattens a 1D or 2D array of numbers and filters out all empty or `NaN` values.
 *
 * @param {number[] | number[][]} values - A 1D or 2D array of numeric values.
 * @returns {number[]} A flat array containing only non-empty, valid numbers.
 */
export function getNonEmptyValues(values: number[] | number[][]):number[] {
    return values.flat().filter((val) => !isEmpty(val));
}

/**
 * Replaces a numeric value with a specified replacement value if it falls outside the given boundaries.
 *
 * @param {number} value - The numeric value to check.
 * @param {number} replacement - The replacement value to use if an outlier is detected.
 * @param {number} [min] - The inclusive lower bound threshold.
 * @param {number} [max] - The inclusive upper bound threshold.
 * @returns {number} The replacement value if the input is an outlier; otherwise, the original value.
 */
export function replaceOutlier(
    value: number,
    replacement: number,
    min?: number,
    max?: number
):number {
    if(isOutlier(value, min, max)) {
        return replacement;
    }

    return value;
}

/**
 * Determines whether a numeric value is an outlier based on minimum and maximum threshold boundaries.
 *
 * @param {number} value - The numeric value to evaluate.
 * @param {number} [min] - The lower bound threshold.
 * @param {number} [max] - The upper bound threshold.
 * @returns {boolean} `true` if the value is strictly less than `min` or greater than `max`, `false` otherwise.
 * @throws {Error} Throws an error if neither `min` nor `max` is provided.
 */
export function isOutlier(
    value:number, 
    min?:number, 
    max?:number
):boolean {
    if (min === undefined && max === undefined) {
        throw new Error(
            'You must provide at least the minimum or the maximum value!'
        );
    }

    if (min !== undefined && value < min) {
        return true;
    }

    if (max !== undefined && value > max) {
        return true;
    }

    return false;
}