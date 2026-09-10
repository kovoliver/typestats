import { clampSymmetric, orderAsc, rangeSequence, round } from "../utils/numberUtils.js";
import { mean, ssd, std } from "../statistics/univariate.js";
import { getDegreesOfFreedom } from "../statistics/univariate.js";

/**
 * Validates a 2D contingency table matrix to ensure it contains at least one row and one column.
 *
 * @param table - 2D matrix representing the contingency table.
 * @throws {Error} If the table is null/empty or contains empty rows.
 */
function validateTable(table: number[][]): void {
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
export function totalCount(table: number[][]): number {
    validateTable(table);
    return table.reduce(
        (acc, row) => acc + row.reduce((rSum, val) => rSum + val, 0),
        0
    );
}

/**
 * Extracts a specific column from a 2D contingency table as a 1D array.
 *
 * @param table - 2D matrix representing the contingency table.
 * @param colNumber - Zero-based index of the column to extract.
 * @returns Array containing the values of the specified column.
 * @throws {Error} If the table structure is invalid or the column index is out of bounds.
 */
export function getColumn(table: number[][], colNumber: number): number[] {
    validateTable(table);

    if (colNumber >= table[0].length) {
        throw new Error('The given column does not exist!');
    }

    const column: number[] = [];

    for (let row = 0; row < table.length; row++) {
        column.push(table[row][colNumber]);
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
export default function getColumns(table: number[][]): number[][] {
    validateTable(table);

    const colsLength = table[0].length;
    const columns: number[][] = [];

    for (let col = 0; col < colsLength; col++) {
        columns.push(getColumn(table, col));
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
export function calcCombinationTable(table: number[][]): number[][] {
    validateTable(table);
    const rows = table.length;
    const cols = table[0].length;

    const combTable: number[][] = table.map(row => {
        const rowSum = row.reduce((sum, val) => sum + val, 0);
        return [...row, rowSum];
    });

    const colTotals: number[] = [];
    for (let col = 0; col <= cols; col++) {
        let colSum = 0;
        for (let row = 0; row < rows; row++) {
            colSum += combTable[row][col];
        }
        colTotals.push(colSum);
    }

    combTable.push(colTotals);
    return combTable;
}

/**
 * Calculates the Chi-Square (χ²) statistic of independence for a contingency table.
 *
 * @param table - 2D matrix representing the contingency table.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The Chi-Square statistic value.
 * @throws {Error} If the table structure is invalid.
 */
export function chiSquareDep(table: number[][], digits?: number): number {
    validateTable(table);
    const combTable = calcCombinationTable(table);
    const total = totalCount(table);
    const rows = table.length;
    const cols = table[0].length;

    let khi = 0;

    for (let col = 0; col < cols; col++) {
        const colTotal = combTable[rows][col];

        for (let row = 0; row < rows; row++) {
            const rowTotal = combTable[row][cols];

            const expectedValue = (rowTotal * colTotal) / total;

            if (expectedValue === 0) {
                continue;
            }

            const ratio = Math.pow(table[row][col] - expectedValue, 2) / expectedValue;
            khi += ratio;
        }
    }

    return round(khi, digits);
}

export function chiSquare(table: number[][], digits?: number): number {
    validateTable(table);
    const combTable = calcCombinationTable(table);
    const total = totalCount(table);
    const rows = table.length;
    const cols = table[0].length;

    let khi = 0;
    let compensation = 0;

    for (let row = 0; row < rows; row++) {
        const rowTotal = combTable[row][cols];
        if (rowTotal === 0) continue;

        for (let col = 0; col < cols; col++) {
            const colTotal = combTable[rows][col];
            if (colTotal === 0) continue;

            const expectedValue = (rowTotal * colTotal) / total;

            if (expectedValue < Number.EPSILON) {
                continue;
            }

            const observed = table[row][col];
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
export function cramerV(table: number[][], digits?: number): number {
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
    table: number[][],
    digits?: number
): number {
    validateTable(table);

    let totalSsd = 0;

    for (const group of table) {
        totalSsd += ssd(group);
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
export function totalSSD(table: number[][], digits?: number): number {
    validateTable(table);

    const totalSsd = ssd(table.flat());

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
export function betweenSSDDep(
    table: number[][],
    digits?: number
): number {
    validateTable(table);

    const totalMean = mean(table.flat());
    let totalSsd = 0;

    for (const group of table) {
        totalSsd += group.length * Math.pow(
            mean(group) - totalMean,
            2
        );
    }

    return round(totalSsd, digits);
}

export function betweenSSD(
    table: number[][],
    digits?: number
): number {
    validateTable(table);

    let totalSum = 0;
    let totalCount = 0;

    const groupMeans: number[] = [];
    const groupSizes: number[] = [];

    for (let i = 0; i < table.length; i++) {
        const group = table[i];
        if (!group || group.length === 0) continue;

        const gMean = mean(group);
        const gSize = group.length;

        groupMeans.push(gMean);
        groupSizes.push(gSize);

        totalSum += gMean * gSize;
        totalCount += gSize;
    }

    if (totalCount === 0) return 0;

    const grandMean = totalSum / totalCount;

    let totalSsd = 0;

    for (let i = 0; i < groupMeans.length; i++) {
        const diff = groupMeans[i] - grandMean;
        totalSsd += groupSizes[i] * (diff * diff);
    }

    return round(Math.max(0, totalSsd), digits);
}

/**
 * Calculates the Eta Squared (η²) effect size coefficient, representing the proportion of variance explained by group membership.
 *
 * @param table - 2D matrix representing groups in columns.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The Eta Squared value (between 0 and 1).
 */
export function etaSquared(table: number[][], digits?: number) {
    const between = betweenSSD(table);
    const total = totalSSD(table);

    return round(total === 0 ? 0 : between / total, digits);
}

function scd(xValues: number[], yValues: number[]) {
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
export function covariance(values1: number[], values2: number[],
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
    values1: number[],
    values2: number[],
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
export function getRanks(values: number[]): Map<number, number> {
    if (!values || values.length < 2) {
        throw new Error('Values array must contain at least 2 numbers!');
    }

    const uniqueVals = orderAsc([...values]);
    const stats = new Map();

    for (const val of uniqueVals) {
        if (stats.has(val)) {
            stats.set(val, stats.get(val) + 1);
        } else {
            stats.set(val, 1);
        }
    }

    const ranks = new Map();
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
    values1: number[],
    values2: number[],
    isSample: boolean = true,
    digits?: number
) {
    const ranks1 = getRanks(values1);
    const ranks2 = getRanks(values2);

    const rankValues1 = values1.map(val => ranks1.get(val)!);
    const rankValues2 = values2.map(val => ranks2.get(val)!);

    return correlation(rankValues1, rankValues2, isSample, digits);
}