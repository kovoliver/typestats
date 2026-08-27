import getColumns from "../statistics/bivariate";
import { mean, median, mode } from "../statistics/univariate";
import { ImputeType } from "../types";
import { defaultValue, getNonEmptyValues } from "../utils/utils";

function getSubstitute(values: number[], type: ImputeType) {
    if (values.length === 0) {
        throw new Error('Cannot calculate substitution value for empty or all-missing data!');
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

export function missingValue(values: number[] | number[][], type: ImputeType) {
    if (values.length === 0) {
        throw new Error('You must add at least one value!');
    }

    if (Array.isArray(values[0])) {
        const newValues: number[][] = [];

        if (!values.every(arr => Array.isArray(arr))) {
            throw new Error('You must provide a strictly two-dimensional array!');
        }

        if (values[0].length === 0) {
            throw new Error('You must add at least one value!');
        }

        const columns = getColumns(values);
        const substitutes = columns.map((c) => getSubstitute(getNonEmptyValues(c), type));

        for (let row = 0; row < values.length; row++) {
            if (values[row].length !== values[0].length) {
                throw new Error('Jagged arrays are not allowed!');
            }

            const hasArrays = values[row].some(val => Array.isArray(val));

            if (hasArrays) {
                throw new Error('At most two-dimensional arrays allowed!');
            }

            const newRow = (values[row] as number[]).map((val, col) => {
                return defaultValue<number>(val, substitutes[col])
            });

            newValues.push(newRow);
        }

        return newValues;
    }

    const substitute = getSubstitute(getNonEmptyValues(values), type);
    return (values as number[]).map((val) => defaultValue<number>(val, substitute));
}