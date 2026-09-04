import {
    oneHotEncode,
    decodeOneHot,
    labelEncoding,
    replaceEmptyValues,
    replaceOutliers,
    removeInvalidRows,
    normalizeValues,
    standardizeValues
} from '../../core/dataPreparation/dataPreparation';

console.log("==================================================");
console.log("       DATA PREPARATION & PREPROCESSING EXAMPLES  ");
console.log("==================================================\n");

// ---------------------------------------------------------
// 1. Categorical Encoding (Label & One-Hot Encoding)
// ---------------------------------------------------------
console.log("--- 1. Categorical Encoding ---");
const categoriesList = ["Budapest", "Vienna", "Budapest", "Prague", "Vienna"];
console.log("Original Categories: ", categoriesList);

// Label Encoding
const encodedLabels = labelEncoding(categoriesList);
console.log("Label Encoded:       ", encodedLabels);

// One-Hot Encoding
const { matrix: oneHotMatrix, categories } = oneHotEncode(categoriesList);
console.log("One-Hot Encoded Matrix:");
console.table(oneHotMatrix);
console.log("Extracted Categories:", categories);

// Decoding One-Hot back to original
const decodedCategories = decodeOneHot(oneHotMatrix, categories);
console.log("Decoded back:        ", decodedCategories);
console.log("\n");

// ---------------------------------------------------------
// 2. Data Cleaning & Imputation (1D Array)
// ---------------------------------------------------------
console.log("--- 2. Data Cleaning & Imputation (1D) ---");
const messyData = [10, null, 20, NaN, 30, "", 1000]; // 1000 is an extreme outlier
console.log("Original Messy Data:           ", messyData);

// Replace empty values (null, NaN, "") with the MEAN of valid values
const filledData = replaceEmptyValues(messyData, 'mean');
console.log("Empty values replaced (MEAN):  ", filledData);

// Replace outliers with MEDIAN based on boundaries
const boundaries = { min: 0, max: 100 };
const cleanedData = replaceOutliers(filledData, 'median', boundaries);
console.log("Outliers replaced (MEDIAN):    ", cleanedData);

// Simply remove invalid or boundary-breaking rows
const strictData = removeInvalidRows(messyData, boundaries);
console.log("Invalid/Outlier rows removed:  ", strictData);
console.log("\n");

// ---------------------------------------------------------
// 3. Matrix / DataFrame Operations (2D Array)
// ---------------------------------------------------------
console.log("--- 3. Matrix Operations (2D) ---");
// Columns: [Name, Age, Income]
const tableData = [
    ["John", 25, 50000],
    ["Jane", null, 62000],
    ["Doe", 30, NaN],
    ["Smith", 40, 2000000] // Outlier income
];
console.log("Original Table Data:");
console.table(tableData);

// Fill missing Age (column index 1) with the MEDIAN age
const tableWithAge = replaceEmptyValues(tableData, 'median', 1);
console.log("Table with missing Age replaced by MEDIAN (col 1):");
console.table(tableWithAge);

// Remove rows where Income (column index 2) is missing or an outlier
const incomeBoundaries = { min: 0, max: 200000 };
const validTable = removeInvalidRows(tableData, incomeBoundaries, 2);
console.log("Table after removing invalid/outlier Income rows (col 2):");
console.table(validTable);
console.log("\n");

// ---------------------------------------------------------
// 4. Feature Scaling (Normalization & Standardization)
// ---------------------------------------------------------
console.log("--- 4. Feature Scaling ---");
const numericFeatures = [10, 20, 30, 40, 50];
console.log("Original Features:    ", numericFeatures);

// Min-Max Normalization (scales values between 0 and 1)
const normalizedFeatures = normalizeValues(numericFeatures);
console.log("Normalized (Min-Max): ", normalizedFeatures);

// Z-Score Standardization (mean = 0, standard deviation = 1)
const standardizedFeatures = standardizeValues(numericFeatures);
console.log("Standardized (Z-Score):", standardizedFeatures);
console.log("\n==================================================");