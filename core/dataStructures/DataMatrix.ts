import { chiSquaredIndependenceTest, oneWayAnova } from "../inference/hypothesis.js";
import { betweenSSD, chiSquare, cramerV, etaSquared, totalSSD, withinSSD }
    from "../statistics/bivariate.js";
import { mean } from "../statistics/univariate.js";
import { round } from "../utils/numberUtils.js";
import { isEmpty } from "../utils/utils.js";

export default class DataMatrix {
    private _values: number[][];
    private _colLabels: string[];
    private _rowLabels: string[] | undefined = undefined;

    constructor(values: number[][], colLabels: string[], rowLabels?: string[]) {
        if (values.length === 0) {
            throw new Error('You did not provide any values!');
        }

        const emptyLines = values.every(row => row.length === 0);

        if (emptyLines) {
            throw new Error('The lines you provided are empty!');
        }

        if (rowLabels && values.some(row => row.length !== values[0].length)) {
            throw new Error('All the rows must have the same number of values in the case of contingency tables!');
        }

        this._values = values;
        this._colLabels = colLabels;
        this._rowLabels = rowLabels;
    }

    public get rows() {
        return this._values.length > 0 ? this._values[0].length : 0;
    }

    public get cols() {
        return this._values.length;
    }

    /**
     * Calculates the arithmetic mean (average) of an array of numbers.
     *
     * @param values - Array of numerical values.
     * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
     * @returns The arithmetic mean.
     * @throws {Error} If `values` is empty.
     */
    public mainMean(): number {
        return mean(this._values.flat());
    }

    /**
     * Calculates the total Sum of Squared Deviations (SSD) for all elements in the table treated as a single dataset.
     *
     * @param table - 2D matrix of numerical values.
     * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
     * @returns The grand total sum of squared deviations.
     * @throws {Error} If the table structure is invalid.
     */
    public totalSSD(): number {
        return totalSSD(this._values);
    }

    /**
     * Calculates the within-group Sum of Squared Deviations (SSD) across the columns of a table.
     *
     * @param table - 2D matrix representing groups in columns.
     * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
     * @returns The total within-group sum of squared deviations.
     * @throws {Error} If the table structure is invalid.
     */
    public withinSSD(): number {
        return withinSSD(this._values);
    }

    /**
     * Calculates the between-group Sum of Squared Deviations (SSD) across the columns of a table.
     *
     * @param table - 2D matrix representing groups in columns.
     * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
     * @returns The between-group sum of squared deviations.
     * @throws {Error} If the table structure is invalid.
     */
    public betweenSSD(): number {
        return betweenSSD(this._values);
    }

    /**
     * Calculates the Eta Squared (η²) effect size coefficient, representing the proportion of variance explained by group membership.
     *
     * @param table - 2D matrix representing groups in columns.
     * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
     * @returns The Eta Squared value (between 0 and 1).
     */
    public etaSquared(): number {
        const totalSSD = this.totalSSD();

        if (totalSSD === 0) {
            throw new Error('Cannot calculate eta squared when total SSD is zero.');
        }

        return etaSquared(this._values);
    }

    public chiSquare(): number {
        return chiSquare(this._values);
    }
    
    /**
     * Calculates Cramér's V measure of association between two nominal variables in a contingency table.
     *
     * @param table - 2D matrix representing the contingency table.
     * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
     * @returns Cramér's V association coefficient (between 0 and 1).
     * @throws {Error} If the table structure is invalid.
     */
    public cramerV(): number {
        return cramerV(this._values);
    }

