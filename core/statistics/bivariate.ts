import { clampSymmetric, orderAsc, rangeSequence, round } from "../utils/numberUtils.js";
import { mean, ssd, std } from "../statistics/univariate.js";
import { getDegreesOfFreedom } from "../statistics/univariate.js";

/**
 * Validates a 2D contingency table matrix to ensure it contains at least one row and one column.
 *
 * @param table - 2D matrix representing the contingency table.
 * @throws {Error} If the table is null/empty or contains empty rows.
 */
function validateTable(table: Float64Array[]): void {
    if (!table || table.length === 0) {
        throw new Error('The data table should contain at least one row!');
    }

    if (!table[0] || table[0].length === 0) {
        throw new Error('The data table should contain at least one column!');
    }
}

/**
 * Calculates the grand total sum of all values in a contingency table.
 *
 * @param table - 2D matrix representing the contingency table.
 * @returns The total sum of all elements in the table.
 * @throws {Error} If the table structure is invalid.
 */
export function totalCount(table: Float64Array[]): number {
    validateTable(table);
    let total = 0;
    for (let r = 0; r < table.length; r++) {
        const row = table[r];
        for (let c = 0; c < row.length; c++) {
            total += row[c];
        }
    }
    return total;
}

/**
 * Extracts a specific column from a 2D contingency table as a 1D array.
 *
 * @param table - 2D matrix representing the contingency table.
 * @param colNumber - Zero-based index of the column to extract.
 * @returns Array containing the values of the specified column.
 * @throws {Error} If the table structure is invalid or the column index is out of bounds.
 */
export function getColumn(table: Float64Array[], colNumber: number): Float64Array {
    validateTable(table);

    if (colNumber >= table[0].length) {
        throw new Error('The given column does not exist!');
    }

    const column = new Float64Array(table.length);

    for (let row = 0; row < table.length; row++) {
        column[row] = table[row][colNumber];
    }

    return column;
}

/**
 * Extracts all columns from a 2D contingency table as an array of column arrays (transposed matrix representation).
 *
 * @param table - 2D matrix representing the contingency table.
 * @returns 2D array where each inner array represents a column from the input table.
 * @throws {Error} If the table structure is invalid.
 */
export default function getColumns(table: Float64Array[]): Float64Array[] {
    validateTable(table);

    const colsLength = table[0].length;
    const columns: Float64Array[] = new Array(colsLength);

    for (let col = 0; col < colsLength; col++) {
        columns[col] = getColumn(table, col);
    }

    return columns;
}

/**
 * Generates an extended contingency table with appended marginal totals (row totals, column totals, and grand total).
 *
 * @param table - 2D matrix representing the contingency table.
 * @returns A new 2D matrix extended with row and column total sums.
 * @throws {Error} If the table structure is invalid.
 */
export function calcCombinationTable(table: Float64Array[]): Float64Array[] {
    validateTable(table);
    const rows = table.length;
    const cols = table[0].length;

    const combTable: Float64Array[] = new Array(rows + 1);

    for (let row = 0; row < rows; row++) {
        const newRow = new Float64Array(cols + 1);
        let rowSum = 0;
        for (let col = 0; col < cols; col++) {
            const val = table[row][col];
            newRow[col] = val;
            rowSum += val;
        }
        newRow[cols] = rowSum;
        combTable[row] = newRow;
    }

    const colTotals = new Float64Array(cols + 1);
    for (let col = 0; col <= cols; col++) {
        let colSum = 0;
        for (let row = 0; row < rows; row++) {
            colSum += combTable[row][col];
        }
        colTotals[col] = colSum;
    }

    combTable[rows] = colTotals;
    return combTable;
}

export function chiSquare(table: Float64Array[], digits?: number): number {
    validateTable(table);

    const numCols = table.length;
    if (numCols === 0) return 0;
    const numRows = table[0].length;
    if (numRows === 0) return 0;

    const colTotals = new Float64Array(numCols);
    const rowTotals = new Float64Array(numRows);
    let grandTotal = 0;

    for (let col = 0; col < numCols; col++) {
        const colArr = table[col];
        let cTotal = 0;

        for (let row = 0; row < numRows; row++) {
            const currentEl = colArr[row];
            cTotal += currentEl;
            rowTotals[row] += currentEl;
        }

        colTotals[col] = cTotal;
        grandTotal += cTotal;
    }

    if (grandTotal <= 0) {
        throw new Error("The grand total cannot be zero or negative!");
    }

    let khi = 0;
    let compensation = 0;

    for (let col = 0; col < numCols; col++) {
        const colTotal = colTotals[col];
        if (colTotal === 0) continue;

        const colArr = table[col];

        for (let row = 0; row < numRows; row++) {
            const rowTotal = rowTotals[row];
            if (rowTotal === 0) continue;

            const expectedValue = (colTotal * rowTotal) / grandTotal;

            if (expectedValue < Number.EPSILON) {
                continue;
            }

            const observed = colArr[row];
            const diff = observed - expectedValue;
            const ratio = (diff * diff) / expectedValue;

            const t = khi + ratio;

            if (Math.abs(khi) >= Math.abs(ratio)) {
                compensation += (khi - t) + ratio;
            } else {
                compensation += (ratio - t) + khi;
            }

            khi = t;
        }
    }

    const finalKhi = khi + compensation;
    return round(Math.max(0, finalKhi), digits);
}

