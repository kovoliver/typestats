import { getColumn } from "../statistics/bivariate";
import { mean, median, mode, std } from "../statistics/univariate";
import { Boundaries, ImputeType, ScaleType } from "../types/types";
import {
    defaultValue, getMax, getMin,
    getNonEmptyValues, isEmpty, isNumeric,
    isOutlier, normalize, replaceOutlier,
    standardize, toNumberArray
}
    from "../utils/utils";

function getSubstitute(
    values: number[],
    type: ImputeType,
    boundaries?: Boundaries
) {
    if (values.length === 0) {
        throw new Error('Cannot calculate substitution value for empty or all-missing data!');
    }

    if (boundaries && (boundaries.min !== undefined || boundaries.max !== undefined)) {
        values = values.filter(val => !isOutlier(val, boundaries.min, boundaries.max));
    }

    if (values.length === 0) {
        throw new Error('The given boundaries cleared all the values from the array!');
    }

    switch (type) {
        case 'MEAN':
            return mean(values);
        case 'MEDIAN':
            return median(values);
        case 'MODE':
            const modes = mode(values);

            if (modes.length === 0) {
                throw new Error('Mode cannot be calculated based on the values provided.');
            }

            return modes[0];
        default:
            throw new Error("The specified imputation type isn't implemented!");
    }
}

export function isInvalidValue(val: any, boundaries?: Boundaries): boolean {
    const numVal = isNumeric(val) ? parseFloat(String(val)) : NaN;

    if (isEmpty(numVal)) return true;

    if (boundaries && (boundaries.min !== undefined || boundaries.max !== undefined)) {
        return isOutlier(numVal, boundaries.min, boundaries.max);
    }

    return false;
}

function getLabels(values: string[]): Record<string, number> {
    const keys = Array.from(new Set(values));
    return Object.fromEntries(keys.map((key, index) => [key, index]));
}

/**
 * Encodes an array of categorical string values into a 2D one-hot encoded matrix.
 *
 * @param {string[]} values - The array of string values to encode.
 * @returns {{ matrix: number[][], categories: string[] }} An object containing:
 *  - `matrix`: A 2D array where each row represents a one-hot encoded vector of the corresponding input value.
 *  - `categories`: An array of unique string categories matching the column indices of the matrix.
 * @throws {Error} Throws an error if the input array is empty or contains non-string elements.
 */
export function oneHotEncode(values: string[]) {
    if (values.length === 0) {
        throw new Error('You must provide at least one value!');
    }

    if (values.some(val => typeof val !== 'string')) {
        throw new Error('One-hot encoding only works with string values!');
    }

    const categories = Array.from(new Set(values));
    const length = categories.length;

    const matrix = values.map(val => {
        const row = new Array(length).fill(0);
        const index = categories.indexOf(val);
        row[index] = 1;
        return row;
    });

    return {
        matrix,
        categories
    };
}

/**
 * Decodes a 2D one-hot encoded matrix back into its original array of string values.
 *
 * @param {number[][]} matrix - The 2D matrix containing one-hot encoded vectors.
 * @param {string[]} categories - The ordered array of unique category labels corresponding to matrix columns.
 * @returns {string[]} An array of reconstructed categorical string values.
 */
export function decodeOneHot(matrix: number[][], categories: string[]): string[] {
    return matrix.map(row => {
        const oneIndex = row.indexOf(1);
        return categories[oneIndex];
    });
}

/**
 * Replaces empty values (and optionally outliers) in a 1D array or a specific column of a 2D matrix 
 * with a statistical imputation value (e.g., MEAN, MEDIAN, MODE).
 *
 * @param {any[] | any[][]} values - A 1D array or a 2D matrix.
 * @param {ImputeType} type - The imputation strategy used to compute substitution values ('MEAN', 'MEDIAN', 'MODE').
 * @param {Boundaries} [boundaries] - Optional lower (`min`) and upper (`max`) threshold boundaries for outlier replacement.
 * @param {number} [colIndex] - The target column index when processing a 2D matrix. Required for 2D arrays.
 * @returns {any[] | any[][]} A new 1D array or 2D matrix with substituted values.
 * @throws {Error} Throws if the array is empty, non-2D structures are passed, or `colIndex` is missing for a 2D matrix.
 */
