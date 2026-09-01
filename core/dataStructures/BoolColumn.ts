import Column from "./Column";
import NumberColumn from "./NumberColumn";
import { toBoolArray } from "../utils/utils";

export default class BoolColumn extends Column<boolean> {
    /**
     * Creates an instance of BoolColumn.
     *
     * @param {unknown[]} values - The raw input array of values to be converted and processed.
     * @param {string} label - The label or title identifier for the column.
     */
    constructor(values: unknown[], label: string) {
        super(values, label);
    }

    protected isValid(val: boolean | null): boolean {
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
            return this.getValidValues().reduce((total, val) => val ? total + 1 : total, 0);
        });
    }

    /**
     * Calculates and caches the count of `false` values in the column.
     *
     * @returns {number} The total number of `false` entries.
     */
    public countFalse(): number {
        return this.getCached('countFalse', () => {
            return this.getValidValues().length - this.countTrue();
        });
    }

    /**
     * Calculates and caches the ratio of `true` values relative to all valid entries (0.0 to 1.0).
     *
     * @returns {number} The proportion of `true` values.
     */
    public trueRatio(): number {
        return this.getCached('trueRatio', () => {
            const validCount = this.getValidValues().length;
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
            const validCount = this.getValidValues().length;
            if (validCount === 0) return 0;
            return this.countFalse() / validCount;
        });
    }

    /**
     * Converts the boolean column into a new NumberColumn (true -> 1, false -> 0, null -> null).
     *
     * @returns {NumberColumn} A new NumberColumn instance with numeric binary values.
     */
    public toNumberColumn(): NumberColumn {
        const numericValues = this._values.map(val => {
            if (val === null) return NaN;
            return val ? 1 : 0;
        });

        return new NumberColumn(numericValues, `${this._label}_numeric`);
    }

    /**
     * Performs an element-wise logical NOT operation on the column, inverting boolean values.
     * Preserves null values. Clears cached calculations.
     */
    public invert(): void {
        this._values = this._values.map(val => (val === null ? null : !val));
        this.clearCache();
    }

    /**
     * Performs an element-wise logical AND operation with another BoolColumn.
     *
     * @param {BoolColumn} column - The target BoolColumn to combine with.
     * @returns {BoolColumn} A new BoolColumn containing the logical AND results.
     * @throws {Error} Throws if column lengths do not match.
     */
    public and(column: BoolColumn): BoolColumn {
        if (this._values.length !== column.values.length) {
            throw new Error('Column lengths must match to perform logical AND operation!');
        }

        const newValues = this._values.map((val, idx) => {
            const otherVal = column.values[idx];
            if (val === null || otherVal === null) return null;
            return val && otherVal;
        });

        return new BoolColumn(newValues, `${this._label}_AND_${column.label}`);
    }

    /**
     * Performs an element-wise logical OR operation with another BoolColumn.
     *
     * @param {BoolColumn} column - The target BoolColumn to combine with.
     * @returns {BoolColumn} A new BoolColumn containing the logical OR results.
     * @throws {Error} Throws if column lengths do not match.
     */
    public or(column: BoolColumn): BoolColumn {
        if (this._values.length !== column.values.length) {
            throw new Error('Column lengths must match to perform logical OR operation!');
        }

        const newValues = this._values.map((val, idx) => {
            const otherVal = column.values[idx];
            if (val === null || otherVal === null) return null;
            return val || otherVal;
        });

        return new BoolColumn(newValues, `${this._label}_OR_${column.label}`);
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
        if (this._values.length !== column.values.length) {
            throw new Error('Column lengths must match to perform logical XOR operation!');
        }

        const newValues = this._values.map((val, idx) => {
            const otherVal = column.values[idx];
            if (val === null || otherVal === null) return null;
            return val !== otherVal;
        });

        return new BoolColumn(newValues, `${this._label}_XOR_${column.label}`);
    }
}