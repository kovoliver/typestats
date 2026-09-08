import { Boundaries, ColInfo, ColType, ColumnInfo, ImputeType, PercentMode } from '../types/types.js';
import { displayDateString, firstNTypeCheck, hasEmptyValues, isBool, isEmpty, isNanNullUndefined, isNumeric, only01 } from '../utils/utils.js';
import NumberColumn from './NumberColumn.js';
import BoolColumn from './BoolColumn.js';
import StringColumn from './StringColumn.js';
import GroupedTable from './GroupedTable.js';
import Column from './Column.js';
import DateColumn from './DateColumn.js';
import { isDate } from '../utils/utils.js';
import { toNumberArray, toBoolArray, toDateArray, toStringArray }
    from '../utils/utils.js';
import { getIqrBoundaries, replaceEmptyValues, replaceOutliers } from '../dataPreparation/dataPreparation.js';

type AnyColumn = NumberColumn & StringColumn & BoolColumn & DateColumn;

export default class Table {
    private readonly _originalValues: any[][];
    private readonly _processedValues: (number | (boolean | null) | (string | null) | (Date | null))[][];
    private readonly _colInfos: ColInfo[];

    constructor(
        originalValues: any[][],
        colInfos: ColInfo[],
        processedValues?: any[][],
        isTrustedSource: boolean = true,
    ) {
        if (isTrustedSource) {
            this._originalValues = originalValues;
            this._colInfos = colInfos;
        } else {
            this._originalValues = originalValues.map(col => [...col]);
            this._colInfos = colInfos.map(info => ({ ...info }));
        }

        if (processedValues) {
            this._processedValues = processedValues;
        } else {
            this._processedValues = this.processValues(this._originalValues, this._colInfos);
        }
    }

    public get originalTable(): any[][] {
        return this._originalValues.map(col => [...col]);
    }

    public get processedValues(): any[][] {
        return this._processedValues.map(col => [...col]);
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

    private processValues(values: any[][], colInfos: ColInfo[]) {
        const colCount = values.length;
        const processedValues: any[][] = new Array(colCount);

        for (let i = 0; i < colCount; i++) {
            const rawCol = values[i];
            const type = colInfos[i]?.type ?? this.getColType(rawCol);
            if (colInfos[i]) colInfos[i].type = type;

            switch (type) {
                case 'number':
                    processedValues[i] = toNumberArray(rawCol);
                    break;
                case 'bool':
                    processedValues[i] = toBoolArray(rawCol);
                    break;
                case 'date':
                    processedValues[i] = toDateArray(rawCol);
                    break;
                case 'string':
                default:
                    processedValues[i] = toStringArray(rawCol);
                    break;
            }
        }

        return processedValues;
    }

    private createColumnFromData(values: any[], colInfo: ColInfo): AnyColumn {
        const type = colInfo.type ?? this.getColType(values);

        switch (type) {
            case 'number':
                return new NumberColumn(values, colInfo.label) as AnyColumn;
            case 'bool':
                return new BoolColumn(values, colInfo.label) as AnyColumn;
            case 'date':
                return new DateColumn(values, colInfo.label) as AnyColumn;
            case 'string':
            default:
                return new StringColumn(values, colInfo.label) as AnyColumn;
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
        const values = [...this._processedValues[index]];
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

        if (index === undefined || index < 0 || index >= this._processedValues.length) {
            throw new Error(`The provided identifier (${identifier}) does not exist!`);
        }

        return index;
    }

    public getOriginal(identifier: number | string): any[] {
        const index = this.getIndex(identifier);
        return [...this._originalValues[index]];
    }

    private getColType(col: any[], colType?: ColType): ColType {
        if (colType) return colType;

        if (firstNTypeCheck(col, 10, isBool)) return 'bool';
        if (firstNTypeCheck(col, 10, isNumeric)) return 'number';
        if (firstNTypeCheck(col, 10, isDate)) return 'date';

        return 'string';
    }

    public get rowCount(): number {
        if (this._processedValues.length === 0) return 0;
        return this._processedValues[0].length;
    }

    public print(from?: number, to?: number, maxCols: number = 7): void {
        const totalRows = this.rowCount;
        const totalCols = this._processedValues.length;
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
                const rawVal = this._processedValues[colIndex][rowIndex];

                let displayVal: any;

                if (rawVal === undefined) displayVal = '<undefined>';
                else if (rawVal === null) displayVal = '<null>';
                else if (typeof rawVal === 'number' && Number.isNaN(rawVal)) displayVal = '<NaN>';
                else if (info.type === 'date') {
                    displayVal = displayDateString((rawVal as Date)) ?? '<null>';
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
                values: this._processedValues[index]
            };
        });

        const rowCount = this.rowCount;
        const groups: Record<string, Record<string, any[]>> = {};

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const compositeKey = targetCols
                .map(col => String(col.values[rowIndex]))
                .join('___');

            if (!groups[compositeKey]) {
                groups[compositeKey] = {};

                for (let i = 0; i < this._colInfos.length; i++) {
                    groups[compositeKey][this._colInfos[i].label] = [];
                }
            }

            for (let i = 0; i < this._colInfos.length; i++) {
                groups[compositeKey][this._colInfos[i].label].push(this._processedValues[i][rowIndex]);
            }
        }

