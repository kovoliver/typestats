import { getColumn } from "../statistics/bivariate";
import { mean, median, mode } from "../statistics/univariate";
import { Boundaries, ImputeType } from "../types";
import { defaultValue, getNonEmptyValues, isOutlier, replaceOutlier } from "../utils/utils";

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

/**
 * Replaces empty values (and optionally outliers) in a 1D array or a specific column of a 2D matrix 
 * with a statistical imputation value (e.g., MEAN, MEDIAN, MODE).
 *
 * @param {number[] | number[][]} values - A 1D numeric array or a 2D matrix.
 * @param {ImputeType} type - The imputation strategy used to compute substitution values ('MEAN', 'MEDIAN', 'MODE').
 * @param {Boundaries} [boundaries] - Optional lower (`min`) and upper (`max`) threshold boundaries for outlier replacement.
 * @param {number} [colIndex] - The target column index when processing a 2D matrix. Required for 2D arrays.
 * @returns {number[] | number[][]} A new 1D array or 2D matrix with substituted values.
 * @throws {Error} Throws if the array is empty, non-2D structures are passed, or `colIndex` is missing for a 2D matrix.
 */
export function replaceValues(
    values: number[] | number[][],
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

        let column = getNonEmptyValues(getColumn(values, colIndex!));
        const substitute = getSubstitute(column, type, boundaries);

        for (let row = 0; row < values.length; row++) {
            const currentVal = values[row][colIndex!];

            newValues[row][colIndex!] = boundaries
                ? defaultValue(replaceOutlier(
                    currentVal, substitute, boundaries.min, boundaries.max
                ), substitute
                )
                : defaultValue(currentVal, substitute);
        }

        return newValues;
    }

    const substitute = getSubstitute(getNonEmptyValues(values), type, boundaries);
    return (values as number[]).map((val) => boundaries ?
        defaultValue(replaceOutlier(val, substitute, boundaries.min, boundaries.max), substitute)
        : defaultValue<number>(val, substitute));
}

/**
 * Replaces empty (`NaN`, `null`, `undefined`) values in a 1D array or a specific column of a 2D matrix 
 * using a statistical imputation method, leaving existing non-empty numbers untouched.
 *
 * @param {number[] | number[][]} values - A 1D numeric array or a 2D matrix.
 * @param {ImputeType} type - The imputation strategy ('MEAN', 'MEDIAN', 'MODE').
 * @param {number} [colIndex] - The target column index when processing a 2D matrix. Required for 2D arrays.
 * @returns {number[] | number[][]} A new 1D array or 2D matrix with missing values imputed.
 */
export function replaceEmptyValues(
    values: number[],
    type: ImputeType
): number[];

export function replaceEmptyValues(
    values: number[][],
    type: ImputeType,
    colIndex: number
): number[][];

export function replaceEmptyValues(
    values: number[] | number[][],
    type: ImputeType,
    colIndex?: number
): number[] | number[][] {
    return replaceValues(values, type, undefined, colIndex);
}

/**
 * Replaces values falling outside specified minimum/maximum boundaries (and any empty values) 
 * in a 1D array or a specific column of a 2D matrix using a statistical imputation method.
 *
 * @param {number[] | number[][]} values - A 1D numeric array or a 2D matrix.
 * @param {ImputeType} type - The imputation strategy ('MEAN', 'MEDIAN', 'MODE').
 * @param {Boundaries} boundaries - The lower (`min`) and/or upper (`max`) threshold boundaries to detect outliers.
 * @param {number} [colIndex] - The target column index when processing a 2D matrix. Required for 2D arrays.
 * @returns {number[] | number[][]} A new 1D array or 2D matrix with outliers imputed.
 * @throws {Error} Throws if `boundaries` is missing or contains neither a `min` nor a `max` value.
 */
export function replaceOutliers(
    values: number[],
    type: ImputeType,
    boundaries: Boundaries
): number[];

export function replaceOutliers(
    values: number[][],
    type: ImputeType,
    boundaries: Boundaries,
    colIndex: number
): number[][];

export function replaceOutliers(
    values: number[] | number[][],
    type: ImputeType,
    boundaries: Boundaries,
    colIndex?: number
): number[] | number[][] {
    if (!boundaries || (boundaries.min === undefined && boundaries.max === undefined)) {
        throw new Error('You must provide at least a minimum or a maximum boundary to replace outliers!');
    }

    return replaceValues(values, type, boundaries, colIndex);
}