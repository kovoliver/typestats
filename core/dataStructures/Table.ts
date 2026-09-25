import { Boundaries, ColInfo, ColumnData, ColumnInfo, ColumnLabel, ImputeType, PercentMode, SeriesImputeType, TableData }
    from '../types/types.js';
import {
    displayDateString,
    hasEmptyValues, getColType,
    isEmpty, isNanNullUndefined,
    isValidNumber,
    isValidString,
    isValidBool,
    isValidTimestamp,
    toUnixTimestampArray,
}
    from '../utils/utils.js';
import NumberColumn from './NumberColumn.js';
import BoolColumn from './BoolColumn.js';
import StringColumn from './StringColumn.js';
import GroupedTable from './GroupedTable.js';
import DateColumn from './DateColumn.js';
import { isDate } from '../utils/utils.js';
import { toNumberArray, toBoolArray, toStringArray }
    from '../utils/utils.js';
import { getIqrBoundaries, replaceEmptyValues, replaceOutliers }
    from '../dataPreparation/dataPreparation.js';
import { correlation, covariance } from '../statistics/bivariate.js';
import DataMatrix from './DataMatrix.js';
import { round } from '../utils/numberUtils.js';

type AnyColumn = NumberColumn & StringColumn & BoolColumn & DateColumn;

export default class Table {
    private readonly _values: TableData;
    private readonly _colInfos: ColInfo[];

    constructor(
        values: any[][] | TableData,
        colInfos: ColInfo[],
        isTrustedSource: boolean = false,
    ) {
        this._colInfos = colInfos;
        this._values = isTrustedSource ? values : this.processValues(values as any[][], colInfos);
    }

    /**
     * Creates a copy of the original raw column data.
     * @returns An array of typed arrays or standard primitive arrays representing the table columns.
     */
    public get originalTable(): ColumnData[] {
        return this._values.map(col => {
            if (col instanceof Float64Array) {
                return new Float64Array(col);
            }
            return [...col];
        }) as ColumnData[];
    }

    /**
     * Gets an array of column instances wrapping the underlying table data.
     * @returns An array containing instances of column objects (NumberColumn, StringColumn, BoolColumn, or DateColumn).
     */
    public get table(): AnyColumn[] {
        return this._colInfos.map((_, index) => this.getCol(index));
    }

    /**
     * Gets a deep copy of all column information/metadata within the table.
     * @returns An array of column metadata objects containing label and type.
     */
    public get colInfos(): ColInfo[] {
        return this._colInfos.map(info => this.cloneColInfo(info));
    }

    private cloneColInfo(colInfo: ColInfo): ColInfo {
        return {
            label: colInfo.label,
            type: colInfo.type
        };
    }

    private processValues(values: any[][], colInfos: ColInfo[]): ColumnData[] {
        const colCount = values.length;
        const processedValues: ColumnData[] = new Array(colCount);

        for (let i = 0; i < colCount; i++) {
            const rawCol = values[i];
            const type = colInfos[i]?.type ?? getColType(rawCol);
            if (colInfos[i]) colInfos[i].type = type;

            switch (type) {
                case 'number':
                    processedValues[i] = toNumberArray(rawCol);
                    break;
                case 'bool':
                    processedValues[i] = toBoolArray(rawCol);
                    break;
                case 'date':
                    processedValues[i] = toUnixTimestampArray(rawCol);
                    break;
                case 'string':
                default:
                    processedValues[i] = toStringArray(rawCol);
                    break;
            }
        }

        return processedValues;
    }


    private createColumnFromData(values: ColumnData, colInfo: ColInfo): AnyColumn {
        const type = colInfo.type ?? getColType(values as any);

        switch (type) {
            case 'number':
                return new NumberColumn(values as Float64Array, colInfo.label, true) as AnyColumn;
            case 'bool':
                return new BoolColumn(values as (boolean | null)[], colInfo.label, true) as AnyColumn;
            case 'date':
                return new DateColumn(values as Float64Array, colInfo.label, true) as AnyColumn;
            case 'string':
            default:
                return new StringColumn(values as (string | null)[], colInfo.label, true) as AnyColumn;
        }
    }

    private labelExists(label: string): boolean {
        return this._colInfos.findIndex(info => info.label === label) !== -1;
    }

    /**
     * Sets a new label/name for a specific column.
     * @param identifier - The index or current label of the column to rename.
     * @param newLabel - The new label name for the column.
     * @throws {Error} If the new label is empty, not a string, or already exists in another column.
     */
    public setLabel(identifier: number | string, newLabel: string): void {
        if (isEmpty(newLabel) || typeof newLabel !== 'string') {
            throw new Error('The new label must be a non-empty string!');
        }

        const index = this.getIndex(identifier);

        if (this.labelExists(newLabel) && this._colInfos[index].label !== newLabel) {
            throw new Error(`A column with the label "${newLabel}" already exists!`);
        }

        this._colInfos[index].label = newLabel;
    }

    /**
     * Sets new labels for multiple columns at once.
     * @param identifiers - An array of column indices or current column labels to rename.
     * @param newLabels - An array of corresponding new label names.
     * @throws {Error} If arrays lengths mismatch or if any new label is empty.
     */
    public setLabels(identifiers: (number | string)[], newLabels: string[]): void {
        if (identifiers.length !== newLabels.length) {
            throw new Error("The number of identifiers and new labels don't match!");
        }

        if (hasEmptyValues(newLabels)) {
            throw new Error('The provided new labels array has at least one empty value!');
        }

        identifiers.forEach((id, i) => this.setLabel(id, newLabels[i]));
    }

    /**
     * Retrieves a column instance by its index or label.
     * @param identifier - The zero-based index or string label of the column.
     * @returns A column instance corresponding to the given identifier.
     */
    public getCol(identifier: number | string): AnyColumn {
        const index = this.getIndex(identifier);
        const values = this._values[index];
        const info = this._colInfos[index];

        return this.createColumnFromData(values, info);
    }

    /**
     * Casts/reinterprets the specified column's type as numeric.
     * @param identifier - The index or label of the column.
     */
    public toNumberCol(identifier: number | string): void {
        const index = this.getIndex(identifier);
        this._colInfos[index].type = 'number';
    }

    /**
     * Casts/reinterprets the specified column's type as string.
     * @param identifier - The index or label of the column.
     */
    public toStringCol(identifier: number | string): void {
        const index = this.getIndex(identifier);
        this._colInfos[index].type = 'string';
    }

    /**
     * Casts/reinterprets the specified column's type as boolean.
     * @param identifier - The index or label of the column.
     */
    public toBoolCol(identifier: number | string): void {
        const index = this.getIndex(identifier);
        this._colInfos[index].type = 'bool';
    }

    private getIndex(identifier: number | string): number {
        if (
            isEmpty(identifier) ||
            (typeof identifier !== 'number' && typeof identifier !== 'string')
        ) {
            throw new Error('The provided identifier is invalid!');
        }

        const index = typeof identifier === 'string'
            ? this._colInfos.findIndex(info => info.label === identifier)
            : identifier;

        if (index === undefined || index < 0 || index >= this._values.length) {
            throw new Error(`The provided identifier (${identifier}) does not exist!`);
        }

        return index;
    }

