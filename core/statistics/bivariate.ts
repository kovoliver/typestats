import { clampSymmetric, orderAsc, range, round } from "../utils/numberUtils";
import { mean, ssd, std } from "../statistics/univariate";
import { getDegreesOfFreedom } from "../statistics/univariate";

/**
 * Validates a 2D contingency table matrix to ensure it contains at least one row and one column.
 *
 * @param table - 2D matrix representing the contingency table.
 * @throws {Error} If the table is null/empty or contains empty rows.
 */
function validateContingencyTable(table: number[][]): void {
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
    validateContingencyTable(table);
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
    validateContingencyTable(table);

    if (colNumber >= table[0].length) {
        throw new Error('The given column does not exist!');
    }

    const column = [];

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
    validateContingencyTable(table);

    const colsLength = table[0].length;
    const columns = [];

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
    validateContingencyTable(table);
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
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The Chi-Square statistic value.
 * @throws {Error} If the table structure is invalid.
 */
export function chiSquare(table: number[][], digits: number = -1): number {
    validateContingencyTable(table);
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

/**
 * Calculates Cramér's V measure of association between two nominal variables in a contingency table.
 *
 * @param table - 2D matrix representing the contingency table.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns Cramér's V association coefficient (between 0 and 1).
 * @throws {Error} If the table structure is invalid.
 */
export function cramerV(table: number[][], digits: number = -1): number {
    validateContingencyTable(table);
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
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The total within-group sum of squared deviations.
 * @throws {Error} If the table structure is invalid.
 */
export function withinSSD(
    table: number[][],
    digits: number = -1
): number {
    validateContingencyTable(table);

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
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The grand total sum of squared deviations.
 * @throws {Error} If the table structure is invalid.
 */
export function totalSSD(table: number[][], digits: number = -1): number {
    validateContingencyTable(table);

    const totalSsd = ssd(table.flat());

    return round(totalSsd, digits);
}

/**
 * Calculates the between-group Sum of Squared Deviations (SSD) across the columns of a table.
 *
 * @param table - 2D matrix representing groups in columns.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The between-group sum of squared deviations.
 * @throws {Error} If the table structure is invalid.
 */
export function betweenSSD(
    table: number[][],
    digits: number = -1
): number {
    validateContingencyTable(table);

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

/**
 * Calculates the Eta Squared (η²) effect size coefficient, representing the proportion of variance explained by group membership.
 *
 * @param table - 2D matrix representing groups in columns.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The Eta Squared value (between 0 and 1).
 */
export function etaSquared(table: number[][], digits: number = -1) {
    const between = betweenSSD(table);
    const total = totalSSD(table);

    return round(total === 0 ? 0 : between / total, digits);
}

/**
 * Calculates the covariance between two equal-length numerical datasets.
 *
 * @param values1 - First array of numerical values.
 * @param values2 - Second array of numerical values.
 * @param [isSample=false] - Whether to calculate sample covariance (N - 1) or population covariance (N).
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The calculated covariance.
 * @throws {Error} If arrays are invalid, empty, unequal in length, or sample size is less than 2.
 */
export function covariance(values1: number[], values2: number[],
    isSample: boolean = false, digits: number = -1): number {
    if (!values1 || values1.length === 0 || !values2 || values2.length === 0) {
        throw new Error('Invalid values!');
    }

    if (values1.length !== values2.length) {
        throw new Error('The number of elements must match in the two arrays!');
    }

    if (isSample && values1.length < 2) {
        throw new Error('Sample covariance requires at least 2 data points.');
    }

    const length = getDegreesOfFreedom(values1, isSample);

    const mean1 = mean(values1);
    const mean2 = mean(values2);

    const coSSD = values1.reduce(
        (total, val, i) => total + ((val - mean1) * (values2[i] - mean2)), 0
    );

    return round(coSSD / length, digits);
}

/**
 * Calculates the Pearson correlation coefficient between two equal-length numerical datasets.
 *
 * @param values1 - First array of numerical values.
 * @param values2 - Second array of numerical values.
 * @param [isSample=false] - Whether to use sample standard deviation and covariance.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The Pearson correlation coefficient, clamped to [-1, 1]. Returns 0 if standard deviation of either array is zero.
 */
export function correlation(
    values1: number[],
    values2: number[],
    isSample: boolean = false,
    digits: number = -1
): number {
    const std1 = std(values1, isSample);
    const std2 = std(values2, isSample);

    if (std1 === 0 || std2 === 0) {
        return 0;
    }

    const covar = covariance(values1, values2, isSample);
    const rawCorr = covar / (std1 * std2);
    return clampSymmetric(rawCorr, 12);
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
        const rank = range(serial, (serial + value) - 1)
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
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The Spearman rank correlation coefficient.
 */
export function rankCorrelation(
    values1: number[],
    values2: number[],
    isSample: boolean = false,
    digits: number = -1
) {
    const ranks1 = getRanks(values1);
    const ranks2 = getRanks(values2);

    const rankValues1 = values1.map(val => ranks1.get(val)!);
    const rankValues2 = values2.map(val => ranks2.get(val)!);

    return correlation(rankValues1, rankValues2, isSample, digits);
}