import Column from "./Column.js";
import NumberColumn from "./NumberColumn.js";
import { toBoolArray } from "../utils/utils.js";

export default class BoolColumn extends Column<boolean> {
    public isValid(val: unknown): boolean {
        return typeof val === 'boolean';
    }

    /**
     * Converts raw unknown input data into an array of boolean or null values.
     *
     * @protected
     * @param {unknown[]} rawValues - The raw input values.
     * @returns {(boolean | null)[]} An array of processed boolean values or nulls for missing entries.
     */
    protected prepareData(rawValues: unknown[]): (boolean | null)[] {
        return toBoolArray(rawValues);
    }

    /**
     * Calculates and caches the count of `true` values in the column.
     *
     * @returns {number} The total number of `true` entries.
     */
    public countTrue(): number {
        return this.getCached('countTrue', () => {
            const values = this._values as (boolean | null)[];
            let count = 0;
            for (let i = 0; i < values.length; i++) {
                if (values[i] === true) {
                    count++;
                }
            }
            return count;
        });
    }

    /**
     * Calculates and caches the count of `false` values in the column.
     *
     * @returns {number} The total number of `false` entries.
     */
    public countFalse(): number {
        return this.getCached('countFalse', () => {
            const validCount = (this.getValidValues() as boolean[]).length;
            return validCount - this.countTrue();
        });
    }

    /**
     * Calculates and caches the ratio of `true` values relative to all valid entries (0.0 to 1.0).
     *
     * @returns {number} The proportion of `true` values.
     */
    public trueRatio(): number {
        return this.getCached('trueRatio', () => {
            const validCount = (this.getValidValues() as boolean[]).length;
            if (validCount === 0) return 0;
            return this.countTrue() / validCount;
        });
    }

    /**
     * Calculates and caches the ratio of `false` values relative to all valid entries (0.0 to 1.0).
     *
     * @returns {number} The proportion of `false` values.
     */
    public falseRatio(): number {
        return this.getCached('falseRatio', () => {
            const validCount = (this.getValidValues() as boolean[]).length;
            if (validCount === 0) return 0;
            return this.countFalse() / validCount;
        });
    }

    /**
     * Converts the boolean column into a new NumberColumn (true -> 1, false -> 0, null -> NaN).
     *
     * @returns {NumberColumn} A new NumberColumn instance with numeric binary values.
     */
    public toNumberColumn(): NumberColumn {
        const values = this._values as (boolean | null)[];
        const len = values.length;
        const numericValues = new Float64Array(len);

        for (let i = 0; i < len; i++) {
            const val = values[i];
            numericValues[i] = val === null ? NaN : (val ? 1 : 0);
        }

        return new NumberColumn(numericValues, `${this._label}_numeric`, true);
    }

    /**
     * Performs an element-wise logical NOT operation on the column, inverting boolean values.
     * Preserves null values. Clears cached calculations.
     */
    public invert(): BoolColumn {
        const values = this._values as (boolean | null)[];
        const len = values.length;
        const newValues: (boolean | null)[] = new Array(len);

        for (let i = 0; i < len; i++) {
            const val = values[i];
            newValues[i] = val === null ? null : !val;
        }

        return new BoolColumn(newValues, this._label, true);
    }

    /**
     * Performs an element-wise logical AND operation with another BoolColumn.
     *
     * @param {BoolColumn} column - The target BoolColumn to combine with.
     * @returns {BoolColumn} A new BoolColumn containing the logical AND results.
     * @throws {Error} Throws if column lengths do not match.
     */
    public and(column: BoolColumn): BoolColumn {
        const values1 = this._values as (boolean | null)[];
        const values2 = column.values as (boolean | null)[];

        if (values1.length !== values2.length) {
            throw new Error('Column lengths must match to perform logical AND operation!');
        }

        const len = values1.length;
        const newValues: (boolean | null)[] = new Array(len);

        for (let i = 0; i < len; i++) {
            const val1 = values1[i];
            const val2 = values2[i];

            if (val1 === null || val2 === null) {
                newValues[i] = null;
            } else {
                newValues[i] = val1 && val2;
            }
        }

        return new BoolColumn(newValues, `${this._label}_AND_${column.label}`, true);
    }

    /**
     * Performs an element-wise logical OR operation with another BoolColumn.
     *
     * @param {BoolColumn} column - The target BoolColumn to combine with.
     * @returns {BoolColumn} A new BoolColumn containing the logical OR results.
     * @throws {Error} Throws if column lengths do not match.
     */
    public or(column: BoolColumn): BoolColumn {
        const values1 = this._values as (boolean | null)[];
        const values2 = column.values as (boolean | null)[];

        if (values1.length !== values2.length) {
            throw new Error('Column lengths must match to perform logical OR operation!');
        }

        const len = values1.length;
        const newValues: (boolean | null)[] = new Array(len);

        for (let i = 0; i < len; i++) {
            const val1 = values1[i];
            const val2 = values2[i];

            if (val1 === null || val2 === null) {
                newValues[i] = null;
            } else {
                newValues[i] = val1 || val2;
            }
        }

        return new BoolColumn(newValues, `${this._label}_OR_${column.label}`, true);
    }

    /**
     * Performs an element-wise logical XOR (exclusive OR) operation with another BoolColumn.
     * Returns true if and only if one of the values is true and the other is false.
     * Preserves null values if either operand is null.
     *
     * @param {BoolColumn} column - The target BoolColumn to combine with.
     * @returns {BoolColumn} A new BoolColumn containing the logical XOR results.
     * @throws {Error} Throws if column lengths do not match.
     */
    public xor(column: BoolColumn): BoolColumn {
        const values1 = this._values as (boolean | null)[];
        const values2 = column.values as (boolean | null)[];

        if (values1.length !== values2.length) {
            throw new Error('Column lengths must match to perform logical XOR operation!');
        }

        const len = values1.length;
        const newValues: (boolean | null)[] = new Array(len);

        for (let i = 0; i < len; i++) {
            const val1 = values1[i];
            const val2 = values2[i];

            if (val1 === null || val2 === null) {
                newValues[i] = null;
            } else {
                newValues[i] = val1 !== val2;
            }
        }

        return new BoolColumn(newValues, `${this._label}_XOR_${column.label}`, true);
    }
}