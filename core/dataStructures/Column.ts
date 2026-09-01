import { Cache } from "../abstractClasses";

export default abstract class Column<T extends number | boolean | string> extends Cache {
    protected _values: (T | null)[];
    protected _label: string;

    constructor(values: unknown[], label: string) {
        super();
        this._label = label;
        this._values = this.prepareData(values);
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

    public set label(label: string) {
        this._label = label;
    }

    public get values(): (T | null)[] {
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

    public removeEmptyRows(): void {
        this._values = this.getValidValues();
        this.clearCache();
    }

    public countMissing(): number {
        return this.getCached('countMissing', () => {
            return this._values.reduce((total, val) => {
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