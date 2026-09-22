import { mean, variance, ssd, std } from '../statistics/univariate.js';
import { getMax, getMin } from '../utils/utils.js';
import Table from './Table.js';

export default class GroupedTable {
    private _groupByColumns: string[];
    private _groupKeys: string[];
    private _columnKeys: string[];
    private _values: Record<string, Float64Array | unknown[]>[];

    constructor(
        groupObj: Record<string, Record<string, Float64Array | unknown[]>>,
        groupByColumns: string[]
    ) {
        this._groupByColumns = groupByColumns;
        this._groupKeys = Object.keys(groupObj);

        if (!this._groupKeys || this._groupKeys.length === 0) {
            throw new Error('Invalid group object!');
        }

        this._values = Object.values(groupObj);
        this._columnKeys = this._values.length > 0 ? Object.keys(this._values[0]) : [];
    }

    private hasColumn(column: string): boolean {
        return this._columnKeys.includes(column);
    }

    private getGroupColumns(): string[][] {
        const groupArr: string[][] = Array.from(
            { length: this._groupKeys[0].split('___').length },
            () => []
        );

        for (let i = 0; i < this._groupKeys.length; i++) {
            const splitted = this._groupKeys[i].split('___');

            for (let j = 0; j < groupArr.length; j++) {
                groupArr[j].push(splitted[j]);
            }
        }

        return groupArr;
    }

    private ensureFloat64Array(arr: Float64Array | unknown[]): Float64Array {
        if (arr instanceof Float64Array) {
            return arr;
        }
        return new Float64Array(arr as number[]);
    }

    private createResultTable(
        targetColumn: string,
        statName: string,
        calcFn: (arr: Float64Array) => number,
        alias?: string
    ): Table {
        if (!this.hasColumn(targetColumn)) {
            throw new Error(`The provided column "${targetColumn}" does not exist!`);
        }

        const groupColumns = this.getGroupColumns();
        const aggregatedValues = new Float64Array(this._values.length);

        for (let i = 0; i < this._values.length; i++) {
            const groupData = this.ensureFloat64Array(this._values[i][targetColumn]);
            aggregatedValues[i] = calcFn(groupData);
        }

        const resultMatrix = [...groupColumns, aggregatedValues];
        const colLabel = alias ? alias : `${targetColumn}_${statName}`;

        const colInfos = [
            ...this._groupByColumns.map(label => ({ label, type: 'string' as const })),
            { label: colLabel, type: 'number' as const }
        ];

        return new Table(resultMatrix as any[][], colInfos);
    }

    public count(alias?: string): Table {
        const groupColumns = this.getGroupColumns();
        const countValues = new Float64Array(this._values.length);
        const firstCol = this._columnKeys[0];

        for (let i = 0; i < this._values.length; i++) {
            const group = this._values[i];
            countValues[i] = group[firstCol] ? group[firstCol].length : 0;
        }

        const resultMatrix = [...groupColumns, countValues];

        const colInfos = [
            ...this._groupByColumns.map(label => ({ label, type: 'string' as const })),
            { label: (alias || 'count'), type: 'number' as const }
        ];

        return new Table(resultMatrix as any[][], colInfos);
    }

    public sum(column: string, alias?: string): Table {
        return this.createResultTable(column, 'sum', (arr) => {
            let total = 0;
            for (let i = 0; i < arr.length; i++) {
                const val = arr[i];
                if (!Number.isNaN(val)) {
                    total += val;
                }
            }
            return total;
        }, alias);
    }

    public avg(column: string, alias?: string): Table {
        return this.createResultTable(column, 'avg', (arr) => mean(arr), alias);
    }

    public min(column: string, alias?: string): Table {
        return this.createResultTable(column, 'min', (arr) => getMin(arr), alias);
    }

    public max(column: string, alias?: string): Table {
        return this.createResultTable(column, 'max', (arr) => getMax(arr), alias);
    }

    public ssd(column: string, alias?: string): Table {
        return this.createResultTable(column, 'ssd', (arr) => ssd(arr), alias);
    }

    public variance(column: string, alias?: string): Table {
        return this.createResultTable(
            column, 'variance',
            (arr) => arr.length >= 2 ? variance(arr) : NaN, alias
        );
    }

    public std(column: string, alias?: string): Table {
        return this.createResultTable(
            column, 'std',
            (arr) => arr.length >= 2 ? std(arr) : NaN, alias
        );
    }
}