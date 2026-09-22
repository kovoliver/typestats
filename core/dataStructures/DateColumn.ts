import { TimeUnit } from "../types/types.js";
import { isInteger } from "../utils/numberUtils.js";
import { displayDateString, isValidTimestamp, toUnixTimestampArray } from "../utils/utils.js";
import Column from "./Column.js";

/**
 * Represents a column of Date values optimized for statistical analysis and data transformation.
 * 
 * @remarks
 * All internal operations, comparisons, truncations, and getters (e.g., `getYear`, `getMonth`) 
 * strictly use **UTC** time to ensure consistent and reproducible analytical results across 
 * different server environments and client timezones.
 */
export default class DateColumn extends Column<Date> {
    private readonly _months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ] as const;

    private readonly _daysOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ] as const;

    private get _typedValues(): Float64Array {
        return this._values as Float64Array;
    }

    public override get values(): (Date | null)[] {
        const values = this._typedValues;
        const len = values.length;
        const result: (Date | null)[] = new Array(len);

        for (let i = 0; i < len; i++) {
            const ts = values[i];
            result[i] = Number.isNaN(ts) ? null : new Date(ts);
        }

        return result;
    }

    protected prepareData(rawValues: unknown[]): Float64Array {
        return toUnixTimestampArray(rawValues);
    }

    public isValid(value: unknown): boolean {
        if (typeof value !== 'number' || Number.isNaN(value)) return false;
        return isValidTimestamp(value);
    }

    /**
     * Returns the Date object at the specified index, or null if missing.
     * @param index - Zero-based row index.
     * @returns The Date instance or null.
     * @throws {Error} If the index is not a valid integer or out of bounds.
     */
    public getElementByIndex(index: number): Date | null {
        const values = this._typedValues;
        if (!isInteger(index) || index < 0 || index >= values.length) {
            throw new Error('You must provide a valid index!');
        }

        const timestamp = values[index];
        return !Number.isNaN(timestamp) ? new Date(timestamp) : null;
    }

    /**
     * Returns the full year (e.g., 2023) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns The year as a four-digit number, or null if missing.
     * @note Operates strictly in UTC.
     */
    public getYear(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getUTCFullYear() : null;
    }

    /**
     * Returns the 1-based month index (1–12) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Month number (1–12) or null if missing.
     * @note Operates strictly in UTC.
     */
    public getMonth(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getUTCMonth() + 1 : null;
    }

    /**
     * Returns the English name of the month (e.g., 'January') for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Full month name or null if missing.
     * @note Operates strictly in UTC.
     */
    public getMonthName(index: number): string | null {
        const d = this.getElementByIndex(index);
        return d ? this._months[d.getUTCMonth()] : null;
    }

    /**
     * Returns the day of the month (1–31) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Day of the month or null if missing.
     * @note Operates strictly in UTC.
     */
    public getDayOfTheMonth(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getUTCDate() : null;
    }

    /**
     * Returns the day of the week index (0 for Sunday, 1 for Monday, etc.) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Day index (0–6) or null if missing.
     * @note Operates strictly in UTC.
     */
    public getDay(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getUTCDay() : null;
    }

    /**
     * Returns the English name of the day of the week (e.g., 'Monday') for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Full day name or null if missing.
     * @note Operates strictly in UTC.
     */
    public getDayOfTheWeek(index: number): string | null {
        const d = this.getElementByIndex(index);
        return d ? this._daysOfWeek[d.getUTCDay()] : null;
    }

    /**
     * Returns the hour (0–23) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Hour value (0–23) or null if missing.
     * @note Operates strictly in UTC.
     */
    public getHours(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getUTCHours() : null;
    }

    /**
     * Returns the minute (0–59) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Minute value (0–59) or null if missing.
     * @note Operates strictly in UTC.
     */
    public getMinutes(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getUTCMinutes() : null;
    }

    /**
     * Returns the second (0–59) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Second value (0–59) or null if missing.
     * @note Operates strictly in UTC.
     */
    public getSeconds(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getUTCSeconds() : null;
    }

    /**
     * Returns the millisecond (0–999) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Millisecond value (0–999) or null if missing.
     * @note Operates strictly in UTC.
     */
    public getMilliseconds(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getUTCMilliseconds() : null;
    }

    /**
     * Compares two Date objects.
     * @param d1 - First Date object.
     * @param d2 - Second Date object.
     * @returns -1 if d1 < d2, 1 if d1 > d2, or 0 if equal.
     * @throws {Error} If either date is null.
     */
    public compareTwoDates(d1: Date | null, d2: Date | null): number {
        if (d1 === null || d2 === null) {
            throw new Error('One of the dates are invalid!');
        }

        if (d1 < d2) return -1;
        if (d1 > d2) return 1;
        return 0;
    }

    /**
     * Compares the dates at two specified row indices within the column.
     * @param index1 - First row index.
     * @param index2 - Second row index.
     * @returns -1 if date1 < date2, 1 if date1 > date2, or 0 if equal.
     * @throws {Error} If either index contains a null date.
     */
    public compare(index1: number, index2: number): number {
        const d1 = this.getElementByIndex(index1);
        const d2 = this.getElementByIndex(index2);
        return this.compareTwoDates(d1, d2);
    }

    /**
     * Compares the date at a specified row index with an external Date object.
     * @param index1 - Zero-based row index.
     * @param d2 - Target Date object to compare against.
     * @returns -1 if column date < d2, 1 if column date > d2, or 0 if equal.
     * @throws {Error} If either date is null.
     */
    public compareDates(index1: number, d2: Date): number {
        const d1 = this.getElementByIndex(index1);
        return this.compareTwoDates(d1, d2);
    }

    private toMs(unit: TimeUnit): number {
        switch (unit) {
            case 'seconds':
                return 1000;
            case 'minutes':
                return 1000 * 60;
            case 'hours':
                return 1000 * 3600;
            case 'days':
                return 1000 * 3600 * 24;
        }

        return 1;
    }

    /**
     * Calculates the time difference between the dates at two row indices (date1 - date2).
     * @param index1 - First row index.
     * @param index2 - Second row index.
     * @param unit - Time unit for the output ('milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years').
     * @returns Truncated integer difference in specified unit.
     * @throws {Error} If either date is null or unit is invalid.
     */
    public getDiff(index1: number, index2: number, unit: TimeUnit): number {
        const d1 = this.getElementByIndex(index1);
        const d2 = this.getElementByIndex(index2);

        if (d1 === null || d2 === null) {
            throw new Error("One of the dates is invalid at the given indices!");
        }

        const divider = this.toMs(unit);

        if (['milliseconds', 'seconds', 'minutes', 'hours', 'days'].includes(unit)) {
            return Math.trunc((d1.getTime() - d2.getTime()) / divider);
        }

        switch (unit) {
            case 'months':
                return (
                    (d1.getUTCFullYear() - d2.getUTCFullYear()) * 12 +
                    (d1.getUTCMonth() - d2.getUTCMonth())
                );

            case 'years':
                return d1.getUTCFullYear() - d2.getUTCFullYear();
        }

        throw new Error("Invalid 'unit' argument: '" + unit + "'");
    }

    private addOrSubtract(index: number, amount: number, unit: TimeUnit): Date | null {
        const d = this.getElementByIndex(index);

        if (!isInteger(amount)) {
            throw new Error("You must provide a valid 'amount' argument!");
        }

        if (d === null) {
            return null;
        }

        if (['milliseconds', 'seconds', 'minutes', 'hours', 'days'].includes(unit)) {
            const addition = this.toMs(unit) * amount;
            return new Date(d.getTime() + addition);
        }

        switch (unit) {
            case 'months':
                return new Date(Date.UTC(
                    d.getUTCFullYear(),
                    d.getUTCMonth() + amount,
                    d.getUTCDate(),
                    d.getUTCHours(),
                    d.getUTCMinutes(),
                    d.getUTCSeconds(),
                    d.getUTCMilliseconds()
                ));

            case 'years':
                return new Date(Date.UTC(
                    d.getUTCFullYear() + amount,
                    d.getUTCMonth(),
                    d.getUTCDate(),
                    d.getUTCHours(),
                    d.getUTCMinutes(),
                    d.getUTCSeconds(),
                    d.getUTCMilliseconds()
                ));
        }

        throw new Error("Invalid 'unit' argument: '" + unit + "'");
    }

    /**
     * Adds a specified amount of time units to the date at the given index.
     * @param index - Zero-based row index.
     * @param amount - Integer amount to add (can be negative).
     * @param unit - Time unit to add.
     * @returns A new Date object or null if source value is missing.
     * @throws {Error} If amount is not a valid integer or unit is invalid.
     */
    public add(index: number, amount: number, unit: TimeUnit): Date | null {
        return this.addOrSubtract(index, amount, unit);
    }

    /**
     * Subtracts a specified amount of time units from the date at the given index.
     * @param index - Zero-based row index.
     * @param amount - Integer amount to subtract.
     * @param unit - Time unit to subtract.
     * @returns A new Date object or null if source value is missing.
     * @throws {Error} If amount is not a valid integer or unit is invalid.
     */
    public subtract(index: number, amount: number, unit: TimeUnit): Date | null {
        return this.addOrSubtract(index, -amount, unit);
    }

    /**
     * Formats the date at the specified index using a custom pattern string.
     * Tokens must strictly follow chronological order ('y', 'M', 'd', 'h', 'm', 's') and include 'y', 'M', and 'd'.
     * @param index - Zero-based row index.
     * @param pattern - Pattern string (e.g., 'yyyy-MM-dd hh:mm:ss').
     * @returns Formatted date string.
     * @throws {Error} If date is null or pattern format/order is invalid.
     */
    public format(index: number, pattern: string): string {
        const d = this.getElementByIndex(index);

        if (d === null) {
            throw new Error('The date is invalid at the given index!');
        }

        const parts = pattern.split(/([yMdhms]+)/).filter(Boolean);
        const tokens = parts.filter(part => /^[yMdhms]+$/.test(part));

        const order = ['y', 'M', 'd', 'h', 'm', 's'];
        let previousIndex = -1;

        for (const token of tokens) {
            const type = token[0];
            const currentIndex = order.indexOf(type);

            if (currentIndex === -1 || currentIndex <= previousIndex) {
                throw new Error(
                    'Invalid date format! Components must be in the order y, M, d, h, m, s.'
                );
            }

            previousIndex = currentIndex;
        }

        if (
            tokens.length < 3 ||
            tokens[0][0] !== 'y' ||
            tokens[1][0] !== 'M' ||
            tokens[2][0] !== 'd'
        ) {
            throw new Error(
                'Invalid date format! The format must contain y, M and d in this order.'
            );
        }

        const values: Record<string, string> = {
            yyyy: d.getUTCFullYear().toString(),
            yy: d.getUTCFullYear().toString().slice(-2),
            MM: (d.getUTCMonth() + 1).toString().padStart(2, '0'),
            M: (d.getUTCMonth() + 1).toString(),
            dd: d.getUTCDate().toString().padStart(2, '0'),
            d: d.getUTCDate().toString(),
            hh: d.getUTCHours().toString().padStart(2, '0'),
            mm: d.getUTCMinutes().toString().padStart(2, '0'),
            ss: d.getUTCSeconds().toString().padStart(2, '0'),
        };

        return pattern.replace(/yyyy|yy|MM|M|dd|d|hh|mm|ss/g, match => values[match] || match);
    }

    private order(mode: 'asc' | 'desc'): DateColumn {
        const values = this._typedValues;
        const len = values.length;
        const validIndices = this.getValidIndices();
        const invalidIndices = this.getInvalidIndices();

        const validCount = validIndices.length;
        const validTs = new Float64Array(validCount);

        for (let i = 0; i < validCount; i++) {
            validTs[i] = values[validIndices[i]];
        }

        validTs.sort();

        if (mode === 'desc') {
            validTs.reverse();
        }

        const resultTs = new Float64Array(len);
        resultTs.set(validTs, 0);

        for (let i = 0; i < invalidIndices.length; i++) {
            resultTs[validCount + i] = NaN;
        }

        return new DateColumn(resultTs, this._label, true);
    }

    /**
     * Returns a new DateColumn with entries sorted in ascending chronological order.
     * Null values are placed at the end of the sorted column.
     * @returns A new sorted DateColumn instance.
     */
    public orderAsc(): DateColumn {
        return this.order('asc');
    }

    /**
     * Returns a new DateColumn with entries sorted in descending chronological order.
     * Null values are placed at the end of the sorted column.
     * @returns A new sorted DateColumn instance.
     */
    public orderDesc(): DateColumn {
        return this.order('desc');
    }

    /**
     * Finds the earliest valid Date in the column.
     * @returns The earliest Date instance or null if no valid dates exist.
     */
    public min(): Date | null {
        let minTs: number | null = null;
        const values = this._typedValues;
        const len = values.length;

        for (let i = 0; i < len; i++) {
            const ts = values[i];

            if (Number.isNaN(ts)) continue;

            if (minTs === null || ts < minTs) {
                minTs = ts;
            }
        }

        return minTs === null ? null : new Date(minTs);
    }

    /**
     * Finds the latest valid Date in the column.
     * @returns The latest Date instance or null if no valid dates exist.
     */
    public max(): Date | null {
        let maxTs: number | null = null;
        const values = this._typedValues;
        const len = values.length;

        for (let i = 0; i < len; i++) {
            const ts = values[i];

            if (Number.isNaN(ts)) continue;

            if (maxTs === null || ts > maxTs) {
                maxTs = ts;
            }
        }

        return maxTs === null ? null : new Date(maxTs);
    }

    /**
     * Finds both the earliest and latest valid dates in the column in a single pass.
     * @returns Object containing 'min' and 'max' Date properties or null values.
     */
    public range(): { min: Date | null; max: Date | null } {
        let minTs: number | null = null;
        let maxTs: number | null = null;
        const values = this._typedValues;
        const len = values.length;

        for (let i = 0; i < len; i++) {
            const ts = values[i];

            if (Number.isNaN(ts)) continue;

            if (minTs === null || ts < minTs) minTs = ts;
            if (maxTs === null || ts > maxTs) maxTs = ts;
        }

        return {
            min: minTs === null ? null : new Date(minTs),
            max: maxTs === null ? null : new Date(maxTs)
        };
    }

    /**
     * Filters rows falling within a specified inclusive date range [start, end].
     * @param start - Start boundary Date.
     * @param end - End boundary Date.
     * @returns A new DateColumn with matching rows.
     */
    public filterRange(start: Date, end: Date): DateColumn {
        const startTs = start.getTime();
        const endTs = end.getTime();
        const values = this._typedValues;
        const len = values.length;

        const indices = new Int32Array(len);
        let count = 0;

        for (let i = 0; i < len; i++) {
            const ts = values[i];
            if (!Number.isNaN(ts)) {
                if (ts >= startTs && ts <= endTs) {
                    indices[count++] = i;
                }
            }
        }

        const filtered = new Float64Array(count);
        for (let i = 0; i < count; i++) {
            filtered[i] = values[indices[i]];
        }

        return new DateColumn(filtered, this._label, true);
    }

    /**
     * Truncates (floors) all dates down to the beginning of the specified time unit.
     * @param unit - Time unit to floor to ('seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years').
     * @returns A new DateColumn with floored dates.
     */
    public floor(unit: TimeUnit): DateColumn {
        const values = this._typedValues;
        const len = values.length;
        const newValues = new Float64Array(len);

        for (let i = 0; i < len; i++) {
            const timestamp = values[i];
            if (Number.isNaN(timestamp)) {
                newValues[i] = NaN;
                continue;
            }

            const res = new Date(timestamp);

            if (unit === 'seconds') res.setUTCMilliseconds(0);
            else if (unit === 'minutes') res.setUTCSeconds(0, 0);
            else if (unit === 'hours') res.setUTCMinutes(0, 0, 0);
            else if (unit === 'days') res.setUTCHours(0, 0, 0, 0);
            else if (unit === 'months') { res.setUTCDate(1); res.setUTCHours(0, 0, 0, 0); }
            else if (unit === 'years') { res.setUTCMonth(0, 1); res.setUTCHours(0, 0, 0, 0); }

            newValues[i] = res.getTime();
        }

        return new DateColumn(newValues, this._label, true);
    }

    /**
     * Calculates element-wise time differences between this column and another DateColumn (this - other).
     * @param other - Target DateColumn to subtract.
     * @param unit - Time unit for difference calculations.
     * @returns Array containing numeric differences or null values.
     * @throws {Error} If column lengths do not match.
     */
    public diffColumn(other: DateColumn, unit: TimeUnit): (number | null)[] | Float64Array {
        const values1 = this._typedValues;
        const values2 = other._typedValues;

        if (values1.length !== values2.length) {
            throw new Error('Columns must have the same length!');
        }

        const len = values1.length;

        if (['milliseconds', 'seconds', 'minutes', 'hours', 'days'].includes(unit)) {
            const result = new Float64Array(len);
            const divider = this.toMs(unit);

            for (let i = 0; i < len; i++) {
                const ts1 = values1[i];
                const ts2 = values2[i];

                if (Number.isNaN(ts1) || Number.isNaN(ts2)) {
                    result[i] = NaN;
                } else {
                    result[i] = Math.trunc((ts1 - ts2) / divider);
                }
            }
            return result;
        }

        const result: (number | null)[] = new Array(len);
        for (let i = 0; i < len; i++) {
            const d1 = this.getElementByIndex(i);
            const d2 = other.getElementByIndex(i);

            if (!d1 || !d2) {
                result[i] = null;
                continue;
            }

            switch (unit) {
                case 'months':
                    result[i] = (
                        (d1.getUTCFullYear() - d2.getUTCFullYear()) * 12 +
                        (d1.getUTCMonth() - d2.getUTCMonth())
                    );
                    break;
                case 'years':
                    result[i] = d1.getUTCFullYear() - d2.getUTCFullYear();
                    break;
                default:
                    result[i] = null;
            }
        }

        return result;
    }

    public displayString(index: number): string | null {
        const d = this.getElementByIndex(index);
        return displayDateString(d);
    }
}