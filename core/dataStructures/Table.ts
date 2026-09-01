import { Boundaries, ColInfo, ColType, ImputeType, PercentMode } from '../types';
import { isBool, isEmpty, isNumeric, only01 } from '../utils/utils';
import NumberColumn from './NumberColumn';
import BoolColumn from './BoolColumn';
import StringColumn from './StringColumn';
import GroupedTable from './GroupedTable';
import Column from './Column';

export default class Table {
    private _originalTable: any[][];
    private _table: Column<number | boolean | string>[];
    private _colInfos: ColInfo[];

    constructor(table: any[][], colInfos: ColInfo[]) {
        this._originalTable = table;
        this._colInfos = colInfos;
        this._table = this.createColInstances(table, colInfos);
    }

    public setLabel(identifier: number | string, newLabel: string) {
        if (isEmpty(newLabel) || typeof newLabel !== 'string') {
            throw new Error('The new label must be a non-empty string!');
        }

        const index = this.getIndex(identifier);
        const labelExists = this._colInfos.some(
            (info, i) => i !== index && info.label === newLabel
        );

        if (labelExists) {
            throw new Error(`A column with the label "${newLabel}" already exists!`);
        }

        const colInfo = this._colInfos[index];

        this._colInfos[index] = {
            type: colInfo.type,
            label: newLabel
        };

        this._table[index].label = newLabel;
    }

    public getCol(identifier: number | string): Column<number | string | boolean> {
        const index = this.getIndex(identifier);
        return this._table[index];
    }

    public toNumberCol(identifier: number | string): void {
        const { values, index } = this.getOriginalWithIndex(identifier);
        const label = this._colInfos[index].label;
        this._table[index] = new NumberColumn(values, label);
        this._colInfos[index].type = 'number';
    }

    public toStringCol(identifier: number | string): void {
        const { values, index } = this.getOriginalWithIndex(identifier);
        const label = this._colInfos[index].label;
        this._table[index] = new StringColumn(values, label);
        this._colInfos[index].type = 'string';
    }

    public toBoolCol(identifier: number | string) {
        const { values, index } = this.getOriginalWithIndex(identifier);
        const label = this._colInfos[index].label;
        this._table[index] = new BoolColumn(values, label);
        this._colInfos[index].type = 'bool';
    }

    private getIndex(identifier: number | string) {
        if (isEmpty(identifier)
            || (typeof identifier !== 'number'
                && typeof identifier !== 'string'
            )) {
            throw new Error('The provided identifier is invalid!');
        }

        const index = typeof identifier === 'string'
            ? this._colInfos.findIndex(info => info.label === identifier)
            : identifier;

        if (index === undefined || index < 0 || index >= this._originalTable.length) {
            throw new Error(`The provided identifier (${identifier}) does not exist!`);
        }

        return index;
    }

    private getOriginalWithIndex(identifier: number | string): { values: any[], index: number } {
        const index = this.getIndex(identifier);

        return {
            values: this._originalTable[index],
            index: index
        };
    }

    public getOriginal(identifier: number | string): any[] {
        const index = this.getIndex(identifier);
        return this._originalTable[index];
    }

    private getColType(
        col: any[],
        colType?: ColType
    ): ColType {
        if (colType) return colType;

        if (only01(col)) return 'bool';
        const firstNonEmpty = col.find(val => !isEmpty(val));

        if (isNumeric(firstNonEmpty)) return 'number';
        if (isBool(firstNonEmpty)) return 'bool';

        return 'string';
    }

    private createColInstance(
        col: any[],
        colInfo: ColInfo
    ): Column<number | boolean | string> {
        const type = this.getColType(col, colInfo.type);

        switch (type) {
            case 'number':
                return new NumberColumn(col, colInfo.label);
            case 'bool':
                return new BoolColumn(col, colInfo.label);
            case 'string':
                return new StringColumn(col, colInfo.label);
            default:
                throw new Error(`The provided column type (${colInfo?.type}) is invalid!`);
        }
    }

    private createColInstances(
        table: any[][],
        colInfos: ColInfo[]
    ) {
        return table.map((col, i) => this.createColInstance(col, colInfos[i]));
    }

    /**
     * Returns the total number of rows in the table.
     */
    public get rowCount(): number {
        if (this._table.length === 0) return 0;
        return this._table[0].values.length;
    }

