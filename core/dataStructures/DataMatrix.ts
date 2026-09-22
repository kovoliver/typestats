import { chiSquaredIndependenceTest, oneWayAnova } from "../inference/hypothesis.js";
import { betweenSSD, chiSquare, cramerV, etaSquared, totalSSD, withinSSD }
    from "../statistics/bivariate.js";
import { mean } from "../statistics/univariate.js";
import { round } from "../utils/numberUtils.js";
import { isEmpty } from "../utils/utils.js";

export default class DataMatrix {
    private _values: Float64Array[];
    private _colLabels: string[];
    private _rowLabels: string[] | undefined = undefined;

    constructor(values: Float64Array[], colLabels: string[], rowLabels?: string[]) {
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

    public get rows(): number {
        return this._values.length > 0 ? this._values[0].length : 0;
    }

    public get cols(): number {
        return this._values.length;
    }

    private getFlattenedValues(): Float64Array {
        let totalLen = 0;
        for (let i = 0; i < this._values.length; i++) {
            totalLen += this._values[i].length;
        }

        const flat = new Float64Array(totalLen);
        let offset = 0;
        for (let i = 0; i < this._values.length; i++) {
            flat.set(this._values[i], offset);
            offset += this._values[i].length;
        }

        return flat;
    }

    /**
     * Calculates the arithmetic mean (average) of an array of numbers.
     *
     * @returns The arithmetic mean.
     * @throws {Error} If `values` is empty.
     */
    public mainMean(): number {
        return mean(this.getFlattenedValues());
    }

    /**
     * Calculates the total Sum of Squared Deviations (SSD) for all elements in the table treated as a single dataset.
     *
     * @returns The grand total sum of squared deviations.
     * @throws {Error} If the table structure is invalid.
     */
    public totalSSD(): number {
        return totalSSD(this._values);
    }

    /**
     * Calculates the within-group Sum of Squared Deviations (SSD) across the columns of a table.
     *
     * @returns The total within-group sum of squared deviations.
     * @throws {Error} If the table structure is invalid.
     */
    public withinSSD(): number {
        return withinSSD(this._values);
    }

    /**
     * Calculates the between-group Sum of Squared Deviations (SSD) across the columns of a table.
     *
     * @returns The between-group sum of squared deviations.
     * @throws {Error} If the table structure is invalid.
     */
    public betweenSSD(): number {
        return betweenSSD(this._values);
    }

    /**
     * Calculates the Eta Squared (η²) effect size coefficient, representing the proportion of variance explained by group membership.
     *
     * @returns The Eta Squared value (between 0 and 1).
     */
    public etaSquared(): number {
        const total = this.totalSSD();

        if (total === 0) {
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
     * @returns Cramér's V association coefficient (between 0 and 1).
     * @throws {Error} If the table structure is invalid.
     */
    public cramerV(): number {
        return cramerV(this._values);
    }

    /**
     * Performs a One-Way Analysis of Variance (ANOVA).
     * 
     * @param {number} alpha - The significance level for the test (e.g., 0.05).
     */
    public oneWayAnova(alpha: number) {
        return oneWayAnova(this._values, alpha);
    }

    /**
     * Performs a Chi-squared test of independence.
     * 
     * @param {number} alpha - The significance level for the test (e.g., 0.05).
     */
    public chiSquaredIndependenceTest(alpha: number) {
        return chiSquaredIndependenceTest(this._values, alpha);
    }

    /**
     * Prints the table data to the console in a tabular format.
     *
     * @param limit - Maximum number of rows to display. Defaults to 10.
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
    public printContingencyTable(): void {
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