export function replaceValues(
    values: any[] | any[][],
    type: ImputeType,
    boundaries?: Boundaries,
    colIndex?: number
) {
    if (values.length === 0) {
        throw new Error('You must add at least one value!');
    }

    if (Array.isArray(values[0]) && colIndex === undefined) {
        throw new Error('You must provide column index when the given values are in a 2d array!');
    }

    if (Array.isArray(values[0])) {
        if (!values.every(arr => Array.isArray(arr))) {
            throw new Error('You must provide a strictly two-dimensional array!');
        }

        if (values[0].length === 0) {
            throw new Error('You must add at least one value!');
        }

        const newValues = values.map(row => [...row]);

        const column = toNumberArray(getNonEmptyValues(getColumn(values, colIndex!)));
        const substitute = getSubstitute(column, type, boundaries);

        for (let row = 0; row < values.length; row++) {
            const currentVal = isNumeric(values[row][colIndex!])
                ? parseFloat(values[row][colIndex!].toString()) : NaN;

            newValues[row][colIndex!] = boundaries
                ? replaceOutlier(
                    currentVal, substitute, boundaries.min, boundaries.max
                )
                : defaultValue(currentVal, substitute);
        }

        return newValues;
    }

    const numericValues = toNumberArray(values);
    const substitute = getSubstitute(getNonEmptyValues(numericValues), type, boundaries);

    return numericValues.map((val) => boundaries ?
        replaceOutlier(val, substitute, boundaries.min, boundaries.max)
        : defaultValue<number>(val, substitute));
}

/**
 * Replaces empty (`NaN`, `null`, `undefined`, `""`) values or numeric strings in a 1D array or 
 * a specific column of a 2D matrix using a statistical imputation method.
 *
 * @param {any[] | any[][]} values - A 1D array or 2D matrix containing numeric values or numeric strings.
 * @param {ImputeType} type - The imputation strategy ('MEAN', 'MEDIAN', 'MODE').
 * @param {number} [colIndex] - The target column index when processing a 2D matrix. Required for 2D arrays.
 * @returns {any[] | any[][]} A new 1D array or 2D matrix with missing values imputed.
 */
export function replaceEmptyValues(
    values: any[],
    type: ImputeType
): any[];

export function replaceEmptyValues(
    values: any[][],
    type: ImputeType,
    colIndex: number
): any[][];

export function replaceEmptyValues(
    values: any[] | any[][],
    type: ImputeType,
    colIndex?: number
): any[] | any[][] {
    return replaceValues(values, type, undefined, colIndex);
}

/**
 * Replaces values falling outside specified minimum/maximum boundaries (and any empty values) 
 * in a 1D array or a specific column of a 2D matrix using a statistical imputation method.
 *
 * @param {any[] | any[][]} values - A 1D array or 2D matrix containing numeric values or numeric strings.
 * @param {ImputeType} type - The imputation strategy ('MEAN', 'MEDIAN', 'MODE').
 * @param {Boundaries} boundaries - The lower (`min`) and/or upper (`max`) threshold boundaries to detect outliers.
 * @param {number} [colIndex] - The target column index when processing a 2D matrix. Required for 2D arrays.
 * @returns {any[] | any[][]} A new 1D array or 2D matrix with outliers imputed.
 * @throws {Error} Throws if `boundaries` is missing or contains neither a `min` nor a `max` value.
 */
export function replaceOutliers(
    values: any[],
    type: ImputeType,
    boundaries: Boundaries
): any[];

export function replaceOutliers(
    values: any[][],
    type: ImputeType,
    boundaries: Boundaries,
    colIndex: number
): any[][];