    /**
     * Displays a slice of the table rows in the console within a given index range [fromInclusive, toExclusive).
     * @param {number} [from=0] The zero-based starting row index (inclusive).
     * @param {number} [to] The zero-based ending row index (exclusive). Defaults to the total row count.
     */
    public print(from?: number, to?: number): void {
        const totalRows = this.rowCount;

        let startIndex = from ?? 0;
        let endIndex = to ?? totalRows;

        if (startIndex < 0) startIndex = 0;
        if (endIndex > totalRows) endIndex = totalRows;
        if (startIndex >= endIndex || totalRows === 0) {
            console.log('--- Empty Table / No Rows to Display ---');
            return;
        }

        const tableData: Record<number, Record<string, any>> = {};

        for (let rowIndex = startIndex; rowIndex < endIndex; rowIndex++) {
            const rowObj: Record<string, any> = {};

            for (let colIndex = 0; colIndex < this._table.length; colIndex++) {
                const col = this._table[colIndex];
                const rawVal = col.values[rowIndex];

                let displayVal: any = rawVal;
                if (rawVal === undefined) displayVal = '<undefined>';
                else if (rawVal === null) displayVal = '<null>';
                else if (typeof rawVal === 'number' && Number.isNaN(rawVal)) displayVal = '<NaN>';

                rowObj[col.label] = displayVal;
            }

            tableData[rowIndex] = rowObj;
        }

        console.table(tableData);
    }

    /**
     * Prints the first N rows of the table to the console.
     * @param {number} [n=5] The number of rows to display from the top.
     */
    public head(n: number = 5): void {
        this.print(0, n);
    }

    /**
     * Prints the last N rows of the table to the console.
     * @param {number} [n=5] The number of rows to display from the bottom.
     */
    public tail(n: number = 5): void {
        const total = this.rowCount;
        this.print(Math.max(0, total - n), total);
    }

    public groupBy(...labels: string[]) {
        const targetCols = labels.map(label => {
            const index = this.getIndex(label);

            return {
                label: label,
                values: this._table[index].values
            };
        });

        const rowCount = this._table[0].values.length;
        const groups: Record<string, Record<string, any[]>> = {};

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const compositeKey = targetCols
                .map(col => String(col.values[rowIndex]))
                .join('___');

            if (!groups[compositeKey]) {
                groups[compositeKey] = {};

                for (const col of this._table) {
                    groups[compositeKey][col.label] = [];
                }
            }

            for (const col of this._table) {
                groups[compositeKey][col.label].push(col.values[rowIndex]);
            }
        }

