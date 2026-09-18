/**
 * ============================================================================
 * TYPESTATS ALL-IN-ONE PIPELINE EXAMPLE
 * ============================================================================
 * This script serves as a comprehensive guide for beginners, demonstrating 
 * how to load data from multiple sources (CSV, Excel, Database), clean it, 
 * apply transformations, perform statistical analysis, regressions, 
 * hypothesis tests, and filtered queries using TypeStats.
 */

import { createConnection, getTableFromQuery } from "typestats/db";
import { getTableFromCSVP, getTableFromXLS } from "typestats/io";
import { round } from "typestats/utils";
import { performance } from "perf_hooks";

async function runPipeline() {
    // Record the starting time of the pipeline to measure total execution duration later.
    const t0 = performance.now();

    /**
     * ------------------------------------------------------------------------
     * 1. CSV DATA LOADING (PARALLEL WORKERS) & BASIC DESCRIPTION
     * ------------------------------------------------------------------------
     * getTableFromCSVP loads a CSV file utilizing parallel worker threads for 
     * significantly faster performance on large datasets.
     * 
     * Parameters:
     * - 1st parameter: Path to the CSV file ('./sampleData/users_dataset.csv').
     * - 2nd parameter: Column delimiter character (';').
     * - 3rd parameter: Array of headers/labels to skip or exclude (['id']), 
     *   as they may be unnecessary or provide no analytical value.
     */
    let usersTable = await getTableFromCSVP("./sampleData/users_dataset.csv", ";", ["id"]);
    
    /**
     * The .describe() method prints a clean, structured summary of the dataset, 
     * including shape, column types, missing value counts, and basic numeric stats.
     */
    usersTable.describe();

    // Count outliers using custom manual thresholds (min: 50,000, max: 10,000,000)
    console.log("outliers custom boundaries (annual_income): ",
        usersTable.countOutliers("annual_income", { min: 50_000, max: 10_000_000 }));
    
    // Count outliers automatically using the Interquartile Range (IQR) method
    console.log("outliers IQR (annual_income): ",
        usersTable.countOutliersIqr("annual_income"));

    /**
     * ------------------------------------------------------------------------
     * 2. IMMUTABILITY & METHOD CHAINING
     * ------------------------------------------------------------------------
     * IMPORTANT DESIGN CONCEPT: The Table class in TypeStats is immutable! 
     * This means almost all modification methods return an entirely NEW Table 
     * instance instead of mutating the original one. 
     * Because of this, you must reassign the variable (`usersTable = usersTable ...`) 
     * to capture the changes and safely chain multiple operations together.
     */
    usersTable = usersTable
        // Fill missing (NaN) values in 'annual_income' using the median value
        .fillNaNumeric("annual_income", "median")
        // Fill missing (NaN) values in 'purchase_score' using the arithmetic mean
        .fillNaNumeric("purchase_score", "mean")
        // Drop rows containing statistical outliers in 'annual_income' based on IQR
        .dropOutliersIqr("annual_income")
        // Sort the table rows in ascending order first by 'annual_income', then by 'first_name'
        .orderByAsc("annual_income", "first_name");

    // Extract specific columns as separate Series/Column objects for deeper analysis
    const annualIncome = usersTable.getCol("annual_income");
    const purchaseScore = usersTable.getCol("purchase_score");

    // Compute distribution shape metrics
    console.log("annual income kurtosis: ", annualIncome.kurtosis()); // Measures tailedness of the distribution
    console.log("annual income skewness: ", annualIncome.skewness()); // Measures asymmetry of the distribution

    /**
     * ------------------------------------------------------------------------
     * 3. TREND ANALYSIS & REGRESSION MODELS
     * ------------------------------------------------------------------------
     */
    console.log("linear trend: ", annualIncome.linearTrend());
    console.log("exponential trend: ", annualIncome.exponentialTrend());
    console.log("logarithmic trend: ", annualIncome.logarithmicTrend());
    console.log("polynomial trend: ", annualIncome.polynomialTrend(4)); // 4th-degree polynomial trend

    // Regression analysis between annualIncome and purchaseScore
    // 2nd parameter (false): Forces calculation without an intercept (no-intercept model)
    console.log("linear regression (no intercept): ", annualIncome.linearRegression(purchaseScore, false));
    console.log("exponential regression: ", annualIncome.exponentialRegression(purchaseScore));
    console.log("power regression: ", annualIncome.powerRegression(purchaseScore));

    /**
     * ------------------------------------------------------------------------
     * 4. STATISTICAL ESTIMATIONS & HYPOTHESIS TESTING
     * ------------------------------------------------------------------------
     */
    // Mean estimation assuming Independent and Identically Distributed (IID) data at 5% significance (0.05)
    console.log("mean estimation (IID): ", annualIncome.meanEstimationIIDwithoutSTD(0.05));
    
    // Mean estimation using Simple Random Sampling (SRS) with a finite population size of 1,000,000
    console.log("mean estimation (SRS): ", annualIncome.meanEstimationSRSwithoutSTD(0.05, 1_000_000));

    // Chi-squared test for population variance (tested against value 5, alpha = 0.05, 'two-sided' alternative)
    console.log("Chi-squared test for population variance: ",
        purchaseScore.chi2Test(5, 0.05, 'two-sided'));

    // Two-sample t-test comparing means between purchaseScore and annualIncome (alpha = 0.05, 'left' tailed test)
    console.log("Two-sample t-test for the difference between two population means: ",
        purchaseScore.tTestTwoSamples(annualIncome, 0.05, 'left'));

    // Bartlett's test for homogeneity of variances across groups (significance level = 0.1)
    console.log("Bartlett's test for homogeneity of variances: ",
        annualIncome.bartlett([purchaseScore], 0.1));

    /**
     * ------------------------------------------------------------------------
     * 5. GROUPING, AGGREGATION & COLUMN TRANSFORMATION
     * ------------------------------------------------------------------------
     * The .groupBy() method groups data, allowing aggregation (like .avg()).
     * Subsequent methods allow custom mapping and arithmetic combination of columns.
     */
    const groupedUsers = usersTable.groupBy("gender", "city").avg("annual_income")
    // Apply a custom callback function to round 'annual_income_avg' to 2 decimal places
    .applyColumn("annual_income_avg", (val)=>round(val, 2))
    // Map an existing column into a new column ('annual_income_avg_t') dividing by 1000
    .mapColumn("annual_income_avg", "annual_income_avg_t", (val)=>round(val/1000, 2))
    // Combine two columns using arithmetic operations ('+' operator) into a brand-new column
    .combineColumns(["annual_income_avg", "annual_income_avg_t"], "+", "totally_meaningless_column");
    
    // Print the first few rows of the grouped table
    groupedUsers.head();

    /**
     * ------------------------------------------------------------------------
     * 6. EXCEL FILE LOADING & MULTIVARIATE STATISTICS
     * ------------------------------------------------------------------------
     * NOTE: Using getTableFromXLS requires the 'xlsx' package to be installed (`npm i xlsx`).
     * Parameters:
     * - 1st parameter: File path to the Excel file.
     * - 2nd parameter: Zero-based index of the target worksheet to read (0 = first sheet).
     */
    let xlsxTable = await getTableFromXLS("./sampleData/bank_churn_messy.xlsx", 0);

    // Clean and convert string salary values (e.g., stripping euro symbols) into numeric floats
    xlsxTable = xlsxTable.applyColumn("EstimatedSalary", (val) => parseFloat(val.replace("€", "")));
    xlsxTable.head();
    xlsxTable.describe();

    console.log("Estimated salary variance: ", xlsxTable.getCol("EstimatedSalary").variance());
    console.log("Estimated salary std: ", xlsxTable.getCol("EstimatedSalary").std());
    
    // Handle missing numeric values in the 'Age' column using the median strategy
    xlsxTable = xlsxTable.fillNaNumeric("Age", "median");
    
    // Calculate covariance and correlation matrices across multiple columns
    // 2nd parameter (true) enables pretty-printing formatting for matrices
    const covarianceMatrix = xlsxTable.covariance(["CreditScore", "Age", "EstimatedSalary"], true);
    const correlationMatrix = xlsxTable.correlation(["CreditScore", "Age", "EstimatedSalary"], true);

    console.log("Raw covariance matrix: ", covarianceMatrix);
    console.log("Raw correlation matrix: ", correlationMatrix);

    /**
     * ------------------------------------------------------------------------
     * 7. CONDITIONAL FILTERING (WHERE METHODS)
     * ------------------------------------------------------------------------
     * Demonstrate single-column and multi-column conditional filtering.
     */
    // Filter rows where 'CreditScore' is strictly greater than 600
    const whereTable = xlsxTable.where("CreditScore", (val) => val > 600);
    whereTable.print(0, 20); // Print rows from index 0 to 20

    // Filter rows where ALL conditions must match: CreditScore > 700 AND Age < 45
    const whereAllTable = xlsxTable.whereAll(["CreditScore", "Age"], [(val) => val > 700, (val) => val < 45]);
    whereAllTable.print(0, 20);

    // Filter rows where ANY condition can match: CreditScore > 700 OR Age < 45
    const whereAnyTable = xlsxTable.whereAny(["CreditScore", "Age"], [(val) => val > 700, (val) => val < 45]);
    whereAnyTable.print(0, 20);

    /**
     * ------------------------------------------------------------------------
     * 8. DATABASE INTEGRATION & SECURITY BEST PRACTICES
     * ------------------------------------------------------------------------
     * NOTE: To use database connections, install the appropriate driver package:
     * `npm i mysql2`, `npm i mssql`, or `npm i pg`.
     * 
     * ⚠️ SECURITY WARNING: Never hardcode sensitive credentials (like passwords) 
     * directly into your source code when pushing code to public repositories 
     * like GitHub! Always use environment variables (via a `.env` file and a 
     * package like `dotenv`) to maintain the integrity and security of your private data.
     */
    const conn = await createConnection({
        engine: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'typestats_test'
    });

    const sql = "SELECT * FROM mock_data WHERE gender = ?";

    // Fetch data directly from the database query using parameterized queries to prevent SQL injection
    const dbTable = await getTableFromQuery(conn, sql, ['Male']);

    // Perform multi-column conditional filtering on the database result set using a custom predicate function.
    // Filters rows where 'first_name' contains 'c' AND 'last_name' contains 'b' (case-insensitive).
    const whereDb = dbTable.where(
        ["first_name", "last_name"], 
        (fn, ln) => fn.toLowerCase().includes("c") && ln.toLowerCase().includes("b")
    );

    // Print the first 20 rows of the filtered database table
    whereDb.print(0, 20);
    
    // Always close database connections cleanly when finished to release connection pools and prevent memory leaks
    conn.close();

    // Print a detailed summary of the database-loaded dataset
    dbTable.describe();

    /**
     * ------------------------------------------------------------------------
     * 9. DATE AND TIME MANIPULATION
     * ------------------------------------------------------------------------
     * Load a CSV dataset containing date columns to demonstrate date arithmetic, 
     * difference calculations, and date shifts using TypeStats Series methods.
     */
    const datesTable = await getTableFromCSVP("./sampleData/sample-dates.csv", ",");
    datesTable.describe();

    // Extract specific date columns as individual Series objects
    const dateCol1 = datesTable.getCol("iso_date");
    const dateCol2 = datesTable.getCol("us_date");

    // Calculate pairwise differences between two date columns in specified time units ('days' and 'seconds')
    const daysDiffs = dateCol1.diffColumn(dateCol2, 'days');
    const secDiffs = dateCol1.diffColumn(dateCol2, 'seconds');
    console.log("Differences in days: ", daysDiffs);
    console.log("Differences in seconds: ", secDiffs);

    // Retrieve a single date element by row index (index 0)
    const originalDate = dateCol1.getElementByIndex(0);

    // Shift/add a specific duration (+100 days) to a date element at a given row index (index 0)
    const futureDate = dateCol1.add(0, 100, 'days');
    console.log("Original date: ", originalDate);
    console.log("Future date: ", futureDate);

    /**
     * ------------------------------------------------------------------------
     * 10. PIPELINE BENCHMARKING & METRICS
     * ------------------------------------------------------------------------
     * Measure total execution duration by computing the delta between start (t0) and end (t1).
     */
    const t1 = performance.now();
    console.log("Complete pipeline execution time: ", round((t1 - t0) / 1000, 3), "seconds");
}

runPipeline();