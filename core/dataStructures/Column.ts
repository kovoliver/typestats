import { Cache } from "../abstractions/abstractClasses.js";

export default abstract class Column<T extends number | boolean | string | Date> extends Cache {
    protected readonly _values: ReadonlyArray<T | null> | Float64Array;
    protected _label: string;

    constructor(
        values: unknown[] | (T | null)[] | Float64Array,
        label: string,
        isProcessed: boolean = false
    ) {
        super();
        this._label = label;
        this._values = !isProcessed ? this.prepareData(values as unknown[]) : values as (T | null)[] | Float64Array;
    }

    protected abstract prepareData(rawValues: unknown[]): (T | null)[] | Float64Array;

    public abstract isValid(value: unknown): boolean;

    /**
     * Returns an array containing exclusively valid, non-missing values.
     */
    public getValidValues(): T[] | Float64Array {
        const validIndices = this.getValidIndices();
        const count = validIndices.length;

        if (this._values instanceof Float64Array) {
            const result = new Float64Array(count);
            for (let i = 0; i < count; i++) {
                result[i] = this._values[validIndices[i]];
            }
            return result;
        }

        const result: T[] = new Array(count);
        for (let i = 0; i < count; i++) {
            result[i] = this._values[validIndices[i]] as T;
        }

        return result;
    }

    /**
     * Returns an array of original zero-based row indices corresponding to valid entries.
     */
    public getValidIndices(): Int32Array {
        const len = this._values.length;

        if (len === 0) {
            return new Int32Array(0);
        }

        const validIndices = new Int32Array(len);
        let count = 0;

        for (let i = 0; i < len; i++) {
            if (this.isValid(this._values[i])) {
                validIndices[count++] = i;
            }
        }

        return validIndices.subarray(0, count);
    }

    public getInvalidIndices(): Int32Array {
        const len = this._values.length;

        if (len === 0) {
            return new Int32Array(0);
        }

        const validIndices = new Int32Array(len);
        let count = 0;

        for (let i = 0; i < len; i++) {
            if (!this.isValid(this._values[i])) {
                validIndices[count++] = i;
            }
        }

        return validIndices.subarray(0, count);
    }

    public get label(): string {
        return this._label;
    }

    public set label(newLabel: string) {
        this._label = newLabel;
    }

    public withLabel(newLabel: string): Column<T> {
        if (this._values instanceof Float64Array) {
            return this.createInstance(new Float64Array(this._values), newLabel);
        }
        return this.createInstance([...this._values], newLabel);
    }

    public get values(): ReadonlyArray<T | null> | Float64Array {
        return this._values;
    }

    public filterIndices(predicate: (val: T | null, index: number) => boolean): Int32Array {
        const len = this._values.length;

        if (len === 0) {
            return new Int32Array(0);
        }

        const indices = new Int32Array(len);
        let count = 0;

        for (let i = 0; i < len; i++) {
            if (predicate(this._values[i] as T | null, i)) {
                indices[count++] = i;
            }
        }

        return indices.subarray(0, count);
    }

    public filterValues(predicate: (val: T | null, index: number) => boolean): (T | null)[] | Float64Array {
        const indices = this.filterIndices(predicate);
        const count = indices.length;

        if (this._values instanceof Float64Array) {
            const result = new Float64Array(count);
            for (let i = 0; i < count; i++) {
                result[i] = this._values[indices[i]];
            }
            return result;
        }

        const result: (T | null)[] = new Array(count);
        for (let i = 0; i < count; i++) {
            result[i] = this._values[indices[i]];
        }

        return result;
    }

    public filter(predicate: (val: T | null, index: number) => boolean): Column<T> {
        const filteredValues = this.filterValues(predicate);
        return this.createInstance(filteredValues, this._label);
    }

    protected createInstance(
        values: unknown[] | Float64Array,
        label: string
    ): Column<T> {
        return new (this.constructor as new (values: unknown[] | Float64Array, label: string) => Column<T>)(
            values,
            label
        );
    }

    public removeEmptyRows(): Column<T> {
        const values = this.getValidValues();
        return this.createInstance(values, this._label);
    }

    public fillMissing(replacement: T): Column<T> {
        const len = this._values.length;

        if (this._values instanceof Float64Array) {
            const filled = new Float64Array(len);
            for (let i = 0; i < len; i++) {
                const val = this._values[i];
                filled[i] = this.isValid(val) ? val : (replacement as unknown as number);
            }
            return this.createInstance(filled, this._label);
        }

        const filled: (T | null)[] = new Array(len);
        for (let i = 0; i < len; i++) {
            const val = this._values[i];
            filled[i] = this.isValid(val) ? val : replacement;
        }
        return this.createInstance(filled, this._label);
    }

    public countMissing(): number {
        return this.getCached('countMissing', () => {
            let missingCount = 0;
            for (let i = 0; i < this._values.length; i++) {
                if (!this.isValid(this._values[i])) {
                    missingCount++;
                }
            }
            return missingCount;
        });
    }

    public countValid(): number {
        return this.getCached('countValid', () => this._values.length - this.countMissing());
    }

    public unique(): T[] | Float64Array {
        return this.getCached('unique', () => {
            const valid = this.getValidValues();
            if (valid instanceof Float64Array) {
                return new Float64Array(new Set(valid));
            }
            return Array.from(new Set(valid));
        });
    }

    public getFilledValues(replacement: T): T[] | Float64Array {
        const len = this._values.length;

        if (this._values instanceof Float64Array) {
            const filled = new Float64Array(len);
            for (let i = 0; i < len; i++) {
                const val = this._values[i];
                filled[i] = this.isValid(val) ? val : (replacement as unknown as number);
            }
            return filled;
        }

        const filled: T[] = new Array(len);
        for (let i = 0; i < len; i++) {
            const val = this._values[i];
            filled[i] = (this.isValid(val) ? val : replacement) as T;
        }
        return filled;
    }

    public display(): void {
        const len = this._values.length;
        const tableData = new Array(len);

        for (let i = 0; i < len; i++) {
            const val = this._values[i];
            let displayValue: unknown = val;

            if (val === undefined) displayValue = '<undefined>';
            else if (val === null) displayValue = '<null>';
            else if (typeof val === 'number' && Number.isNaN(val)) displayValue = '<NaN>';

            tableData[i] = { [this._label]: displayValue };
        }

        console.table(tableData);
    }
}