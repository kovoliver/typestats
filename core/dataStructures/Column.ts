import { Cache } from "../abstractions/abstractClasses.js";

export default abstract class Column<T extends number | boolean | string | Date> extends Cache {
    protected readonly _values: ReadonlyArray<T | null>;
    protected _label: string;

    constructor(values: unknown[], label: string) {
        super();
        this._label = label;
        this._values = Object.freeze(this.prepareData(values));
    }

    protected abstract prepareData(rawValues: unknown[]): (T | null)[];

    protected abstract isValid(value: T | null): boolean;

    /**
     * Returns an array containing exclusively valid, non-missing values.
     */
    protected getValidValues(): T[] {
        const result: T[] = [];

        for (let i = 0; i < this._values.length; i++) {
            const val = this._values[i];
            if (this.isValid(val)) {
                result.push(val as T);
            }
        }

        return result;
    }

    /**
     * Returns an array of original zero-based row indices corresponding to valid entries.
     */
    public getValidIndices(): number[] {
        const indices: number[] = [];

        for (let i = 0; i < this._values.length; i++) {
            if (this.isValid(this._values[i])) {
                indices.push(i);
            }
        }

        return indices;
    }

    public get label(): string {
        return this._label;
    }

    public set label(newLabel: string) {
        this._label = newLabel;
    }

    public withLabel(newLabel: string): Column<T> {
        return this.createInstance([...this._values], newLabel);
    }

    public get values(): ReadonlyArray<T | null> {
        return this._values;
    }

    public filterIndices(predicate: (val: T | null, index: number) => boolean): number[] {
        const indices: number[] = [];

        for (let i = 0; i < this._values.length; i++) {
            if (predicate(this._values[i], i)) {
                indices.push(i);
            }
        }

        return indices;
    }

    public filterValues(predicate: (val: T | null, index: number) => boolean): (T | null)[] {
        const result: (T | null)[] = [];

        for (let i = 0; i < this._values.length; i++) {
            if (predicate(this._values[i], i)) {
                result.push(this._values[i]);
            }
        }

        return result;
    }

    public filter(predicate: (val: T | null, index: number) => boolean): Column<T> {
        const filteredValues = this._values.filter(predicate);
        return this.createInstance(filteredValues, this._label);
    }

    protected createInstance(
        values: unknown[],
        label: string
    ): Column<T> {
        return new (this.constructor as new (values: unknown[], label: string) => Column<T>)(
            values,
            label
        );
    }

    public removeEmptyRows(): Column<T> {
        const values = this.getValidValues();
        return this.createInstance(values, this._label);
    }

    public fillMissing(replacement: T): Column<T> {
        const filled = this._values.map(val => this.isValid(val) ? val : replacement);
        return this.createInstance(filled, this._label);
    }

    public countMissing(): number {
        return this.getCached('countMissing', () => {
            return this._values.reduce((total: number, val) => {
                if (!this.isValid(val)) return total + 1;
                return total;
            }, 0);
        });
    }

    public countValid(): number {
        return this.getCached('countValid', () => this._values.length - this.countMissing());
    }

    public unique(): T[] {
        return this.getCached('unique', () => Array.from(new Set(this.getValidValues())));
    }

    public getFilledValues(replacement: T): T[] {
        return this._values.map(val => this.isValid(val) ? val : replacement) as T[];
    }

    public display(): void {
        const tableData = this._values.map(val => {
            let displayValue: unknown = val;

            if (val === undefined) displayValue = '<undefined>';
            else if (val === null) displayValue = '<null>';
            else if (typeof val === 'number' && Number.isNaN(val)) displayValue = '<NaN>';

            return { [this._label]: displayValue };
        });

        console.table(tableData);
    }
}