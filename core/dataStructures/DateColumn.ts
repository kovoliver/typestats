import { TimeUnit } from "../types/types.js";
import { isInteger, orderDesc } from "../utils/numberUtils.js";
import { getFirstNonEmtpy } from "../utils/utils.js";
import Column from "./Column.js";

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

    /**
     * Creates a new DateColumn instance from raw input data.
     * @param rawValues - Array of raw input items (string, number, Date, or null/undefined).
     * @param label - Unique identifier/name for the column.
     */
    constructor(rawValues: unknown[], label: string) {
        super(rawValues, label);
    }

    protected prepareData(rawValues: unknown[]): (Date | null)[] {
        return rawValues.map(val => {
            if (val instanceof Date) {
                return this.isValid(val) ? val : null;
            }

            if (typeof val === 'string' || typeof val === 'number') {
                const d = new Date(val);
                return this.isValid(d) ? d : null;
            }

            return null;
        });
    }

    protected isValid(value: Date | null): boolean {
        return value instanceof Date && !isNaN(value.getTime());
    }

    /**
     * Returns the Date object at the specified index, or null if missing.
     * @param index - Zero-based row index.
     * @returns The Date instance or null.
     * @throws {Error} If the index is not a valid integer or out of bounds.
     */
    public getElementByIndex(index: number): Date | null {
        if (!isInteger(index) || index < 0 || index >= this._values.length) {
            throw new Error('You must provide a valid index!');
        }

        const d = this._values[index];
        return d;
    }

    /**
     * Returns the full year (e.g., 2023) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns The year as a four-digit number, or null if missing.
     */
    public getYear(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d?.getFullYear() : null;
    }

    /**
     * Returns the 1-based month index (1–12) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Month number (1–12) or null if missing.
     */
    public getMonth(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getMonth() + 1 : null;
    }

    /**
     * Returns the English name of the month (e.g., 'January') for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Full month name or null if missing.
     */
    public getMonthName(index: number): string | null {
        const d = this.getElementByIndex(index);
        return d ? this._months[d?.getMonth()] : null;
    }

    /**
     * Returns the day of the month (1–31) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Day of the month or null if missing.
     */
    public getDayOfTheMonth(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getDate() : null;
    }

    /**
     * Returns the day of the week index (0 for Sunday, 1 for Monday, etc.) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Day index (0–6) or null if missing.
     */
    public getDay(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getDay() : null;
    }

    /**
     * Returns the English name of the day of the week (e.g., 'Monday') for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Full day name or null if missing.
     */
    public getDayOfTheWeek(index: number): string | null {
        const d = this.getElementByIndex(index);
        return d ? this._daysOfWeek[d.getDay()] : null;
    }

    /**
     * Returns the hour (0–23) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Hour value (0–23) or null if missing.
     */
    public getHours(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getHours() : null;
    }

    /**
     * Returns the minute (0–59) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Minute value (0–59) or null if missing.
     */
    public getMinutes(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getMinutes() : null;
    }

    /**
     * Returns the second (0–59) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Second value (0–59) or null if missing.
     */
    public getSeconds(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getSeconds() : null;
    }

    /**
     * Returns the millisecond (0–999) for the date at the specified index.
     * @param index - Zero-based row index.
     * @returns Millisecond value (0–999) or null if missing.
     */
    public getMilliseconds(index: number): number | null {
        const d = this.getElementByIndex(index);
        return d ? d.getMilliseconds() : null;
    }

    /**
     * Compares two Date objects.
     * @param d1 - First Date object.
     * @param d2 - Second Date object.
     * @returns -1 if d1 < d2, 1 if d1 > d2, or 0 if equal.
     * @throws {Error} If either date is null.
     */
    public compareTwoDates(d1: Date | null, d2: Date | null) {
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
    public compareDates(index1: number, d2: Date) {
        const d1 = this.getElementByIndex(index1);
        return this.compareTwoDates(d1, d2);
    }

    private toMs(unit: TimeUnit) {
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
    public getDiff(index1: number, index2: number, unit: TimeUnit) {
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
                    (d1.getFullYear() - d2.getFullYear()) * 12 +
                    (d1.getMonth() - d2.getMonth())
                );

            case 'years':
                return d1.getFullYear() - d2.getFullYear();
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
                return new Date(
                    d.getFullYear(),
                    d.getMonth() + amount,
                    d.getDate(),
                    d.getHours(),
                    d.getMinutes(),
                    d.getSeconds(),
                    d.getMilliseconds()
                );

            case 'years':
                return new Date(
                    d.getFullYear() + amount,
                    d.getMonth(),
                    d.getDate(),
                    d.getHours(),
                    d.getMinutes(),
                    d.getSeconds(),
                    d.getMilliseconds()
                );
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

        const values: Record<string, number> = {
            y: d.getFullYear(),
            M: d.getMonth() + 1,
            d: d.getDate(),
            h: d.getHours(),
            m: d.getMinutes(),
            s: d.getSeconds()
        };

        return parts
            .map(part => {
                if (/^[yMdhms]+$/.test(part)) {
                    return values[part[0]].toString().padStart(part.length, '0');
                }

                return part;
            })
            .join('');
    }

    private order(mode: 'asc' | 'desc'): DateColumn {
        const dates = this._values.toSorted((a, b) => {
            if (a === b) return 0;
            if (a === null) return 1;
            if (b === null) return -1;
            const diff = a.getTime() - b.getTime();
            return mode === 'asc' ? diff : -diff;
        });

        return new DateColumn(dates, this._label);
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
        let minDate: Date | null = null;

        for (const d of this._values) {
            if (d === null) continue;
            if (minDate === null || d < minDate) {
                minDate = d;
            }
        }

        return minDate;
    }

    /**
     * Finds the latest valid Date in the column.
     * @returns The latest Date instance or null if no valid dates exist.
     */
    public max(): Date | null {
        let maxDate: Date | null = null;

        for (const d of this._values) {
            if (d === null) continue;
            if (maxDate === null || d > maxDate) {
                maxDate = d;
            }
        }

        return maxDate;
    }

    /**
     * Finds both the earliest and latest valid dates in the column in a single pass.
     * @returns Object containing 'min' and 'max' Date properties or null values.
     */
    public range(): { min: Date | null; max: Date | null } {
        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        for (const d of this._values) {
            if (d === null) continue;

            if (minDate === null || d < minDate) {
                minDate = d;
            }
            if (maxDate === null || d > maxDate) {
                maxDate = d;
            }
        }

        return { min: minDate, max: maxDate };
    }

    /**
     * Filters rows falling within a specified inclusive date range [start, end].
     * @param start - Start boundary Date.
     * @param end - End boundary Date.
     * @returns A new DateColumn with matching rows.
     */
    public filterRange(start: Date, end: Date): DateColumn {
        const filtered = this._values.filter(d => d !== null && d >= start && d <= end);
        return new DateColumn(filtered, this._label);
    }

    /**
     * Truncates (floors) all dates down to the beginning of the specified time unit.
     * @param unit - Time unit to floor to ('seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years').
     * @returns A new DateColumn with floored dates.
     */
    public floor(unit: TimeUnit): DateColumn {
        const newValues = this._values.map(d => {
            if (!d) return null;
            const res = new Date(d);

            if (unit === 'seconds') res.setUTCMilliseconds(0);
            else if (unit === 'minutes') res.setUTCSeconds(0, 0);
            else if (unit === 'hours') res.setUTCMinutes(0, 0, 0);
            else if (unit === 'days') res.setUTCHours(0, 0, 0, 0);
            else if (unit === 'months') { res.setUTCDate(1); res.setUTCHours(0, 0, 0, 0); }
            else if (unit === 'years') { res.setUTCMonth(0, 1); res.setUTCHours(0, 0, 0, 0); }

            return res;
        });

        return new DateColumn(newValues, this._label);
    }

    /**
     * Calculates element-wise time differences between this column and another DateColumn (this - other).
     * @param other - Target DateColumn to subtract.
     * @param unit - Time unit for difference calculations.
     * @returns Array containing numeric differences or null values.
     * @throws {Error} If column lengths do not match.
     */
    public diffColumn(other: DateColumn, unit: TimeUnit): (number | null)[] {
        if (this._values.length !== other._values.length) {
            throw new Error('Columns must have the same length!');
        }
        return this._values.map((d1, i) => {
            const d2 = other._values[i];
            if (!d1 || !d2) return null;
            return Math.trunc((d1.getTime() - d2.getTime()) / this.toMs(unit));
        });
    }

    public displayString(index: number): string | null {
        const d = this.getElementByIndex(index);
        if (!d) return null;

        const hasTime =
            d.getUTCHours() !== 0 ||
            d.getUTCMinutes() !== 0 ||
            d.getUTCSeconds() !== 0 ||
            d.getUTCMilliseconds() !== 0;

        if (hasTime) {
            const iso = d.toISOString();
            return iso.replace('T', ' ').substring(0, 19);
        }

        return d.toISOString().split('T')[0];
    }
}