    /**
     * Gets the total number of rows in the table.
     * @returns The row count.
     */
    public get rowCount(): number {
        if (this._values.length === 0) return 0;
        return this._values[0].length;
    }

    /**
     * Gets the total number of columns in the table.
     * @returns The column count.
     */
    public get colCount(): number {
        return this._values.length;
    }

    /**
     * Prints a formatted console table view of the specified row range and limited columns.
     * @param from - The starting row index (inclusive). Defaults to 0.
     * @param to - The ending row index (exclusive). Defaults to total row count.
     * @param maxCols - The maximum number of columns to display before truncating. Defaults to 8.
     */
    public print(from?: number, to?: number, maxCols: number = 8): void {
        const totalRows = this.rowCount;
        const totalCols = this._values.length;
        const hasMoreCols = totalCols > maxCols;
        const colsLimit = hasMoreCols ? maxCols : totalCols;

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

            for (let colIndex = 0; colIndex < colsLimit; colIndex++) {
                const info = this._colInfos[colIndex];
                const rawVal = this._values[colIndex][rowIndex];

                let displayVal: any;

                if (rawVal === undefined) displayVal = '<undefined>';
                else if (rawVal === null) displayVal = '<null>';
                else if (typeof rawVal === 'number' && Number.isNaN(rawVal)) displayVal = '<NaN>';
                else if (info.type === 'date') {
                    const dateObj = typeof rawVal === 'number' ? new Date(rawVal) : rawVal;
                    displayVal = displayDateString(dateObj as Date) ?? '<null>';
                } else {
                    displayVal = rawVal;
                }

                rowObj[info.label] = displayVal;
            }

            if (hasMoreCols) {
                rowObj['...'] = '...';
            }

            tableData[rowIndex] = rowObj;
        }

        console.table(tableData);

        const displayedRowsCount = endIndex - startIndex;

