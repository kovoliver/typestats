import Column from "./Column.js";
import NumberColumn from "./NumberColumn.js";
import { labelEncoding, oneHotEncode } from "../dataPreparation/dataPreparation.js";
import { toStringArray } from "../utils/utils.js";

export default class StringColumn extends Column<string> {
    /**
     * Creates an instance of StringColumn.
     *
     * @param {unknown[]} values - The raw input values to be converted and stored.
     * @param {string} label - The column label/identifier.
     */
    constructor(values: unknown[], label: string) {
        super(values, label);
    }

    protected isValid(val: string | null): boolean {
        return typeof val === 'string' && val.trim() !== '';
    }

    /**
     * Converts raw unknown input data into an array of string or null values.
     *
     * @protected
     * @param {unknown[]} rawValues - The raw input array.
     * @returns {(string | null)[]} An array of strings or nulls for missing entries.
     */
    protected prepareData(rawValues: unknown[]): (string | null)[] {
        return toStringArray(rawValues);
    }

    /**
     * Filters stored values to return only valid string entries (excluding null/undefined).
     *
     * @protected
     * @returns {string[]} An array containing only valid string values.
     */
    protected getValidValues(): string[] {
        return this._values.filter((v): v is string => typeof v === 'string');
    }

    /**
     * Sorts valid string values in ascending order in-place (nulls placed at the end).
     * Clears cached calculations.
     */
    public orderAsc(): StringColumn {
        const values = [...this._values];

        values.sort((a, b) => {
            if (a === null) return 1;
            if (b === null) return -1;
            return a.localeCompare(b);
        });

        return new StringColumn(values, this.label);
    }

    /**
     * Sorts valid string values in descending order in-place (nulls placed at the end).
     * Clears cached calculations.
     */
    public orderDesc(): StringColumn {
        const values = [...this._values];

        values.sort((a, b) => {
            if (a === null) return 1;
            if (b === null) return -1;
            return b.localeCompare(a);
        });

        return new StringColumn(values, this.label);
    }

    /**
     * Transforms categorical string values into an integer-encoded NumberColumn.
     *
     * @returns {NumberColumn} A new NumberColumn containing label-encoded numeric values.
     * @throws {Error} Throws if the column contains missing or null values.
     */
    public labelEncode(): NumberColumn {
        const validValues = this.getValidValues();

        if (validValues.length !== this._values.length) {
            throw new Error(
                `Cannot perform label encoding on column "${this._label}" containing missing or null values. ` +
                `Please handle empty rows first.`
            );
        }

        const encodedValues = labelEncoding(validValues) as number[];
        return new NumberColumn(encodedValues, `${this._label}_encoded`);
    }

    /**
     * Calculates and caches the One-Hot Encoded representation of the string column.
     * Creates a new NumberColumn for each unique category.
     *
     * @returns {NumberColumn[]} An array of NumberColumns corresponding to each category.
     * @throws {Error} Throws if the column contains missing or null values.
     */
    public get oneHotEncoded(): NumberColumn[] {
        return this.getCached('oneHotEncoded', () => {
            const validValues = this.getValidValues();

            if (validValues.length !== this._values.length) {
                throw new Error(
                    `Cannot perform one-hot encoding on column "${this._label}" containing missing or null values. ` +
                    `Please handle empty rows first.`
                );
            }

            const { matrix, categories } = oneHotEncode(validValues);

            return categories.map((category, colIdx) => {
                const colValues = matrix.map(row => row[colIdx]);
                return new NumberColumn(colValues, `${this._label}_${category}`);
            });
        });
    }
}