export function replaceOutliers(
    values: any[] | any[][],
    type: ImputeType,
    boundaries: Boundaries,
    colIndex?: number
): any[] | any[][] {
    if (!boundaries || (boundaries.min === undefined && boundaries.max === undefined)) {
        throw new Error('You must provide at least a minimum or a maximum boundary to replace outliers!');
    }

    return replaceValues(values, type, boundaries, colIndex);
}

/**
 * Removes elements from a 1D array if the target value is empty (NaN/null/undefined/empty string), 
 * non-numeric, or falls outside the specified boundaries. Returns a clean numeric array.
 *
 * @param {any[]} values - A 1D array containing numbers, numeric strings, or empty values.
 * @param {Boundaries} [boundaries] - Optional min/max boundary thresholds.
 * @returns {number[]} A new 1D array with invalid elements removed and values converted to numbers.
 */
export function removeInvalidRows(
    values: any[],
    boundaries?: Boundaries,
    colIndex?: number
): any[] | any[][]

/**
 * Removes entire rows from a 2D matrix if the value in the specified column is empty, 
 * non-numeric, or falls outside the specified boundaries.
 *
 * @param {any[][]} values - A 2D matrix containing numbers, numeric strings, or empty values.
 * @param {Boundaries} [boundaries] - Optional min/max boundary thresholds.
 * @param {number} colIndex - The column index to inspect for errors/outliers.
 * @returns {any[][]} A new 2D matrix with bad rows removed.
 */
export function removeInvalidRows(
    values: any[] | any[][],
    boundaries?: Boundaries,
    colIndex?: number
): any[] | any[][] {
    if (!values || values.length === 0) {
        throw new Error('You must add at least one value!');
    }

    if (Array.isArray(values[0])) {
        if (colIndex === undefined) {
            throw new Error('You must provide column index when the given values are in a 2d array!');
        }

        if (!values.every(arr => Array.isArray(arr))) {
            throw new Error('You must provide a strictly two-dimensional array!');
        }

        const matrix = values as any[][];
        const cleanedMatrix: any[][] = [];

        for (let i = 0; i < matrix.length; i++) {
            const row = matrix[i];
            if (!isInvalidValue(row[colIndex], boundaries)) {
                cleanedMatrix.push(row);
            }
        }

        return cleanedMatrix;
    }

    const numericArray = toNumberArray(values);
    const cleanedValues: (number | null)[] = [];

    for (let i = 0; i < numericArray.length; i++) {
        const val = numericArray[i];
        if (!isInvalidValue(val, boundaries)) {
            cleanedValues.push(val);
        }
    }

    return cleanedValues;
}

/**
 * Scales a dataset (1D array or a specific column of a 2D matrix) using either Normalization or Standardization.
 *
 * @param values - A 1D array or a 2D matrix to scale.
 * @param type - The scaling method to apply: `'NORMALIZE'` or `'STANDARDIZE'`.
 * @param colIndex - The 0-based column index to scale. Required when `values` is a 2D array.
 * @param isSample - Whether the provided data is a sample or not.
 * @returns A new 1D array or 2D matrix with the updated scaled values.
 * @throws {Error} If `values` is empty.
 * @throws {Error} If `values` is a 2D array but `colIndex` is omitted.
 * @throws {Error} If `values` contains invalid, non-numeric, or `NaN` elements.
 */
