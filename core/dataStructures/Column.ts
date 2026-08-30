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
    protected abstract getValidValues(): T[];

    public get label(): string {
        return this._label;
    }

    public get values(): (T | null)[] {
        return this._values;
    }

    public countMissing(): number {
        return this.getCached('countMissing', () => {
            return this._values.reduce((total, val) => {
                if (val === null || val === undefined || val === '') return total + 1;
                if (typeof val === 'number' && Number.isNaN(val)) return total + 1;
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