/**
 * Calculates Cramér's V measure of association between two nominal variables in a contingency table.
 *
 * @param table - 2D matrix representing the contingency table.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns Cramér's V association coefficient (between 0 and 1).
 * @throws {Error} If the table structure is invalid.
 */
export function cramerV(table: Float64Array[], digits?: number): number {
    validateTable(table);
    const rows = table.length;
    const cols = table[0].length;
    const total = totalCount(table);

    const khiSquareVal = chiSquare(table);
    const minDim = Math.min(cols - 1, rows - 1);

    if (minDim === 0 || total === 0) {
        return round(0, digits);
    }

    const result = Math.sqrt(khiSquareVal / (minDim * total));
    return round(result, digits);
}

/**
 * Calculates the within-group Sum of Squared Deviations (SSD) across the columns of a table.
 *
 * @param table - 2D matrix representing groups in columns.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The total within-group sum of squared deviations.
 * @throws {Error} If the table structure is invalid.
 */
export function withinSSD(
    table: Float64Array[],
    digits?: number
): number {
    validateTable(table);

    let totalSsd = 0;

    for (let i = 0; i < table.length; i++) {
        totalSsd += ssd(table[i]);
    }

    return round(totalSsd, digits);
}

/**
 * Calculates the total Sum of Squared Deviations (SSD) for all elements in the table treated as a single dataset.
 *
 * @param table - 2D matrix of numerical values.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The grand total sum of squared deviations.
 * @throws {Error} If the table structure is invalid.
 */
export function totalSSD(table: Float64Array[], digits?: number): number {
    validateTable(table);

    let totalLength = 0;
    for (let i = 0; i < table.length; i++) {
        totalLength += table[i].length;
    }

    const flattened = new Float64Array(totalLength);
    let offset = 0;
    for (let i = 0; i < table.length; i++) {
        flattened.set(table[i], offset);
        offset += table[i].length;
    }

    const totalSsd = ssd(flattened);

    return round(totalSsd, digits);
}

/**
 * Calculates the between-group Sum of Squared Deviations (SSD) across the columns of a table.
 *
 * @param table - 2D matrix representing groups in columns.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The between-group sum of squared deviations.
 * @throws {Error} If the table structure is invalid.
 */
export function betweenSSD(
    table: Float64Array[],
    digits?: number
): number {
    validateTable(table);

    const len = table.length;
    if (len === 0) return 0;

    const groupNs = new Float64Array(len);
    const groupMeans = new Float64Array(len);
    let validGroupCount = 0;

    for (let i = 0; i < len; i++) {
        const group = table[i];
        if (!group || group.length === 0) continue;

        groupNs[validGroupCount] = group.length;
        groupMeans[validGroupCount] = mean(group);
        validGroupCount++;
    }

    if (validGroupCount === 0) return 0;

    let combN = groupNs[0];
    let combMean = groupMeans[0];

    for (let i = 1; i < validGroupCount; i++) {
        const gn = groupNs[i];
        const gMean = groupMeans[i];
        const nextN = combN + gn;
        const delta = gMean - combMean;

        combMean += delta * (gn / nextN);
        combN = nextN;
    }

    const grandMean = combMean;

    let totalSsd = 0;
    let compensation = 0;

    for (let i = 0; i < validGroupCount; i++) {
        const gn = groupNs[i];
        const diff = groupMeans[i] - grandMean;
        const term = gn * diff * diff;

        const t = totalSsd + term;
        if (Math.abs(totalSsd) >= Math.abs(term)) {
            compensation += (totalSsd - t) + term;
        } else {
            compensation += (term - t) + totalSsd;
        }
        totalSsd = t;
    }

    return round(Math.max(0, totalSsd + compensation), digits);
}

