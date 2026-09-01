import { mean, variance, ssd, std } from '../statistics/univariate';
import { getMax, getMin } from '../utils/utils';
import Table from './Table';

export default class GroupedTable {
    private _groupKeys: string[];
    private _columnKeys: string[];
    private _values: Record<string, any[]>[];

    constructor(groupObj: Record<string, Record<string, any[]>>) {
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

    private createResultTable(
        targetColumn: string,
        statName: string,
        calcFn: (arr: any[]) => number,
        alias?: string
    ): Table {
        if (!this.hasColumn(targetColumn)) {
            throw new Error(`The provided column "${targetColumn}" does not exist!`);
        }

        const groupColumns = this.getGroupColumns();
        const aggregatedValues = this._values.map(group => calcFn(group[targetColumn]));

        const resultMatrix = [...groupColumns, aggregatedValues];

        const groupLabels = this._columnKeys.slice(0, groupColumns.length);
        const colLabel = alias ? alias : `${targetColumn}_${statName}`;

        const colInfos = [
            ...groupLabels.map(label => ({ label, type: 'string' as const })),
            { label: colLabel, type: 'number' as const }
        ];

        return new Table(resultMatrix, colInfos);
    }

    public count(alias?: string): Table {
        const groupColumns = this.getGroupColumns();
        const countValues = this._values.map(group => {
            const firstCol = this._columnKeys[0];
            return group[firstCol] ? group[firstCol].length : 0;
        });

        const resultMatrix = [...groupColumns, countValues];
        const groupLabels = this._columnKeys.slice(0, groupColumns.length);

        const colInfos = [
            ...groupLabels.map(label => ({ label, type: 'string' as const })),
            { label: (alias || 'count'), type: 'number' as const }
        ];

        return new Table(resultMatrix, colInfos);
    }

    public sum(column: string, alias?: string): Table {
        return this.createResultTable(column, 'sum', (arr) =>
            arr.reduce((total, val) => total + (Number(val) || 0), 0),
            alias
        );
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
        return this.createResultTable(column, 'variance', (arr) => variance(arr), alias);
    }

    public std(column: string, alias?: string): Table {
        return this.createResultTable(column, 'std', (arr) => std(arr), alias);
    }
}