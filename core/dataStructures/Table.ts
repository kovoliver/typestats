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

    public get originalTable(): ColumnData[] {
        return this._values.map(col => {
            if (col instanceof Float64Array) {
                return new Float64Array(col);
            }
            return [...col];
        }) as ColumnData[];
    }

    public get table(): AnyColumn[] {
        return this._colInfos.map((_, index) => this.getCol(index));
    }

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

    public setLabels(identifiers: (number | string)[], newLabels: string[]): void {
        if (identifiers.length !== newLabels.length) {
            throw new Error("The number of identifiers and new labels don't match!");
        }

        if (hasEmptyValues(newLabels)) {
            throw new Error('The provided new labels array has at least one empty value!');
        }

        identifiers.forEach((id, i) => this.setLabel(id, newLabels[i]));
    }

    public getCol(identifier: number | string): AnyColumn {
        const index = this.getIndex(identifier);
        const values = this._values[index];
        const info = this._colInfos[index];

        return this.createColumnFromData(values, info);
    }

    public toNumberCol(identifier: number | string): void {
        const index = this.getIndex(identifier);
        this._colInfos[index].type = 'number';
    }

    public toStringCol(identifier: number | string): void {
        const index = this.getIndex(identifier);
        this._colInfos[index].type = 'string';
    }

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

    public get rowCount(): number {
        if (this._values.length === 0) return 0;
        return this._values[0].length;
    }

    public get colCount(): number {
        return this._values.length;
    }

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

    public head(n: number = 5): void {
        this.print(0, n);
    }

    public tail(n: number = 5): void {
        const total = this.rowCount;
        this.print(Math.max(0, total - n), total);
    }

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

    public select(...labels: (string | number)[]): Table {
        if (!labels || labels.length === 0) {
            throw new Error('At least one column identifier must be provided for select!');
        }

        const indices = labels.map(label => this.getIndex(label));
        return this.getColsByIndices(indices);
    }

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

    public addColumnFirst(values: any[], colInfo: ColInfo): Table {
        return this.addColumnAt(values, colInfo, 0);
    }

    public addColumnLast(values: any[], colInfo: ColInfo): Table {
        return this.addColumnAt(values, colInfo, this._values.length);
    }

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

    public dropOutliers(label: string | number, boundaries: Boundaries): Table {
        const col = this.getCol(label);

        if (!(col instanceof NumberColumn)) {
            throw new Error('Dropping outliers by boundaries is only supported on numeric columns!');
        }

        const validIndices = col.filterIndicesByBoundaries(boundaries);
        return this.newTableByIndices(validIndices);
    }

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

    public covariance(labels: string[], printed: boolean = false): number[][] {
        return this.createStatMatrix(labels, covariance, 'covariance', printed);
    }

    public correlation(labels: string[], printed: boolean = false): number[][] {
        return this.createStatMatrix(labels, correlation, 'correlation', printed);
    }

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