        return new GroupedTable(groups);
    }

    private newTableByIndices(indices: Int32Array): Table {
        const rowCount = indices.length;
        const colCount = this._processedValues.length;

        const newOriginal: unknown[][] = new Array(colCount);
        const newProcessed: unknown[][] = new Array(colCount);

        for (let c = 0; c < colCount; c++) {
            const origCol = this._originalValues[c];
            const procCol = this._processedValues[c];

            const targetOrig = new Array(rowCount);
            const targetProc = new Array(rowCount);

            for (let r = 0; r < rowCount; r++) {
                const idx = indices[r];
                targetOrig[r] = origCol[idx];
                targetProc[r] = procCol[idx];
            }

            newOriginal[c] = targetOrig;
            newProcessed[c] = targetProc;
        }

        const colInfos = this._colInfos.map(info => ({ ...info }));

        return new Table(newOriginal, colInfos, newProcessed);
    }

    private orderBy(labels: string[], type: 'asc' | 'desc'): Table {
        const length = this.rowCount;

        const indices = new Int32Array(length);
        for (let i = 0; i < length; i++) {
            indices[i] = i;
        }

        const columnsData = labels.map(label => {
            const colIdx = this.getIndex(label);
            return this._processedValues[colIdx];
        });

        const dir = type === 'asc' ? 1 : -1;
        const numCols = columnsData.length;

        indices.sort((a, b) => {
            for (let i = 0; i < numCols; i++) {
                const col = columnsData[i];
                const firstVal = col[a];
                const secondVal = col[b];

                if (firstVal === secondVal) continue;
                if (firstVal === null || firstVal === undefined) return 1 * dir;
                if (secondVal === null || secondVal === undefined) return -1 * dir;

                if (typeof firstVal === 'number' && typeof secondVal === 'number') {
                    return (firstVal - secondVal) * dir;
                }

                if (typeof firstVal === 'string' && typeof secondVal === 'string') {
                    return (firstVal < secondVal ? -1 : 1) * dir;
                }

                if (firstVal instanceof Date && secondVal instanceof Date) {
                    return (firstVal.getTime() - secondVal.getTime()) * dir;
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

        const targetCols: unknown[][] = new Array(labelCount);
        for (let i = 0; i < labelCount; i++) {
            const colIdx = this.getIndex(labels[i]);
            targetCols[i] = this._processedValues[colIdx];
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
        const colIdx = this.getIndex(label);
        const colData = this._processedValues[colIdx];
        const len = colData.length;

        if (len === 0) {
            return this.newTableByIndices(new Int32Array(0));
        }

        const matchingIndices = new Int32Array(len);
        let matchCount = 0;

        for (let i = 0; i < len; i++) {
            if (fn(colData[i])) {
                matchingIndices[matchCount++] = i;
            }
        }

        return this.newTableByIndices(matchingIndices.subarray(0, matchCount));
    }

    private getColsByIndices(indices: number[]): Table {
        if (indices.length === 0) {
            throw new Error('You must provide at least one index!');
        }

        const origCols = indices.map(index => [...this._originalValues[index]]);
        const procCols = indices.map(index => [...this._processedValues[index]]);
        const colInfos = indices.map(index => ({ ...this._colInfos[index] }));

        return new Table(origCols, colInfos, procCols);
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

        for (let i = 0; i < this._processedValues.length; i++) {
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
        return this.addColumnAt(values, colInfo, this._processedValues.length);
    }

    public addColumnAt(values: any[], colInfo: ColInfo, index: number): Table {
        if (index < 0 || index > this._processedValues.length) {
            throw new Error('The given index is invalid!');
        }

        if (values.length !== this.rowCount && this.rowCount !== 0) {
            throw new Error(
                `The provided values length (${values.length}) does not match table row count (${this.rowCount})!`
            );
        }

        const info = { ...colInfo };
        if (!info.type) {
            info.type = this.getColType(values);
        }

        const newOrig = this._originalValues.map(c => [...c]);
        const newProc = this._processedValues.map(c => [...c]);
        const newInfos = this._colInfos.map(i => ({ ...i }));

        newOrig.splice(index, 0, [...values]);
        newProc.splice(index, 0, [...values]);
        newInfos.splice(index, 0, info);

        return new Table(newOrig, newInfos, newProc);
    }

    public dropNa(label: string | number): Table {
        const col = this.getCol(label);
        const validIndices = col.getValidIndices();
        return this.newTableByIndices(validIndices);
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

    public fillNaNumeric(label: string | number, type: ImputeType): Table {
        const targetCol = this.getCol(label) as NumberColumn;

        if (!(targetCol instanceof NumberColumn)) {
            throw new Error('Statistical imputation (MEAN, MEDIAN, MODE) is only applicable to numeric columns!');
        }

        const targetIndex = this.getIndex(label);
        const imputedValues = replaceEmptyValues(targetCol.values as number[], type);

        const newProc = this._processedValues.map((col, idx) => {
            if (idx === targetIndex) return [...imputedValues];
            return [...col];
        });

        return new Table(this._originalValues, this._colInfos, newProc);
    }

    public replaceOutliers(
        label: string | number,
        type: ImputeType,
        boundaries: Boundaries
    ): Table {
        const targetCol = this.getCol(label) as NumberColumn;

        if (!(targetCol instanceof NumberColumn)) {
            throw new Error('Statistical imputation (MEAN, MEDIAN, MODE) is only applicable to numeric columns!');
        }

        const targetIndex = this.getIndex(label);
        const newCol = replaceOutliers((targetCol.values as number[]), type, boundaries);

        const newProc = this._processedValues.map((col, idx) => {
            if (idx === targetIndex) return [...newCol];
            return [...col];
        });

        return new Table(this._originalValues, this._colInfos, newProc);
    }

    public replaceOutliersIQR(
        label: string | number,
        type: ImputeType,
        multiplier: number = 1.5,
        percentMode: PercentMode = 'interpolated'
    ): Table {
        const targetCol = this.getCol(label) as NumberColumn;

        if (!(targetCol instanceof NumberColumn)) {
            throw new Error('Statistical imputation (MEAN, MEDIAN, MODE) is only applicable to numeric columns!');
        }

        const boundaries = getIqrBoundaries(targetCol.values as number[], multiplier, percentMode);
        const targetIndex = this.getIndex(label);
        const newCol = replaceOutliers(targetCol.values as number[], type, boundaries);

        const newProc = this._processedValues.map((col, idx) =>
            idx === targetIndex ? newCol : col
        );

        return new Table(this._originalValues, this._colInfos, newProc);
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

        const newProc = this._processedValues.map((col, idx) => {
            if (idx === targetIndex) return [...filledValues];
            return [...col];
        });

        return new Table(this._originalValues, this._colInfos, newProc);
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
        const sourceData = this._processedValues[colIndex];

        let newValues: any[] = [];

        try {
            newValues = sourceData.map(val => {
                if (isNanNullUndefined(val)) return val;
                return fn(val as any);
            });
        } catch {
            throw new Error(`The transformation function failed on column "${this._colInfos[colIndex].label}"!`);
        }

        const newType = this.getColType(newValues);
        const newColInfo: ColInfo = { label: newLabel, type: newType };

        return this.addColumnAt(newValues, newColInfo, colIndex + 1);
    }

    public applyColumn(
        identifier: string | number,
        fn: (val: number | boolean | string) => number | boolean | string
    ): Table {
        const index = this.getIndex(identifier);
        const sourceData = this._processedValues[index];

        let newValues: any[] = [];

        try {
            newValues = sourceData.map(val => {
                if (isNanNullUndefined(val)) return val;
                return fn(val as any);
            });
        } catch {
            throw new Error(`The transformation function failed on column "${this._colInfos[index].label}"!`);
        }

        const nonNullValues = newValues.filter(v => !isNanNullUndefined(v));
        const newType = nonNullValues.length > 0
            ? this.getColType(nonNullValues)
            : this._colInfos[index].type;

        this._processedValues[index] = newValues;
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
        const newValues: number[] = [];

        for (let row = 0; row < rowCount; row++) {
            let result = this._processedValues[colIndices[0]][row] as number;

            if (isNanNullUndefined(result)) {
                newValues.push(NaN);
                continue;
            }

            let hasError = false;

            for (let c = 1; c < colIndices.length; c++) {
                const nextVal = this._processedValues[colIndices[c]][row];

                if (isNanNullUndefined(nextVal)) {
                    hasError = true;
                    break;
                }

                switch (operation) {
                    case '+':
                        (result as number) += (nextVal as number);
                        break;
                    case '-':
                        (result as number) -= (nextVal as number);
                        break;
                    case '*':
                        (result as number) *= (nextVal as number);
                        break;
                    case '/':
                        if ((nextVal as number) === 0) {
                            hasError = true;
                        } else {
                            (result as number) /= (nextVal as number);
                        }
                        break;
                }

                if (hasError) break;
            }

            newValues.push(hasError ? NaN : result);
        }

        const newColInfo: ColInfo = { label: newLabel, type: 'number' };
        return this.addColumnLast(newValues, newColInfo);
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
                const val = this._processedValues[idx][row];

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

    public describe(): void {
        console.log(`================================================================================`);
        console.log(`=================================TABLE SUMMARY==================================`);
        console.log(`================================================================================`);
        console.log(`Shape: ${this.rowCount} rows x ${this._processedValues.length} columns\n`);
        console.log(`--- Column Overview ---`);

        const totalRows = this.rowCount;
        const columnInfos: ColumnInfo[] = [];

        for (let i = 0; i < this._processedValues.length; i++) {
            const col = this.getCol(i);
            const missing = col.countMissing();
            const valid = col.countValid();

            const missingPercent = totalRows > 0
                ? Number(((missing / totalRows) * 100).toFixed(2))
                : 0;

            columnInfos.push({
                columnName: col.label,
                type: this._colInfos[i].type ?? 'string',
                missingCount: missing,
                validCount: valid,
                missingPercent: `${missingPercent}%`
            });
        }

        console.table(columnInfos);

        const numericStats: Record<string, unknown>[] = [];
        const dateStats: Record<string, unknown>[] = [];

        for (let i = 0; i < this._processedValues.length; i++) {
            const col = this.getCol(i);

            if (col instanceof NumberColumn) {
                numericStats.push({
                    columnName: col.label,
                    mean: Number(col.mean().toFixed(2)),
                    std: Number(col.std().toFixed(2)),
                    min: col.min(),
                    median: Number(col.median().toFixed(2)),
                    max: col.max()
                });
            }

            if (col instanceof DateColumn) {
                dateStats.push({
                    columnName: col.label,
                    min: displayDateString((col as DateColumn).min()),
                    max: displayDateString((col as DateColumn).max())
                });
            }
        }

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
        const colCount = this._processedValues.length;

        for (let row = 0; row < rowCount; row++) {
            const obj: Record<string, any> = {};

            for (let col = 0; col < colCount; col++) {
                obj[this._colInfos[col].label] = this._processedValues[col][row];
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
            const rowValues = this._processedValues.map(col => {
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
        const colCount = this._processedValues.length;
        const rowCount = this.rowCount;

        for (let row = 0; row < rowCount; row++) {
            const rowData: any[] = [];

            for (let col = 0; col < colCount; col++) {
                rowData.push(this._processedValues[col][row]);
            }

            matrix.push(rowData);
        }

        return matrix;
    }
}