    /**
     * Performs a One-Way Analysis of Variance (ANOVA).
     * 
     * This test determines whether there are any statistically significant differences 
     * between the means of two or more independent (unrelated) groups.
     *
     * @param {number[][]} groups - An array of arrays, where each inner array represents an independent sample group.
     * @param {number} alpha - The significance level for the test (e.g., 0.05).
     * 
     * @returns {{ F: number, dfBetween: number, dfWithin: number, msBetween: number, msWithin: number, criticalBounds: { lower?: number, upper?: number }, passed: boolean }} 
     *          An object containing:
     *          - `F`: The calculated F-test statistic.
     *          - `dfBetween`: The degrees of freedom between groups (numerator).
     *          - `dfWithin`: The degrees of freedom within groups (denominator).
     *          - `msBetween`: The mean square between groups.
     *          - `msWithin`: The mean square within groups.
     *          - `criticalBounds`: The critical bounds object (will contain `upper` since ANOVA is a right-tailed test).
     *          - `passed`: `true` if the test statistic is less than or equal to the upper critical bound 
     *                      (fail to reject the null hypothesis of equal means), `false` otherwise.
     * 
     * @throws {Error} If there are fewer than 2 groups.
     * @throws {Error} If any group is empty.
     * @throws {Error} If the total number of observations is not greater than the number of groups.
     * @throws {Error} If the within-group variance (msWithin) is zero.
     */
    public oneWayAnova(alpha: number) {
        return oneWayAnova(this._values, alpha);
    }

    /**
     * Performs a Chi-squared test of independence.
     * 
     * This test determines whether two categorical variables are independent 
     * based on observed frequencies in a contingency table.
     *
     * @param {number[][]} contingencyTable - A 2D array representing the observed frequencies. 
     *                                        Must be at least a 2x2 matrix, and values must be non-negative.
     * @param {number} alpha - The significance level for the test (e.g., 0.05).
     * 
     * @returns {{ chi2: number, df: number, criticalBounds: { lower?: number, upper?: number }, passed: boolean }} 
     *          An object containing:
     *          - `chi2`: The calculated Chi-squared test statistic.
     *          - `df`: The degrees of freedom used for the test.
     *          - `criticalBounds`: The critical bounds object (will contain `upper` since it's a right-tailed test).
     *          - `passed`: `true` if the test statistic is less than or equal to the upper critical bound 
     *                      (fail to reject the null hypothesis of independence), `false` otherwise.
     * 
     * @throws {Error} If the contingency table has fewer than 2 rows or fewer than 2 columns.
     * @throws {Error} If the rows do not have a uniform number of columns.
     * @throws {Error} If any observed frequency is negative.
     * @throws {Error} If the total sum of the table is 0.
     * @throws {Error} If any calculated expected frequency is less than or equal to 0.
     * @see {@link https://www.itl.nist.gov/div898/handbook/eda/section3/eda35e.htm NIST e-Handbook: Chi-Square Two-Sample Test / Contingency Table}
     */
    public chiSquaredIndependenceTest(alpha: number) {
        return chiSquaredIndependenceTest(this._values, alpha);
    }

    /**
     * Prints the table data to the console in a tabular format.
     *
     * @param limit - Maximum number of rows to display. Defaults to 10.
     *                If the limit exceeds the number of rows, all rows are displayed.
     *                Negative values are treated as 0.
     */
    public printTable(limit: number = 10): void {
        const totalRows = this.rows;
        const safeLimit = Math.max(0, limit);
        const displayRows = Math.min(totalRows, safeLimit);

        const printObj: Record<number, Record<string, number | string>> = {};

        for (let i = 0; i < displayRows; i++) {
            printObj[i] = {};

            for (let j = 0; j < this.cols; j++) {
                const colLabel = this._colLabels[j];
                const val = round(this._values[j][i], 3);

                printObj[i][colLabel] = !isEmpty(val) ? val : "-";
            }
        }

        console.table(printObj);

        if (totalRows > displayRows) {
            console.log(`... Showing ${displayRows} of ${totalRows} rows`);
        }
    }

    /**
     * Prints the contingency table to the console in a tabular format.
     *
     * @throws {Error} If row labels are not available.
     */
    public printContingencyTable() {
        if (!this._rowLabels) {
            throw new Error('Row labels are required for printContingencyTable.');
        }

        const printObj: Record<string, Record<string, number>> = {};

        for (let i = 0; i < this.rows; i++) {
            const rowLabel = this._rowLabels[i];
            printObj[rowLabel] = {};

            for (let j = 0; j < this.cols; j++) {
                const colLabel = this._colLabels[j];
                printObj[rowLabel][colLabel] = round(this._values[j][i], 3);
            }
        }

        console.table(printObj);
    }
}