/**
 * Calculates the Eta Squared (η²) effect size coefficient, representing the proportion of variance explained by group membership.
 *
 * @param table - 2D matrix representing groups in columns.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The Eta Squared value (between 0 and 1).
 */
export function etaSquared(table: Float64Array[], digits?: number): number {
    const between = betweenSSD(table);
    const total = totalSSD(table);

    return round(total === 0 ? 0 : between / total, digits);
}

function scd(xValues: Float64Array, yValues: Float64Array): number {
    let avgX = 0;
    let avgY = 0;
    let sumCross = 0;

    for (let i = 0; i < xValues.length; i++) {
        const count = i + 1;

        const deltaX = xValues[i] - avgX;
        avgX += deltaX / count;

        const deltaY = yValues[i] - avgY;
        avgY += deltaY / count;
        sumCross += deltaX * (yValues[i] - avgY);
    }

    return sumCross;
}

/**
 * Calculates the covariance between two equal-length numerical datasets.
 *
 * @param values1 - First array of numerical values.
 * @param values2 - Second array of numerical values.
 * @param [isSample=false] - Whether to calculate sample covariance (N - 1) or population covariance (N).
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The calculated covariance.
 * @throws {Error} If arrays are invalid, empty, unequal in length, or sample size is less than 2.
 */
export function covariance(values1: Float64Array, values2: Float64Array,
    isSample: boolean = true, digits?: number): number {
    if (!values1 || values1.length === 0 || !values2 || values2.length === 0) {
        throw new Error('Invalid values!');
    }

    if (values1.length !== values2.length) {
        throw new Error('The number of elements must match in the two arrays!');
    }

    if (isSample && values1.length < 2) {
        throw new Error('Sample covariance requires at least 2 data points.');
    }

    const numerator = scd(values1, values2);
    const length = getDegreesOfFreedom(values1, isSample);

    return round(numerator / length, digits);
}

/**
 * Calculates the Pearson correlation coefficient between two equal-length numerical datasets.
 *
 * @param values1 - First array of numerical values.
 * @param values2 - Second array of numerical values.
 * @param [isSample=false] - Whether to use sample standard deviation and covariance.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The Pearson correlation coefficient, clamped to [-1, 1]. Returns 0 if standard deviation of either array is zero.
 */
export function correlation(
    values1: Float64Array,
    values2: Float64Array,
    isSample: boolean = true,
    digits?: number
): number {
    const std1 = std(values1, isSample);
    const std2 = std(values2, isSample);

    if (std1 === 0 || std2 === 0) {
        return 0;
    }

    const covar = covariance(values1, values2, isSample);
    const rawCorr = covar / (std1 * std2);

    const clampedCorr = clampSymmetric(rawCorr, 15);
    return round(clampedCorr, digits);
}

/**
 * Computes fractional (average) ranks for unique values in an array of numbers.
 *
 * @param values - Array of numerical values (must contain at least 2 numbers).
 * @returns A Map mapping each unique numerical value to its calculated fractional rank.
 * @throws {Error} If `values` is empty or contains fewer than 2 numbers.
 */
export function getRanks(values: Float64Array): Map<number, number> {
    if (!values || values.length < 2) {
        throw new Error('Values array must contain at least 2 numbers!');
    }

    const uniqueVals = orderAsc(values);
    const stats = new Map<number, number>();

    for (let i = 0; i < uniqueVals.length; i++) {
        const val = uniqueVals[i];
        stats.set(val, (stats.get(val) || 0) + 1);
    }

    const ranks = new Map<number, number>();
    let serial = 1;

    for (const [key, value] of stats) {
        const rank = rangeSequence(serial, (serial + value) - 1)
            .reduce((total, val) => total + val, 0) / value;
        ranks.set(key, rank);
        serial += value;
    }

    return ranks;
}

/**
 * Calculates Spearman's Rank Correlation Coefficient between two numerical datasets.
 *
 * @param values1 - First array of numerical values.
 * @param values2 - Second array of numerical values.
 * @param [isSample=false] - Whether to use sample calculations for ranking correlation.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The Spearman rank correlation coefficient.
 */
export function rankCorrelation(
    values1: Float64Array,
    values2: Float64Array,
    isSample: boolean = true,
    digits?: number
): number {
    const ranks1 = getRanks(values1);
    const ranks2 = getRanks(values2);

    const rankValues1 = new Float64Array(values1.length);
    const rankValues2 = new Float64Array(values2.length);

    for (let i = 0; i < values1.length; i++) {
        rankValues1[i] = ranks1.get(values1[i])!;
        rankValues2[i] = ranks2.get(values2[i])!;
    }

    return correlation(rankValues1, rankValues2, isSample, digits);
}