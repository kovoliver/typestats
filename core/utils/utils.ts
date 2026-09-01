/**
 * Checks if a given value is considered empty (`null`, `undefined`, empty string, or `NaN`).
 *
 * @template T
 * @param {T} value - The value to evaluate.
 * @returns {boolean} `true` if the value is empty or `NaN`, `false` otherwise.
 */
export function isEmpty<T>(value: T): boolean {
    if (typeof value === 'number') {
        return !Number.isFinite(value);
    }

    return value === null || value === "" || value === undefined;
}

/**
 * Checks whether an array contains any empty or invalid values (`null`, `undefined`, `NaN`, or empty strings).
 *
 * @template T - The type of elements in the array.
 * @param {T[]} values - The array to evaluate for empty values.
 * @returns {boolean} `true` if at least one element is empty or invalid, `false` otherwise (or if the array is empty/falsy).
 */
export function hasEmptyValues<T>(values: T[]): boolean {
    if (!values || values.length === 0) return false;
    return values.some(val => isEmpty(val));
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
export function getNonEmptyValues(values: any[] | any[][]): any[] {
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
): number {
    if (isOutlier(value, min, max)) {
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
    value: number,
    min?: number,
    max?: number
): boolean {
    if (min === undefined && max === undefined) {
        throw new Error(
            'You must provide at least the minimum or the maximum value!'
        );
    }

    if (!Number.isFinite(value)) {
        return false;
    }

    if (min !== undefined && value < min) {
        return true;
    }

    if (max !== undefined && value > max) {
        return true;
    }

    return false;
}

/**
 * Determines whether a given value is a finite numeric value or a valid numeric string.
 *
 * @param {any} value - The value to check.
 * @returns {boolean} `true` if the value represents a finite number, `false` otherwise.
 */
export function isNumeric(value: any): boolean {
    if (typeof value === 'number') {
        return Number.isFinite(value);
    }

    if (typeof value !== 'string') {
        return false;
    }

    const trimmed = value.trim();

    if (trimmed === '') {
        return false;
    }

    const num = Number(trimmed);
    return Number.isFinite(num);
}

/**
 * Determines whether a value is boolean or a boolean-like (boolish) value.
 * @param {any} value The provided value.
 */
export function isBool(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return true;
    if (value === 1 || value === 0) return true;

    if (typeof value === 'string' || typeof value === 'number') {
        const str = value.toString().trim().toLowerCase();

        const boolishStrings = [
            'true', 'false',
            '1', '0',
            'yes', 'no',
            'y', 'n',
            'i', 'n',
            'on', 'off',
            'enabled', 'disabled',
            'active', 'inactive'
        ];

        return boolishStrings.includes(str);
    }

    return false;
}

/**
 * Determines whether all non-nullish values in an array are strictly 0 or 1 (as numbers or strings).
 * @param {Array<number | string>} values The array of values to check.
 */
export function only01(values: (number | string | null | undefined)[]): boolean {
    if (!values || values.length === 0) return false;

    const validValues = values.filter(
        (val): val is number | string => val !== null && val !== undefined && val !== ''
    );

    if (validValues.length === 0) return false;

    return validValues.every(val => {
        const str = val.toString().trim();
        return str === '0' || str === '1';
    });
}

/**
 * Converts an array of unknown values into an array of numbers (or NaN for non-finite values).
 *
 * @param {unknown[]} values - The array of raw values to convert.
 * @param {boolean} [toInteger=false] - Whether to truncate numbers to integers.
 * @returns {number[]} A new array containing finite numbers or `NaN` for invalid/non-finite inputs.
 */
export function toNumberArray(
    values: unknown[],
    toInteger: boolean = false
): number[] {
    return values.map(val => {
        let num: number;

        if (typeof val === 'number') {
            num = val;
        } else if (typeof val === 'string' && val.trim() !== '') {
            num = Number(val);
        } else {
            return NaN;
        }

        if (!Number.isFinite(num)) {
            return NaN;
        }

        return toInteger ? Math.trunc(num) : num;
    });
}

export function toBoolArray(values: unknown[]): (boolean | null)[] {
    return values.map((val, index) => {
        if (val === null || val === undefined) {
            return null;
        }

        if (typeof val === 'boolean') {
            return val;
        }

        if (typeof val === 'number') {
            if (val === 1) return true;
            if (val === 0) return false;
            throw new Error(`Invalid number at index ${index}: ${val}. Only 1 and 0 are allowed.`);
        }

        if (typeof val === 'string') {
            const normalized = val.trim().toLowerCase();

            if (normalized === '' || normalized === 'null' || normalized === 'undefined') {
                return null;
            }

            if (normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'no') {
                return false;
            }

            if (normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes') {
                return true;
            }

            throw new Error(`Cannot parse boolean from string at index ${index}: "${val}"`);
        }

        throw new Error(`Unsupported type at index ${index}: ${typeof val}`);
    });
}

export function toStringArray(values: unknown[]): (string | null)[] {
    return values.map((val, index) => {
        if (val === null || val === undefined) {
            return null;
        }

        if (typeof val === 'string') {
            const normalized = val.trim().toLowerCase();
            if (normalized === 'null' || normalized === 'undefined') {
                return null;
            }
            return val;
        }

        if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') {
            return String(val);
        }

        throw new Error(`Cannot convert value at index ${index} to string. Unsupported type: ${typeof val}`);
    });
}

/**
 * Normalizes a single numeric value to a [0, 1] range using Min-Max scaling.
 *
 * @param value - The numeric value to normalize.
 * @param min - The minimum value of the dataset.
 * @param max - The maximum value of the dataset.
 * @returns The normalized value as a number.
 * @throws {Error} If `min` and `max` are equal, as division by zero cannot be performed.
 */
export function normalize(value: number, min: number, max: number) {
    if (max === min) {
        throw new Error(
            'Normalization cannot be performed because the minimum and maximum values are equal!'
        );
    }

    return (value - min) / (max - min);
}

/**
 * Standardizes a single numeric value (Z-score normalization) based on the mean and standard deviation.
 *
 * @param value - The numeric value to standardize.
 * @param avg - The arithmetic mean (average) of the dataset.
 * @param sigma - The standard deviation of the dataset.
 * @returns The standardized value (Z-score).
 * @throws {Error} If `sigma` is zero, as division by zero cannot be performed.
 */
export function standardize(value: number, avg: number, sigma: number) {
    if (sigma === 0) {
        throw new Error(
            'Standardization cannot be performed because the standard deviation is zero!'
        );
    }

    return (value - avg) / sigma;
}

/**
 * Finds the minimum number in an array.
 * Highly optimized for performance and safe for large datasets.
 *
 * @param {number[]} values - The array of numbers to evaluate.
 * @returns {number} The smallest number in the array.
 * @throws {Error} Throws an error if the input array is empty.
 */
export function getMin(values: number[]): number {
    if (values.length === 0) {
        throw new Error('Cannot get minimum of an empty array!');
    }

    let min = values[0];
    for (let i = 1; i < values.length; i++) {
        if (values[i] < min) {
            min = values[i];
        }
    }

    return min;
}

/**
 * Finds the maximum number in an array.
 * Highly optimized for performance and safe for large datasets.
 *
 * @param {number[]} values - The array of numbers to evaluate.
 * @returns {number} The largest number in the array.
 * @throws {Error} Throws an error if the input array is empty.
 */
export function getMax(values: number[]): number {
    if (values.length === 0) {
        throw new Error('Cannot get maximum of an empty array!');
    }

    let max = values[0];
    for (let i = 1; i < values.length; i++) {
        if (values[i] > max) {
            max = values[i];
        }
    }

    return max;
}