        return new GroupedTable(groups);
    }

    private newTableByIndices(indices: number[]): Table {
        const newTable = this._table.map(col => {
            return indices.map(index => col.values[index]);
        });

        const colInfos = this._colInfos.map(info => ({ ...info }));

        return new Table(newTable, colInfos);
    }

    private orderBy(labels: string[], type: 'asc' | 'desc'): Table {
        const length = this._table[0].values.length;
        const data = labels.map(label => this.getCol(label));

        const indices = Array.from(
            { length }, (_, i) => i
        );

        indices.sort((a, b) => {
            let indexA = a;
            let indexB = b;

            if (type === 'desc') {
                indexA = b;
                indexB = a;
            }

            for (let i = 0; i < data.length; i++) {
                const firstVal = data[i].values[indexA];
                const secondVal = data[i].values[indexB];
                let diff = 0;

                if (typeof firstVal === 'number'
                    && typeof secondVal === 'number') {
                    diff = firstVal - secondVal;
                } else if (typeof firstVal === 'string'
                    && typeof secondVal === 'string') {
                    diff = firstVal.localeCompare(secondVal);
                } else if (typeof firstVal === 'boolean'
                    && typeof secondVal === 'boolean') {
                    diff = Number(firstVal) - Number(secondVal);
                }

                if (diff !== 0) return diff;
            }

            return 0;
        });

        return this.newTableByIndices(indices);
    }

    public orderByAsc(...labels: string[]): Table {
        return this.orderBy(labels, 'asc');
    }

    public orderByDesc(...labels: string[]): Table {
        return this.orderBy(labels, 'desc');
    }

    private whereMultiple(
        labels: (string | number)[],
        fns: ((value: any) => boolean)[],
        andOr: 'and' | 'or'
    ) {
        if (labels.length !== fns.length) {
            throw new Error('The number of labels must match the number of filter functions!');
        }

        const cols = labels.map(label => this.getCol(label));
        const indices: number[] = [];

        for (let row = 0; row < cols[0].values.length; row++) {
            let passed = andOr === 'and';

            for (let col = 0; col < cols.length; col++) {
                passed = fns[col](cols[col].values[row]);

                if (andOr === 'or' && passed) break;
                if (andOr === 'and' && !passed) break;
            }

            if (passed) {
                indices.push(row);
            }
        }

        return this.newTableByIndices(indices);
    }

    public whereAll(
        labels: (string | number)[],
        fns: ((value: any) => boolean)[]
    ): Table {
        return this.whereMultiple(labels, fns, 'and');
    }

    public whereAny(
        labels: (string | number)[],
        fns: ((value: any) => boolean)[]
    ): Table {
        return this.whereMultiple(labels, fns, 'or');
    }

    public where(label: string | number, fn: (value: any) => boolean): Table {
        const col = this.getCol(label);
        const indices: number[] = [];

        for (let i = 0; i < col.values.length; i++) {
            if (fn(col.values[i])) {
                indices.push(i);
            }
        }

        return this.newTableByIndices(indices);
    }

    private getColsByIndices(indices: number[]): Table {
        if (indices.length === 0) {
            throw new Error('You must provide at least one index!');
        }

        const rows = indices.map(index => [...this._table[index].values]);
        const colInfos = indices.map(index => ({ ...this._colInfos[index] }));
        return new Table(rows, colInfos);
    }

    public select(...labels: (string | number)[]): Table {
        if (!labels || labels.length === 0) {
            throw new Error('At least one column identifier must be provided for select!');
        }

        const indices = labels.map(label => this.getIndex(label));
        return this.getColsByIndices(indices);
    }

    public drop(...labels: (string | number)[]) {
        const indices: number[] = [];

        for (let i = 0; i < this._table.length; i++) {
            if (!labels.includes(this._table[i].label)) {
                indices.push(i);
            }
        }

        return this.getColsByIndices(indices);
    }

    public addColumnFirst(values: any[], colInfo: ColInfo): Table {
        if (values.length !== this.rowCount && this.rowCount !== 0) {
            throw new Error(`The provided values length (${values.length}) does not match table row count (${this.rowCount})!`);
        }

        const newMatrix = [values, ...this._table.map(col => [...col.values])];
        const newColInfos = [{ ...colInfo }, ...this._colInfos.map(info => ({ ...info }))];

        return new Table(newMatrix, newColInfos);
    }

    public addColumnLast(values: any[], colInfo: ColInfo): Table {
        if (values.length !== this.rowCount && this.rowCount !== 0) {
            throw new Error(
                `The provided values length (${values.length}) does not match table row count (${this.rowCount})!`
            );
        }

        const newMatrix = [...this._table.map(col => [...col.values]), values];
        const newColInfos = [...this._colInfos.map(info => ({ ...info })), { ...colInfo }];

        return new Table(newMatrix, newColInfos);
    }

    public addColumnAt(values: any[], colInfo: ColInfo, index: number): Table {
        if (index < 0 || index > this._table.length) {
            throw new Error('The given index is invalid!');
        }

        if (values.length !== this.rowCount && this.rowCount !== 0) {
            throw new Error(
                `The provided values length (${values.length}) does not match table row count (${this.rowCount})!`
            );
        }

        const currentMatrix = this._table.map(col => [...col.values]);
        const currentInfos = this._colInfos.map(info => ({ ...info }));

        currentMatrix.splice(index, 0, values);
        currentInfos.splice(index, 0, { ...colInfo });

        return new Table(currentMatrix, currentInfos);
    }

    /**
     * Removes rows containing missing, empty, or NaN values based on the specified column.
     * Works universally across all column types (NumberColumn, StringColumn, BoolColumn).
     * 
     * @param {string | number} label - The label or index identifier of the target column.
     * @returns {Table} A new Table containing only valid rows.
     */
    public dropNa(label: string | number): Table {
        const col = this.getCol(label);
        const validIndices = col.getValidIndices();
        return this.newTableByIndices(validIndices);
    }

    /**
     * Removes rows where values in the specified numeric column fall outside boundary thresholds.
     * 
     * @param {string | number} label - The label or index identifier of the target numeric column.
     * @param {Boundaries} boundaries - The lower (`min`) and upper (`max`) threshold boundaries.
     * @returns {Table} A new Table containing only non-outlier rows based on the boundaries.
     */
    public dropOutliers(label: string | number, boundaries: Boundaries): Table {
        const col = this.getCol(label);

        if (!(col instanceof NumberColumn)) {
            throw new Error('Dropping outliers by boundaries is only supported on numeric columns!');
        }

        const validIndices = col.filterIndicesByBoundaries(boundaries);
        return this.newTableByIndices(validIndices);
    }

    /**
     * Removes rows where values in the specified numeric column are outliers based on Tukey's IQR rule.
     * 
     * @param {string | number} label - The label or index identifier of the target numeric column.
     * @param {number} [multiplier=1.5] - The IQR multiplier factor (1.5 for mild, 3.0 for extreme outliers).
     * @param {PercentMode} [percentMode='interpolated'] - The mode used for percentile estimation.
     * @returns {Table} A new Table containing only non-outlier rows based on IQR logic.
     */
    public dropOutliersIqr(
        label: string | number,
        multiplier: number = 1.5,
        percentMode: PercentMode = 'interpolated'
    ): Table {
        const col = this.getCol(label);

        if (!(col instanceof NumberColumn)) {
            throw new Error('Outlier removal based on IQR is only supported on numeric columns!');
        }

        const validIndices = col.filterIndicesByIqr(multiplier, percentMode);
        return this.newTableByIndices(validIndices);
    }

    /**
     * Imputes missing or NaN values in a specified numeric column using a statistical imputation strategy (MEAN, MEDIAN, MODE).
     * Returns a new Table instance, preserving immutability.
     * 
     * @param {string | number} label - The label name or zero-based index of the target numeric column.
     * @param {ImputeType} type - The statistical imputation strategy to apply ('MEAN', 'MEDIAN', or 'MODE').
     * @returns {Table} A new Table instance containing the statistically imputed values.
     * @throws {Error} Throws if the target column is not an instance of NumberColumn.
     */
    public fillNaNumeric(label: string | number, type: ImputeType): Table {
        const targetCol = this.getCol(label);

        if (!(targetCol instanceof NumberColumn)) {
            throw new Error('Statistical imputation (MEAN, MEDIAN, MODE) is only applicable to numeric columns!');
        }

        const targetIndex = this.getIndex(label);
        const imputedValues = targetCol.getImputedValues(type);

        const newCols = this._table.map((col, idx) => {
            if (idx === targetIndex) {
                return new NumberColumn(imputedValues, col.label);
            }
            return this.cloneColumn(col);
        });

        return this.createTableFromCols(newCols);
    }

    /**
     * Fills missing, null, or NaN values in a specified column with a literal constant value.
     * Enforces strict type compatibility between the target column and the provided replacement value.
     * Returns a new Table instance, preserving immutability.
     * 
     * @param {string | number} label - The label name or zero-based index of the target column.
     * @param {number | string | boolean} value - The replacement constant value (must match the target column type).
     * @returns {Table} A new Table instance containing the imputed values.
     * @throws {Error} Throws if the replacement value type does not match the target column type.
     */
    public fillNa(label: string | number, value: number | string | boolean): Table {
        const targetCol = this.getCol(label);

        if (targetCol instanceof NumberColumn && typeof value !== 'number') {
            throw new Error('You must provide a numeric replacement value for numeric columns!');
        }
        if (targetCol instanceof BoolColumn && typeof value !== 'boolean') {
            throw new Error('You must provide a boolean replacement value (true/false) for boolean columns!');
        }
        if (targetCol instanceof StringColumn && typeof value !== 'string') {
            throw new Error('You must provide a string replacement value for string columns!');
        }

        const targetIndex = this.getIndex(label);

        const newCols = this._table.map((col, idx) => {
            if (idx === targetIndex) {
                const filledValues = col.getFilledValues(value as any);
                return this.createColumnInstance(filledValues, col);
            }
            return this.cloneColumn(col);
        });

        return this.createTableFromCols(newCols);
    }

    private cloneColumn(col: Column<any>): Column<any> {
        if (col instanceof NumberColumn) return new NumberColumn([...col.values], col.label);
        if (col instanceof BoolColumn) return new BoolColumn([...col.values], col.label);
        return new StringColumn([...col.values], col.label);
    }

    private createColumnInstance(values: any[], col: Column<any>): Column<any> {
        if (col instanceof NumberColumn) return new NumberColumn(values, col.label);
        if (col instanceof BoolColumn) return new BoolColumn(values, col.label);
        return new StringColumn(values, col.label);
    }

    private createTableFromCols(cols: Column<any>[]): Table {
        const matrix = cols.map(c => [...c.values]);
        const infos = this._colInfos.map(info => ({ ...info }));
        return new Table(matrix, infos);
    }
}