export function scaleValues(
    values: number[] | any[][],
    type: ScaleType,
    colIndex?: number,
    isSample:boolean = true
): number[] | any[][] {
    if (values.length === 0) {
        throw new Error('You must add at least one value!');
    }

    const is2D = Array.isArray(values[0]);

    if (is2D && colIndex === undefined) {
        throw new Error('You must provide column index when the given values are in a 2d array!');
    }

    let rawColumn: unknown[];

    if (is2D) {
        if (!values.every(arr => Array.isArray(arr))) {
            throw new Error('You must provide a strictly two-dimensional array!');
        }
        rawColumn = getColumn(values as number[][], colIndex!);
    } else {
        rawColumn = values as number[];
    }

    const column = toNumberArray(rawColumn);

    if (column.some(val => Number.isNaN(val))) {
        throw new Error(
            'The given dataset has invalid values. You can use, e.g., the replaceEmptyValues function.'
        );
    }

    const param1 = type === 'NORMALIZE' ? getMin(column) : mean(column);
    const param2 = type === 'NORMALIZE' ? getMax(column) : std(column, isSample);

    const scaleFn = type === 'NORMALIZE' ? normalize : standardize;
    const scaledColumn = column.map(val => scaleFn(val, param1, param2));

    if (is2D) {
        const matrix = values as number[][];
        return matrix.map((row, rIdx) => {
            const newRow = [...row];
            newRow[colIndex!] = scaledColumn[rIdx];
            return newRow;
        });
    }

    return scaledColumn;
}

/**
 * Normalizes a 1D array of numbers or a specific column of a 2D matrix using Min-Max scaling.
 *
 * @param values - A 1D array of numbers or a 2D matrix of numbers.
 * @param colIndex - The target column index to normalize (required for 2D arrays).
 * @param isSample - Whether the provided data is a sample or not.
 * @returns A new 1D array or 2D matrix containing the normalized values.
 */
export function normalizeValues(
    values: number[] | any[][], 
    colIndex?: number
) {
    return scaleValues(values, 'NORMALIZE', colIndex);
}

/**
 * Standardizes a 1D array of numbers or a specific column of a 2D matrix using Z-score standardization.
 *
 * @param values - A 1D array or a 2D matrix.
 * @param colIndex - The target column index to standardize (required for 2D arrays).
 * @param isSample - Whether the provided data is a sample or not.
 * @returns A new 1D array or 2D matrix containing the standardized values.
 */
export function standardizeValues(
    values: number[] | any[][], 
    colIndex?: number,
    isSample:boolean = true
) {
    return scaleValues(values, 'STANDARDIZE', colIndex, isSample);
}

/**
 * Converts categorical string values into numerical labels (0 to N-1).
 * Supports both 1D string arrays and targeted columns in 2D matrices.
 *
 * @param values - A 1D array of string values or a 2D matrix containing string values in the target column.
 * @param colIndex - The 0-based column index to encode. Required when `values` is a 2D array.
 * @returns A new 1D array of encoded numbers or a new 2D matrix with the specified column replaced by numerical labels.
 * @throws {Error} If `values` is empty.
 * @throws {Error} If `values` is a 2D matrix but `colIndex` is omitted.
 * @throws {Error} If `values` is not a strictly two-dimensional matrix when passed as a 2D array.
 * @throws {Error} If any target element in the specified column or array is not a string.
 */
export function labelEncoding(
    values: string[] | any[][], colIndex?: number
): number[] | any[][] {
    if (values.length === 0) {
        throw new Error('You must add at least one value!');
    }

    const is2D = Array.isArray(values[0]);

    if (is2D && colIndex === undefined) {
        throw new Error(
            'You must provide column index when \
            the given values are in a 2d array!'
        );
    }

    if (is2D && !values.every(arr => Array.isArray(arr))) {
        throw new Error('You must provide a strictly two-dimensional array!');
    }

    const column: unknown[] = is2D ?
        getColumn((values as any[][]), colIndex!) : values;

    if (!(column as any[]).every(val => typeof val === 'string')) {
        throw new Error(
            'Label encoding is only possible \
            with strictly string values!'
        );
    }

    const labels = getLabels((column as string[])) as Record<string, number>;

    if (!is2D) {
        return (column as string[]).map((val: string) => labels[val]);
    }

    const matrix = values as any[][];

    return matrix.map((row, rIdx) => {
        const newRow = [...row];
        newRow[colIndex!] = labels[column[rIdx] as string];
        return newRow;
    });
}