        if (hasMoreCols || displayedRowsCount < totalRows) {
            const rowInfo = `Showing rows ${startIndex}..${endIndex - 1} of ${totalRows}`;
            const colInfo = hasMoreCols
                ? `Showing ${maxCols} of ${totalCols} columns (truncated ${totalCols - maxCols} columns)`
                : `Showing all ${totalCols} columns`;

            console.log(`ℹ️ [${rowInfo}] | [${colInfo}]`);
        }
    }

    /**
     * Prints the first `n` rows of the table to the console.
     * @param n - The number of initial rows to display. Defaults to 5.
     */
    public head(n: number = 5): void {
        this.print(0, n);
    }

    /**
     * Prints the last `n` rows of the table to the console.
     * @param n - The number of trailing rows to display. Defaults to 5.
     */
    public tail(n: number = 5): void {
        const total = this.rowCount;
        this.print(Math.max(0, total - n), total);
    }

    /**
     * Groups the table rows by unique combinations of values in the specified columns.
     * @param labels - The labels of the columns to group by.
     * @returns A GroupedTable instance containing the grouped data structures.
     */
    public groupBy(...labels: string[]) {
        const targetCols = labels.map(label => {
            const index = this.getIndex(label);

            return {
                label: label,
                values: this._values[index]
            };
        });

        const rowCount = this.rowCount;
        const groups: Record<string, Record<string, ColumnData>> = {};

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const compositeKey = targetCols
                .map(col => String(col.values[rowIndex]))
                .join('___');

            if (!groups[compositeKey]) {
                groups[compositeKey] = {};

                for (let i = 0; i < this._colInfos.length; i++) {
                    const type = this._colInfos[i].type;
                    if (type === 'number' || type === 'date') {
                        groups[compositeKey][this._colInfos[i].label] = new Float64Array(0);
                    } else {
                        groups[compositeKey][this._colInfos[i].label] = [];
                    }
                }
            }

            for (let i = 0; i < this._colInfos.length; i++) {
                const label = this._colInfos[i].label;
                const val = this._values[i][rowIndex];
                const current = groups[compositeKey][label];

                if (current instanceof Float64Array) {
                    const newArr = new Float64Array(current.length + 1);
                    newArr.set(current, 0);
                    newArr[current.length] = val as number;
                    groups[compositeKey][label] = newArr;
                } else {
                    (current as any[]).push(val);
                }
            }
        }

        return new GroupedTable(groups as any, labels);
    }

    private newTableByIndices(indices: Int32Array): Table {
        const rowCount = indices.length;
        const colCount = this._values.length;

        const newValues: ColumnData[] = new Array(colCount);

        for (let c = 0; c < colCount; c++) {
            const procCol = this._values[c];

            if (procCol instanceof Float64Array) {
                const targetProc = new Float64Array(rowCount);
                for (let r = 0; r < rowCount; r++) {
                    targetProc[r] = procCol[indices[r]];
                }
                newValues[c] = targetProc;
            } else {
                const targetProc = new Array(rowCount);
                for (let r = 0; r < rowCount; r++) {
                    targetProc[r] = procCol[indices[r]];
                }
                newValues[c] = targetProc;
            }
        }

        const colInfos = this._colInfos.map(info => ({ ...info }));
        return new Table(newValues as TableData, colInfos, true);
    }

    private orderBy(labels: string[], type: 'asc' | 'desc'): Table {
        const length = this.rowCount;

        const indices = new Int32Array(length);
        for (let i = 0; i < length; i++) {
            indices[i] = i;
        }

        const columnsData = labels.map(label => {
            const colIdx = this.getIndex(label);
            return this._values[colIdx];
        });

        const dir = type === 'asc' ? 1 : -1;
        const numCols = columnsData.length;

        indices.sort((a, b) => {
            for (let i = 0; i < numCols; i++) {
                const col = columnsData[i];
                const firstVal = col[a];
                const secondVal = col[b];

                if (firstVal === secondVal) continue;
                if (firstVal === null || firstVal === undefined || Number.isNaN(firstVal)) return 1 * dir;
                if (secondVal === null || secondVal === undefined || Number.isNaN(secondVal)) return -1 * dir;

                if (typeof firstVal === 'number' && typeof secondVal === 'number') {
                    return (firstVal - secondVal) * dir;
                }

                if (typeof firstVal === 'string' && typeof secondVal === 'string') {
                    return (firstVal < secondVal ? -1 : 1) * dir;
                }

                if (firstVal < secondVal) return -1 * dir;
                if (firstVal > secondVal) return 1 * dir;
            }

            return 0;
        });

        return this.newTableByIndices(indices);
    }

    /**
     * Sorts the table in ascending order based on the specified column labels.
     * @param labels - The column labels to sort by in priority order.
     * @returns A new Table instance with sorted rows.
     */
    public orderByAsc(...labels: string[]): Table {
        return this.orderBy(labels, 'asc');
    }

    /**
     * Sorts the table in descending order based on the specified column labels.
     * @param labels - The column labels to sort by in priority order.
     * @returns A new Table instance with sorted rows.
     */
    public orderByDesc(...labels: string[]): Table {
        return this.orderBy(labels, 'desc');
    }

    private whereMultiple(
        labels: (string | number)[],
        fns: ((value: any) => boolean)[],
        andOr: 'and' | 'or'
    ): Table {
        const labelCount = labels.length;
        if (labelCount !== fns.length) {
            throw new Error('The number of labels must match the number of filter functions!');
        }

        const rowCount = this.rowCount;
        if (rowCount === 0) {
            return this.newTableByIndices(new Int32Array(0));
        }

        const targetCols: ColumnData[] = new Array(labelCount);
        for (let i = 0; i < labelCount; i++) {
            const colIdx = this.getIndex(labels[i]);
            targetCols[i] = this._values[colIdx];
        }

        const matchingIndices = new Int32Array(rowCount);
        let matchCount = 0;
        const isAnd = andOr === 'and';

        for (let row = 0; row < rowCount; row++) {
            let rowPassed = isAnd;

            for (let col = 0; col < labelCount; col++) {
                const val = targetCols[col][row];
                const result = fns[col](val);

                if (isAnd) {
                    if (!result) {
                        rowPassed = false;
                        break;
                    }
                } else {
                    if (result) {
                        rowPassed = true;
                        break;
                    }
                }
            }

            if (rowPassed) {
                matchingIndices[matchCount++] = row;
            }
        }

        const finalIndices = matchingIndices.subarray(0, matchCount);
        return this.newTableByIndices(finalIndices);
    }

    /**
     * Filters rows based on a predicate function evaluated against values from specified column(s).
     * @param lbl - A single column label or an array of column labels whose values will be passed to `fn`.
     * @param fn - A predicate function returning `true` to keep the row or `false` to exclude it.
     * @returns A new Table containing only the matching rows.
     * @throws {Error} If identifiers are invalid or not strings.
     */
    public where(
        lbl: string[] | string,
        fn: (...params: any[]) => boolean
    ): Table {
        const isArr = Array.isArray(lbl);

        if (!isArr && typeof lbl !== 'string') {
            throw new Error('The given identifier must be a string or an array!');
        }

        if (isArr && !lbl.every(id => typeof id === 'string')) {
            throw new Error('All the identifiers must be strings!');
        }

        const targetLabels = isArr ? lbl : [lbl];
        const labelCount = targetLabels.length;
        const targetColIndices: number[] = [];

        for (let i = 0; i < labelCount; i++) {
            const colIdx = this.getIndex(targetLabels[i]);
            targetColIndices.push(colIdx);
        }

        const matchingIndices = new Int32Array(this.rowCount);
        let matchCount = 0;

        for (let row = 0; row < this.rowCount; row++) {
            let params: any[] = [];

            for (const col of targetColIndices) {
                params.push(this._values[col][row]);
            }

            let passed = fn(...params);
            if (passed) matchingIndices[matchCount++] = row;
        }

        const finalIndices = matchingIndices.subarray(0, matchCount);
        return this.newTableByIndices(finalIndices);
    }

    /**
     * Filters rows where EVERY provided column passes its respective filter function (AND logical condition).
     * @param labels - An array of column labels or indices to evaluate.
     * @param fns - An array of matching filter functions corresponding to each column.
     * @returns A new Table containing rows where all conditions are met.
     */
    public whereAll(
        labels: (string | number)[],
        fns: ((value: any) => boolean)[]
    ): Table {
        return this.whereMultiple(labels, fns, 'and');
    }

    /**
     * Filters rows where AT LEAST ONE provided column passes its respective filter function (OR logical condition).
     * @param labels - An array of column labels or indices to evaluate.
     * @param fns - An array of matching filter functions corresponding to each column.
     * @returns A new Table containing rows where any condition is met.
     */
    public whereAny(
        labels: (string | number)[],
        fns: ((value: any) => boolean)[]
    ): Table {
        return this.whereMultiple(labels, fns, 'or');
    }

    private getColsByIndices(indices: number[]): Table {
        if (indices.length === 0) {
            throw new Error('You must provide at least one index!');
        }

        const procCols = indices.map(index => {
            const col = this._values[index];
            if (col instanceof Float64Array) {
                return new Float64Array(col);
            }
            return [...col];
        });
        const colInfos = indices.map(index => ({ ...this._colInfos[index] }));

        return new Table(procCols as TableData, colInfos, true);
    }

    /**
     * Selects specific columns to create a new Table containing only those columns.
     * @param labels - Column labels or indices to include in the output table.
     * @returns A new Table instance containing only the selected columns.
     * @throws {Error} If no labels are provided.
     */
    public select(...labels: (string | number)[]): Table {
        if (!labels || labels.length === 0) {
            throw new Error('At least one column identifier must be provided for select!');
        }

        const indices = labels.map(label => this.getIndex(label));
        return this.getColsByIndices(indices);
    }

    /**
     * Removes specified columns and returns a new Table with the remaining columns.
     * @param labels - Column labels or indices to exclude.
     * @returns A new Table instance with the specified columns removed.
     */
    public drop(...labels: (string | number)[]): Table {
        const dropIndices = labels.map(label => this.getIndex(label));
        const keepIndices: number[] = [];

        for (let i = 0; i < this._values.length; i++) {
            if (!dropIndices.includes(i)) {
                keepIndices.push(i);
            }
        }

        return this.getColsByIndices(keepIndices);
    }

    /**
     * Inserts a new column at the beginning (index 0) of the table.
     * @param values - An array of values for the new column.
     * @param colInfo - Metadata for the new column.
     * @returns A new Table instance including the added column.
     */
    public addColumnFirst(values: any[], colInfo: ColInfo): Table {
        return this.addColumnAt(values, colInfo, 0);
    }

    /**
     * Appends a new column at the end of the table.
     * @param values - An array of values for the new column.
     * @param colInfo - Metadata for the new column.
     * @returns A new Table instance including the added column.
     */
    public addColumnLast(values: any[], colInfo: ColInfo): Table {
        return this.addColumnAt(values, colInfo, this._values.length);
    }

    /**
     * Inserts a new column at a specified index within the table.
     * @param values - An array of values for the new column.
     * @param colInfo - Metadata for the new column.
     * @param index - The zero-based column position to insert the new column at.
     * @returns A new Table instance including the added column.
     * @throws {Error} If the index is out of bounds or row counts mismatch.
     */
    public addColumnAt(values: any[], colInfo: ColInfo, index: number): Table {
        if (index < 0 || index > this._values.length) {
            throw new Error('The given index is invalid!');
        }

        if (values.length !== this.rowCount && this.rowCount !== 0) {
            throw new Error(
                `The provided values length (${values.length}) does not match table row count (${this.rowCount})!`
            );
        }

        const info = { ...colInfo };
        if (!info.type) {
            info.type = getColType(values);
        }

        const newValues = this._values.map(c => c instanceof Float64Array ? new Float64Array(c) : [...c]);
        const newInfos = this._colInfos.map(i => ({ ...i }));

        let processedVal: ColumnData;
        if (info.type === 'number') processedVal = toNumberArray(values);
        else if (info.type === 'date') processedVal = toUnixTimestampArray(values);
        else if (info.type === 'bool') processedVal = toBoolArray(values);
        else processedVal = toStringArray(values);

        newValues.splice(index, 0, processedVal as Float64Array<ArrayBuffer>);
        newInfos.splice(index, 0, info);

        return new Table(newValues as TableData, newInfos, true);
    }

    /**
     * Removes rows that contain invalid, missing, or null values in specified column(s).
     * @param labels - Column label(s) to check for missing values.
     * @param how - Condition mode: 'any' drops the row if any column is missing a value, 'all' drops only if all specified columns are missing values. Defaults to 'any'.
     * @returns A new Table instance without the dropped rows.
     * @throws {Error} If no labels are provided.
     */
    public dropNa(
        labels: ColumnLabel | ColumnLabel[],
        how: 'any' | 'all' = 'any'
    ): Table {
        const isArray = Array.isArray(labels);

        if (isEmpty(labels) || (isArray && labels.length === 0)) {
            throw new Error("You must provide at least one label!");
        }

        const labelList = isArray ? labels : [labels];
        const rowCount = this.rowCount;
        const validIndices = new Int32Array(rowCount);

        const targetIndices = labelList.map(label => this.getIndex(label));

        const validators = targetIndices.map(colIdx => {
            const type = this._colInfos[colIdx].type;

            switch (type) {
                case "number": return isValidNumber;
                case "string": return isValidString;
                case "bool": return isValidBool;
                case "date": return isValidTimestamp;
                default: return isValidString;
            }
        });

        const numCols = targetIndices.length;
        let count = 0;

        for (let row = 0; row < rowCount; row++) {
            let isValidRow = how === 'any';

            for (let c = 0; c < numCols; c++) {
                const colIdx = targetIndices[c];
                const rowValue = this._values[colIdx][row];
                const cellValid = validators[c](rowValue as any);

                if (how === 'any') {
                    if (!cellValid) {
                        isValidRow = false;
                        break;
                    }
                } else {
                    if (cellValid) {
                        isValidRow = true;
                        break;
                    }
                }
            }

            if (isValidRow) {
                validIndices[count++] = row;
            }
        }

        return this.newTableByIndices(validIndices.subarray(0, count));
    }

    /**
     * Removes rows containing outliers in a numeric column based on explicit boundary limits.
     * @param label - The column index or label to check.
     * @param boundaries - Lower (`min`) and/or upper (`max`) boundary limits.
     * @returns A new Table instance without outlier rows.
     * @throws {Error} If the column is not numeric.
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
     * Removes rows containing outliers in a numeric column using the Interquartile Range (IQR) method.
     * @param label - The column index or label to check.
     * @param multiplier - The IQR multiplier factor (e.g., 1.5). Defaults to 1.5.
     * @param percentMode - Percentile calculation mode. Defaults to 'interpolated'.
     * @returns A new Table instance without outlier rows.
     * @throws {Error} If the column is not numeric.
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
     * Counts the number of outlier values in a numeric column using explicit boundary limits.
     * @param label - The column index or label to check.
     * @param boundaries - Lower (`min`) and/or upper (`max`) boundary limits.
     * @returns The count of outlier values.
     * @throws {Error} If the column is not numeric.
     */
    public countOutliers(
        label: string | number,
        boundaries: Boundaries
    ): number {
        const col = this.getCol(label);

        if (!(col instanceof NumberColumn)) {
            throw new Error('Outlier counting is only supported for numeric columns!');
        }

        return col.countOutliers(boundaries);
    }

    /**
     * Counts the number of outlier values in a numeric column using IQR boundaries.
     * @param label - The column index or label to check.
     * @param multiplier - The IQR multiplier factor. Defaults to 1.5.
     * @param percentMode - Percentile calculation mode. Defaults to 'interpolated'.
     * @returns The count of outlier values.
     * @throws {Error} If the column is not numeric.
     */
    public countOutliersIqr(
        label: string | number,
        multiplier: number = 1.5,
        percentMode: PercentMode = 'interpolated'
    ): number {
        const col = this.getCol(label);

        if (!(col instanceof NumberColumn)) {
            throw new Error('Outlier counting is only supported for numeric columns!');
        }

        return col.countOutliersIqr(multiplier, percentMode);
    }

    private replaceColumnAtIndex(targetIndex: number, newColumnData: any): Table {
        const newValues = this._values.map((col, idx) => {
            if (idx === targetIndex) return newColumnData;

            return col instanceof Float64Array
                ? new Float64Array(col)
                : col.slice();
        });

        return new Table(newValues as TableData, this._colInfos, true);
    }

    /**
     * Imputes missing/NaN values in a numeric column using a specified statistical imputation strategy.
     * @param label - The column label or index.
     * @param type - The imputation method ('mean', 'median', 'mode', etc.).
     * @returns A new Table instance with imputed numeric values.
     * @throws {Error} If the target column is not numeric.
     */
    public fillNaNumeric(label: string | number, type: ImputeType): Table {
        const targetCol = this.getCol(label) as NumberColumn;

        if (!(targetCol instanceof NumberColumn)) {
            throw new Error('Statistical imputation (mean, median, mode) is only applicable to numeric columns!');
        }

        const targetIndex = this.getIndex(label);

        const newCol = replaceEmptyValues(
            targetCol.values as Float64Array, type,
            targetCol.getValidValues() as Float64Array
        );

        return this.replaceColumnAtIndex(targetIndex, newCol);
    }

    /**
     * Replaces outlier values in a numeric column with calculated statistical imputations.
     * @param label - The column label or index.
     * @param type - The imputation method ('mean', 'median', 'mode', etc.).
     * @param boundaries - Outlier threshold boundaries.
     * @param targetColInstance - Optional existing NumberColumn reference to avoid duplicate lookups.
     * @param preparedValues - Optional Float64Array of valid values to optimize computation.
     * @returns A new Table instance with replaced outlier values.
     * @throws {Error} If the target column is not numeric.
     */
    public replaceOutliers(
        label: string | number,
        type: ImputeType,
        boundaries: Boundaries,
        targetColInstance?: NumberColumn,
        preparedValues?: Float64Array
    ): Table {
        const targetCol = targetColInstance ?? this.getCol(label);

        if (!(targetCol instanceof NumberColumn)) {
            throw new Error('Statistical imputation (mean, median, mode) is only applicable to numeric columns!');
        }

        const targetIndex = this.getIndex(label);
        const rawValidValues = preparedValues ?? targetCol.getValidValues();

        const newCol = replaceOutliers(
            targetCol.getValidValues() as Float64Array,
            type, boundaries,
            rawValidValues as Float64Array
        );

        return this.replaceColumnAtIndex(targetIndex, newCol);
    }

    /**
     * Replaces outlier values in a numeric column using IQR boundaries and statistical imputation.
     * @param label - The column label or index.
     * @param type - The imputation method ('mean', 'median', 'mode', etc.).
     * @param multiplier - IQR multiplier factor. Defaults to 1.5.
     * @param percentMode - Percentile calculation mode. Defaults to 'interpolated'.
     * @returns A new Table instance with replaced outlier values.
     * @throws {Error} If the target column is not numeric.
     */
    public replaceOutliersIQR(
        label: string | number,
        type: ImputeType,
        multiplier: number = 1.5,
        percentMode: PercentMode = 'interpolated'
    ): Table {
        const targetCol = this.getCol(label) as NumberColumn;

        if (!(targetCol instanceof NumberColumn)) {
            throw new Error('Statistical imputation (mean, median, mode) is only applicable to numeric columns!');
        }

        const preparedValues = targetCol.getValidValues();

        const boundaries = getIqrBoundaries(
            preparedValues as Float64Array,
            multiplier, percentMode,
            preparedValues as Float64Array
        );

        return this.replaceOutliers(label, type, boundaries, targetCol, preparedValues as Float64Array);
    }

    /**
     * Replaces missing/null values in a column with a constant scalar value.
     * @param label - The target column label or index.
     * @param value - The constant value to fill missing cells with (must match column type).
     * @returns A new Table instance with filled missing values.
     * @throws {Error} If replacement value type does not match column data type.
     */
    public fillNa(label: string | number, value: number | string | boolean | Date): Table {
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

        if (targetCol instanceof DateColumn && !isDate(value)) {
            throw new Error('You must provide a Date replacement value for Date columns!');
        }

        const targetIndex = this.getIndex(label);
        const filledValues = targetCol.getFilledValues(value as any);

        return this.replaceColumnAtIndex(targetIndex, filledValues);
    }

    /**
     * Maps values of an existing column through a transformation function and appends the output as a new column.
     * @param label - The source column label or index to read values from.
     * @param newLabel - The label for the newly created column.
     * @param fn - A transformation mapping function applied to each non-null cell.
     * @returns A new Table instance containing the newly mapped column.
     * @throws {Error} If newLabel exists or if transformation fails.
     */
    public mapColumn(
        label: string | number,
        newLabel: string,
        fn: (val: number | boolean | string) => number | boolean | string
    ): Table {
        if (this.labelExists(newLabel)) {
            throw new Error(`A column with the label "${newLabel}" already exists!`);
        }

        const colIndex = this.getIndex(label);
        const sourceData = this._values[colIndex];

        let newValues: any[] = [];

        try {
            const len = sourceData.length;
            newValues = new Array(len);
            for (let i = 0; i < len; i++) {
                const val = sourceData[i];
                if (isNanNullUndefined(val)) {
                    newValues[i] = val;
                } else {
                    newValues[i] = fn(val as any);
                }
            }
        } catch {
            throw new Error(`The transformation function failed on column "${this._colInfos[colIndex].label}"!`);
        }

        const newType = getColType(newValues);
        const newColInfo: ColInfo = { label: newLabel, type: newType };

        return this.addColumnAt(newValues, newColInfo, colIndex + 1);
    }

    /**
     * Applies an in-place transformation function across values of an existing column.
     * @param identifier - The label or index of the column to transform.
     * @param fn - A transformation function applied to non-null cell values.
     * @returns The current Table instance with modified column values.
     * @throws {Error} If transformation execution fails.
     */
    public applyColumn(
        identifier: string | number,
        fn: (val: number | boolean | string) => number | boolean | string
    ): Table {
        const index = this.getIndex(identifier);
        const sourceData = this._values[index];

        let newValues: any[] = [];

        try {
            const len = sourceData.length;
            newValues = new Array(len);
            for (let i = 0; i < len; i++) {
                const val = sourceData[i];
                if (isNanNullUndefined(val)) {
                    newValues[i] = val;
                } else {
                    newValues[i] = fn(val as any);
                }
            }
        } catch {
            throw new Error(`The transformation function failed on column "${this._colInfos[index].label}"!`);
        }

        const nonNullValues = newValues.filter(v => !isNanNullUndefined(v));
        const newType = nonNullValues.length > 0
            ? getColType(nonNullValues)
            : this._colInfos[index].type;

        if (newType === 'number' || newType === 'date') {
            this._values[index] = new Float64Array(newValues);
        } else {
            this._values[index] = newValues;
        }

        this._colInfos[index].type = newType;

        return this;
    }

    /**
     * Combines values from multiple numeric columns row-wise using an arithmetic operation and appends the result as a new column.
     * @param labels - An array of source numeric column labels.
     * @param operation - The arithmetic operation to execute ('+', '-', '*', '/').
     * @param newLabel - The label for the resulting output column.
     * @returns A new Table instance with the combined arithmetic column added.
     * @throws {Error} If fewer than two labels are provided or any specified column is non-numeric.
     */
    public combineColumns(
        labels: string[],
        operation: '+' | '-' | '*' | '/',
        newLabel: string
    ): Table {
        if (labels.length < 2) {
            throw new Error('At least two column labels are required to combine columns!');
        }

        if (isEmpty(newLabel) || typeof newLabel !== 'string') {
            throw new Error('You must provide a non-empty string as a label!');
        }

        if (this.labelExists(newLabel)) {
            throw new Error(`A column with the label "${newLabel}" already exists!`);
        }

        const colIndices = labels.map(label => {
            const index = this.getIndex(label);
            if (this._colInfos[index].type !== 'number') {
                throw new Error(`Column "${label}" is not a numeric column!`);
            }
            return index;
        });

        const rowCount = this.rowCount;
        const newValues = new Float64Array(rowCount);

        for (let row = 0; row < rowCount; row++) {
            let result = (this._values[colIndices[0]] as Float64Array)[row];

            if (isNanNullUndefined(result)) {
                newValues[row] = NaN;
                continue;
            }

            let hasError = false;

            for (let c = 1; c < colIndices.length; c++) {
                const nextVal = (this._values[colIndices[c]] as Float64Array)[row];

                if (isNanNullUndefined(nextVal)) {
                    hasError = true;
                    break;
                }

                switch (operation) {
                    case '+':
                        result += nextVal;
                        break;
                    case '-':
                        result -= nextVal;
                        break;
                    case '*':
                        result *= nextVal;
                        break;
                    case '/':
                        if (nextVal === 0) {
                            hasError = true;
                        } else {
                            result /= nextVal;
                        }
                        break;
                }

                if (hasError) break;
            }

            newValues[row] = hasError ? NaN : result;
        }

        const newColInfo: ColInfo = { label: newLabel, type: 'number' };
        return this.addColumnLast(newValues as any, newColInfo);
    }

    /**
     * Merges string values from multiple columns row-wise joined by a separator string into a new column.
     * @param labels - Array of column labels to concatenate.
     * @param separator - String delimiter inserted between column values.
     * @param newLabel - Label for the newly generated column.
     * @returns A new Table instance with the merged column inserted.
     * @throws {Error} If fewer than two column labels are supplied.
     */
    public mergeColumns(
        labels: string[],
        separator: string,
        newLabel: string
    ): Table {
        if (!labels || labels.length < 2) {
            throw new Error('At least two column labels are required to merge!');
        }

        const colIndices = labels.map(label => this.getIndex(label));
        const lastIndex = colIndices[colIndices.length - 1];
        const rowCount = this.rowCount;
        const newValues: string[] = [];

        for (let row = 0; row < rowCount; row++) {
            const rowValues = colIndices.map(idx => {
                const val = this._values[idx][row];

                if (isNanNullUndefined(val)) {
                    return '';
                }

                return String(val);
            });

            newValues.push(rowValues.join(separator));
        }

        const newColInfo: ColInfo = { label: newLabel, type: 'string' };
        return this.addColumnAt(newValues, newColInfo, lastIndex + 1);
    }

    private createStatMatrix(
        labels: string[],
        fn: (val1: Float64Array, val2: Float64Array) => number,
        calculation: 'covariance' | 'correlation',
        printed: boolean = false,
    ): number[][] {
        const n = labels.length;

        const matrix: number[][] = Array.from(
            { length: n },
            () => new Array(n)
        );

        for (let i = 0; i < n; i++) {
            const col1 = this.getCol(labels[i]) as NumberColumn;

            if (!(col1 instanceof NumberColumn)) {
                throw new Error(`The following column is not numeric: ${labels[i]}`);
            }

            for (let j = i; j < n; j++) {
                if (i === j) {
                    matrix[i][i] = calculation === 'covariance' ? col1.variance() : 1;
                    continue;
                }

                const col2 = this.getCol(labels[j]);

                if (!(col2 instanceof NumberColumn)) {
                    throw new Error(`The following column is not numeric: ${labels[i]}`);
                }

                const calculated = fn(col1.getValidValues() as Float64Array, col2.getValidValues() as Float64Array);

                matrix[i][j] = calculated;
                matrix[j][i] = calculated;
            }
        }

        if (printed) {
            const printObj: Record<string, Record<string, number>> = {};

            for (let i = 0; i < n; i++) {
                const rowLabel = labels[i];
                printObj[rowLabel] = {};

                for (let j = 0; j < n; j++) {
                    const colLabel = labels[j];
                    printObj[rowLabel][colLabel] = round(matrix[i][j], 3);
                }
            }

            console.table(printObj);
        }

        return matrix;
    }

    /**
     * Calculates a covariance matrix for the specified numeric columns.
     * @param labels - Array of numeric column labels to evaluate.
     * @param printed - Whether to print the covariance table matrix to console. Defaults to false.
     * @returns A 2D square matrix of calculated covariance values.
     */
    public covariance(labels: string[], printed: boolean = false): number[][] {
        return this.createStatMatrix(labels, covariance, 'covariance', printed);
    }

    /**
     * Calculates a Pearson correlation matrix for the specified numeric columns.
     * @param labels - Array of numeric column labels to evaluate.
     * @param printed - Whether to print the correlation table matrix to console. Defaults to false.
     * @returns A 2D square matrix of calculated correlation coefficients.
     */
    public correlation(labels: string[], printed: boolean = false): number[][] {
        return this.createStatMatrix(labels, correlation, 'correlation', printed);
    }

    /**
     * Prints a comprehensive summary description of the table structure, missing data metrics, and summary statistics to console.
     */
    public describe(): void {
        console.log(`================================================================================`);
        console.log(`=================================TABLE SUMMARY==================================`);
        console.log(`================================================================================`);
        console.log(`Shape: ${this.rowCount} rows x ${this.colCount} columns\n`);
        console.log(`--- Column Overview ---`);

        const totalRows = this.rowCount;
        const columnInfos: ColumnInfo[] = [];
        const numericStats: Record<string, unknown>[] = [];
        const dateStats: Record<string, unknown>[] = [];

        for (let i = 0; i < this._values.length; i++) {
            const col = this.getCol(i);
            const missing = col.countMissing();
            const valid = col.values.length - missing;

            const missingPercent = totalRows > 0
                ? Number(((missing / totalRows) * 100).toFixed(2))
                : 0;

            columnInfos.push({
                label: col.label,
                type: this._colInfos[i].type ?? 'string',
                missing: missing,
                valid: valid,
                'missing %': `${missingPercent}%`
            });

            if (col instanceof NumberColumn) {
                numericStats.push(col.describeStats());
            }

            if (col instanceof DateColumn) {
                dateStats.push({
                    label: col.label,
                    min: displayDateString((col as DateColumn).min()),
                    max: displayDateString((col as DateColumn).max())
                });
            }
        }

        console.table(columnInfos);

        if (numericStats.length > 0) {
            console.log(`\n--- Numeric Column Statistics ---`);
            console.table(numericStats);
        }

        if (dateStats.length > 0) {
            console.log(`\n--- Date Column Statistics ---`);
            console.table(dateStats);
        }
    }

    /**
     * Converts table row data into an array of plain JavaScript objects.
     * @returns An array of row objects where keys correspond to column labels.
     */
    public toObject(): Record<string, any>[] {
        const finalObj: Record<string, any>[] = [];
        const rowCount = this.rowCount;
        const colCount = this._values.length;

        for (let row = 0; row < rowCount; row++) {
            const obj: Record<string, any> = {};

            for (let col = 0; col < colCount; col++) {
                obj[this._colInfos[col].label] = this._values[col][row];
            }

            finalObj.push(obj);
        }

        return finalObj;
    }

    /**
     * Serializes the table content into a CSV formatted string.
     * @param separator - Column delimiter character used in CSV formatting. Defaults to ';'.
     * @returns The serialized CSV string.
     */
    public toCSV(separator: string = ';'): string {
        const labels = this._colInfos.map(info => info.label);
        let finalStr = labels.join(separator) + "\n";
        const rowCount = this.rowCount;

        for (let row = 0; row < rowCount; row++) {
            const rowValues = this._values.map(col => {
                const val = col[row];

                if (isNanNullUndefined(val)) {
                    return '';
                }

                return String(val);
            });

            finalStr += rowValues.join(separator) + "\n";
        }

        return finalStr;
    }

    /**
     * Converts table data into a 2D raw value matrix (rows x columns).
     * @returns A 2D array matrix containing table cell values.
     */
    public toMatrix(): any[][] {
        const matrix: any[][] = [];
        const colCount = this._values.length;
        const rowCount = this.rowCount;

        for (let row = 0; row < rowCount; row++) {
            const rowData: any[] = [];

            for (let col = 0; col < colCount; col++) {
                rowData.push(this._values[col][row]);
            }

            matrix.push(rowData);
        }

        return matrix;
    }

    /**
     * Builds a 2D contingency matrix (cross-tabulation) between two categorical columns.
     * @param colLabel - Column label representing column dimensions of the contingency matrix.
     * @param rowLabel - Column label representing row dimensions of the contingency matrix.
     * @returns A DataMatrix object containing observation frequencies.
     */
    public toContingencyTable(colLabel: string, rowLabel: string): DataMatrix {
        const colValues = this.getCol(colLabel).values;
        const rowValues = this.getCol(rowLabel).values;
        const len = this.rowCount;

        const colSet = new Set<string>();
        const rowSet = new Set<string>();

        for (let i = 0; i < len; i++) {
            if (colValues[i] != null) colSet.add(String(colValues[i]));
            if (rowValues[i] != null) rowSet.add(String(rowValues[i]));
        }

        const colLabels = Array.from(colSet);
        const rowLabels = Array.from(rowSet);

        const colIndexMap = new Map<string, number>();
        for (let i = 0; i < colLabels.length; i++) colIndexMap.set(colLabels[i], i);

        const rowIndexMap = new Map<string, number>();
        for (let i = 0; i < rowLabels.length; i++) rowIndexMap.set(rowLabels[i], i);

        const numCols = colLabels.length;
        const numRows = rowLabels.length;

        const crossTable: Float64Array[] = new Array(numCols);

        for (let c = 0; c < numCols; c++) {
            crossTable[c] = new Float64Array(numRows);
        }

        for (let i = 0; i < len; i++) {
            const cVal = colValues[i];
            const rVal = rowValues[i];

            if (cVal != null && rVal != null) {
                const cIdx = colIndexMap.get(String(cVal))!;
                const rIdx = rowIndexMap.get(String(rVal))!;
                crossTable[cIdx][rIdx]++;
            }
        }

        return new DataMatrix(crossTable, colLabels, rowLabels);
    }

    /**
     * Formats grouped numerical values into a DataMatrix ready for One-Way Analysis of Variance (ANOVA).
     * @param groupColLabel - The categorical grouping column label.
     * @param valueColLabel - The numeric target column label containing observational metrics.
     * @returns A DataMatrix structuring numerical observations grouped by distinct categorical levels.
     */
    public toAnovaTable(groupColLabel: string, valueColLabel: string): DataMatrix {
        const groupValues = this.getCol(groupColLabel).values;
        const numericCol = this.getCol(valueColLabel) as NumberColumn;
        const numericValues = numericCol.values;
        const len = this.rowCount;

        const groupSet = new Set<string>();

        for (let i = 0; i < len; i++) {
            if (groupValues[i] != null) groupSet.add(String(groupValues[i]));
        }

        const colLabels = Array.from(groupSet);
        const groupCount = colLabels.length;

        const groupIndexMap = new Map<string, number>();
        for (let i = 0; i < groupCount; i++) {
            groupIndexMap.set(colLabels[i], i);
        }

        const groupSizes = new Int32Array(groupCount);

        for (let i = 0; i < len; i++) {
            const gVal = groupValues[i];
            const nVal = numericValues[i];

            if (gVal != null && nVal != null && !Number.isNaN(nVal)) {
                const gIdx = groupIndexMap.get(String(gVal))!;
                groupSizes[gIdx]++;
            }
        }

        const matrixValues: Float64Array[] = new Array(groupCount);

        for (let g = 0; g < groupCount; g++) {
            matrixValues[g] = new Float64Array(groupSizes[g]);
        }

        const groupPointers = new Int32Array(groupCount);

        for (let i = 0; i < len; i++) {
            const gVal = groupValues[i];
            const nVal = numericValues[i];

            if (gVal != null && nVal != null && !Number.isNaN(nVal)) {
                const gIdx = groupIndexMap.get(String(gVal))!;
                const writeIdx = groupPointers[gIdx]++;
                matrixValues[gIdx][writeIdx] = nVal;
            }
        }

        return new DataMatrix(matrixValues, colLabels);
    }

    private locf(
        values: Float64Array,
        validator: (val: number) => boolean = (val) => isValidNumber(val)
    ): Float64Array {
        if (values.length === 0) {
            throw new Error('The time series does not have values!');
        }

        let firstValidIdx = -1;
        for (let i = 0; i < values.length; i++) {
            if (validator(values[i])) {
                firstValidIdx = i;
                break;
            }
        }

        if (firstValidIdx === -1) {
            throw new Error("The given dataset only has invalid values or outliers!");
        }

        let lastValid = values[firstValidIdx];

        for (let i = 0; i < values.length; i++) {
            if (validator(values[i])) {
                lastValid = values[i];
            } else {
                values[i] = lastValid;
            }
        }

        return values;
    }

    private nocb(
        values: Float64Array,
        validator: (val: number) => boolean = (val) => isValidNumber(val)
    ): Float64Array {
        if (values.length === 0) {
            throw new Error('The time series does not have values!');
        }

        let countInvalid = 0;
        let hasValid = false;

        for (let i = 0; i < values.length; i++) {
            if (validator(values[i])) {
                hasValid = true;
                break;
            }
        }

        if (!hasValid) {
            throw new Error("The given dataset only has invalid values or outliers!");
        }

        let validValue = 0;
        const length = values.length;

        for (let i = 0; i < length; i++) {
            if (!validator(values[i])) {
                countInvalid++;
            } else if (countInvalid !== 0) {
                for (let j = 1; j <= countInvalid; j++) {
                    values[i - j] = values[i];
                }

                countInvalid = 0;
                validValue = values[i];
            }
        }

        if (countInvalid > 0) {
            for (let i = length - 1; i >= length - countInvalid; i--) {
                values[i] = validValue;
            }
        }

        return values;
    }

    private getInterpolatedValues(
        firstValid: number,
        lastValid: number,
        steps: number
    ): Float64Array {
        const interPolAdd = (lastValid - firstValid) / (steps + 1);
        let interpolVal = firstValid + interPolAdd;
        const interpolValues = new Float64Array(steps);

        for (let i = 0; i < steps; i++) {
            interpolValues[i] = interpolVal;
            interpolVal += interPolAdd;
        }

        return interpolValues;
    }

    private imputeInterpolation(
        values: Float64Array,
        validator: (val: number) => boolean = (val) => isValidNumber(val)
    ): Float64Array {
        if (values.length === 0) {
            throw new Error('The time series does not have values!');
        }

        let countInvalid = 0;
        const length = values.length;

        for (let i = 0; i < length; i++) {
            if (!validator(values[i])) {
                if (i === 0) {
                    throw new Error(
                        'The first element is invalid or an outlier; hence, interpolation is not possible!'
                    );
                }
                countInvalid++;
            } else if (countInvalid !== 0) {
                const firstValid = values[i - (countInvalid + 1)];
                const lastValid = values[i];

                const interpolValues = this.getInterpolatedValues(
                    firstValid, lastValid, countInvalid
                );

                for (let j = 0; j < countInvalid; j++) {
                    values[i - countInvalid + j] = interpolValues[j];
                }

                countInvalid = 0;
            }
        }

        if (countInvalid > 0) {
            throw new Error(
                'The last elements are invalid or outliers; hence, interpolation is not possible!'
            );
        }

        return values;
    }

    private movingAverageImputation(
        values: Float64Array,
        windowSize: number = 3,
        validator: (val: number) => boolean = (val) => isValidNumber(val)
    ): Float64Array {
        if (values.length === 0) {
            throw new Error('The time series does not have values!');
        }

        if (windowSize <= 0 || !Number.isInteger(windowSize)) {
            throw new Error('Window size must be a positive integer!');
        }

        const length = values.length;
        const validFlags = new Uint8Array(length);

        let hasAnyValid = false;
        for (let i = 0; i < length; i++) {
            const isVal = validator(values[i]);
            validFlags[i] = isVal ? 1 : 0;
            if (isVal) hasAnyValid = true;
        }

        if (!hasAnyValid) {
            throw new Error("The given dataset only has invalid values or outliers!");
        }

        const leftRadius = Math.floor(windowSize / 2);
        const rightRadius = windowSize % 2 === 0 ? leftRadius - 1 : leftRadius;

        for (let i = 0; i < length; i++) {
            if (validFlags[i] === 0) {
                let sum = 0;
                let validCount = 0;

                const start = Math.max(0, i - leftRadius);
                const end = Math.min(length - 1, i + rightRadius);

                for (let j = start; j <= end; j++) {
                    if (j !== i && validFlags[j] === 1) {
                        sum += values[j];
                        validCount++;
                    }
                }

                if (validCount === 0) {
                    throw new Error(
                        `Moving average imputation is not possible for index ${i}: no valid values or non-outliers in window size ${windowSize}!`
                    );
                }

                values[i] = sum / validCount;
            }
        }

        return values;
    }

    private executeTimeSeriesTransformation(
        colValues: Float64Array,
        imputeType: SeriesImputeType,
        movingAvgWindowSize: number,
        validator: (val: number) => boolean = (val) => isValidNumber(val)
    ): Float64Array {
        switch (imputeType) {
            case 'locf':
                return this.locf(colValues, validator);
            case 'nocb':
                return this.nocb(colValues, validator);
            case 'interpolation':
                return this.imputeInterpolation(colValues, validator);
            case 'movingAverage':
                return this.movingAverageImputation(
                    colValues,
                    movingAvgWindowSize,
                    validator
                );
            default:
                throw new Error('The provided imputation strategy does not exist!');
        }
    }

    /**
     * Imputes missing/invalid values in a time series column using time series imputation techniques.
     * @param label - The target numeric column identifier.
     * @param imputeType - The time-series imputation method ('locf', 'nocb', 'interpolation', 'movingAverage').
     * @param movingAvgWindowSize - Window size used when `imputeType` is 'movingAverage'. Defaults to 3.
     * @returns A new Table instance with imputed time series data.
     * @throws {Error} If target column is not numeric or empty.
     */
    public imputeTS(
        label: string | number,
        imputeType: SeriesImputeType,
        movingAvgWindowSize: number = 3
    ): Table {
        const targetCol: NumberColumn = this.getCol(label);

        if (!(targetCol instanceof NumberColumn)) {
            throw new Error('The imputeTS method is only available for numeric columns!');
        }

        if (targetCol.getValidValues().length === 0) {
            throw new Error('The time series does not have values!');
        }

        const targetIndex = this.getIndex(label);
        const colValues = new Float64Array(this._values[targetIndex] as Float64Array);

        const newCol = this.executeTimeSeriesTransformation(
            colValues,
            imputeType,
            movingAvgWindowSize
        );

        const newValues = this._values.map((col, idx) => {
            if (idx === targetIndex) return newCol;
            return col instanceof Float64Array ? new Float64Array(col) : [...col];
        });

        return new Table(newValues as TableData, this._colInfos, true);
    }

    /**
     * Detects and replaces time series outliers using custom explicit min/max boundaries and a specified time series imputation strategy.
     * @param label - The target numeric column identifier.
     * @param imputeType - The time-series imputation method ('locf', 'nocb', 'interpolation', 'movingAverage').
     * @param boundaries - Lower (`min`) and/or upper (`max`) boundary limits defining valid data ranges.
     * @param movingAvgWindowSize - Window size used when `imputeType` is 'movingAverage'. Defaults to 3.
     * @param targetColInstance - Optional existing NumberColumn reference.
     * @returns A new Table instance with replaced time-series outliers.
     * @throws {Error} If target column is non-numeric or boundaries are missing.
     */
    public replaceTSOutliers(
        label: string | number,
        imputeType: SeriesImputeType,
        boundaries: Boundaries,
        movingAvgWindowSize: number = 3,
        targetColInstance?: NumberColumn
    ): Table {
        const targetCol: NumberColumn = targetColInstance ? targetColInstance : this.getCol(label);

        if (!(targetCol instanceof NumberColumn)) {
            throw new Error('The replaceTSOutliers method is only available for numeric columns!');
        }

        if (targetCol.getValidValues().length === 0) {
            throw new Error('The time series does not have values!');
        }

        const { min, max } = boundaries;

        if (min === undefined && max === undefined) {
            throw new Error('You must provide at least a min or a max boundary!');
        }

        const targetIndex = this.getIndex(label);
        const colValues = new Float64Array(this._values[targetIndex] as Float64Array);

        const validator = (val: number): boolean => {
            if (!isValidNumber(val)) {
                return false;
            }

            if (min !== undefined && val < min) {
                return false;
            }

            if (max !== undefined && val > max) {
                return false;
            }

            return true;
        };

        const newCol = this.executeTimeSeriesTransformation(
            colValues,
            imputeType,
            movingAvgWindowSize,
            validator
        );

        const newValues = this._values.map((col, idx) => {
            if (idx === targetIndex) return newCol;
            return col instanceof Float64Array ? new Float64Array(col) : [...col];
        });

        return new Table(newValues as TableData, this._colInfos, true);
    }

    /**
     * Detects and replaces time series outliers using Interquartile Range (IQR) boundaries and time series imputation.
     * @param label - The target numeric column identifier.
     * @param imputeType - The time-series imputation method ('locf', 'nocb', 'interpolation', 'movingAverage').
     * @param multiplier - IQR multiplier factor used for boundary determination. Defaults to 1.5.
     * @param movingAvgWindowSize - Window size used when `imputeType` is 'movingAverage'. Defaults to 3.
     * @param percentMode - Percentile calculation algorithm. Defaults to 'interpolated'.
     * @returns A new Table instance with replaced time-series outliers.
     * @throws {Error} If target column is non-numeric.
     */
    public replaceTSOutliersIqr(
        label: string | number,
        imputeType: SeriesImputeType,
        multiplier: number = 1.5,
        movingAvgWindowSize: number = 3,
        percentMode: PercentMode = 'interpolated'
    ): Table {
        const targetCol: NumberColumn = this.getCol(label);

        if (!(targetCol instanceof NumberColumn)) {
            throw new Error('The replaceTSOutliersIqr method is only available for numeric columns!');
        }

        const rawValues = targetCol.getValidValues() as Float64Array;

        const iqrBounds = getIqrBoundaries(
            rawValues,
            multiplier,
            percentMode
        );

        return this.replaceTSOutliers(
            label,
            imputeType,
            iqrBounds,
            movingAvgWindowSize,
            targetCol
        );
    }
}