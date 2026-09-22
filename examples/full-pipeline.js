import { getTableFromCSVP } from "typestats/io";
import { round } from "typestats/utils";
import { performance } from "perf_hooks";

function measure(label, startTime) {
    const endTime = performance.now();
    console.log(`⏱️ [Time] ${label}: ${round((endTime - startTime) / 1000, 4)} s`);
    return endTime;
}

async function pipeLine() {
    const t0 = performance.now();
    let tStep = t0;

    console.log("=== 1. LOADING & INITIAL SUMMARY ===");
    let table = await getTableFromCSVP("stat_dataset.csv", ",");
    tStep = measure("Data loading and type conversion", tStep);

    table.describe();
    tStep = measure("Initial descriptive statistics (describe)", tStep);


    console.log("\n=== 1.5 DATA ORDERING ===");
    table = table.orderByAsc("date");
    tStep = measure("Ordering by date ascending (orderByAsc)", tStep);


    console.log("\n=== 2. CATEGORICAL DATA CLEANING ===");
    const tFillStart = performance.now();
    table = table
        .fillNa("device", "Unknown")
        .fillNa("payment_method", "Unknown");
    tStep = measure("Categorical missing data imputation (fillNa)", tFillStart);

    table.describe();
    tStep = measure("Descriptive statistics after categorical cleaning (describe)", tStep);


    console.log("\n=== 3. OUTLIER ANALYSIS & SINGLE-PASS TS CLEANING ===");
    // Counting initial outliers on raw, un-imputed numerical data
    const tCountInitStart = performance.now();
    let outliersAdSpend = table.countOutliersIqr("ad_spend");
    let outliersRevenue = table.countOutliersIqr("revenue");
    console.log(`Initial outliers -> Ad Spend: ${outliersAdSpend}, Revenue: ${outliersRevenue}`);
    tStep = measure("Counting initial outliers", tCountInitStart);

    // Single-pass cleaning for missing values (NaN) and outliers using time-series linear interpolation
    const tReplaceStart = performance.now();
    table = table
        .replaceTSOutliersIqr("ad_spend", "interpolation")
        .replaceTSOutliersIqr("revenue", "interpolation");
    tStep = measure("Single-pass time-series cleaning and outlier replacement (ad_spend + revenue)", tReplaceStart);

    const tCountAfterStart = performance.now();
    outliersAdSpend = table.countOutliersIqr("ad_spend");
    outliersRevenue = table.countOutliersIqr("revenue");
    console.log(`Outliers after IQR treatment -> Ad Spend: ${outliersAdSpend}, Revenue: ${outliersRevenue}`);
    tStep = measure("Counting outliers after treatment", tCountAfterStart);


    console.log("\n=== 4. CORRELATION ANALYSIS ===");
    const tCorrStart = performance.now();
    const correlation = table.correlation(["ad_spend", "revenue"], true);
    console.log("Pearson Correlation Matrix:");
    console.table(correlation);
    tStep = measure("Pearson correlation calculation", tCorrStart);


    console.log("\n=== 5. ANOVA (Categorical vs. Numeric) ===");
    const tAnovaStart = performance.now();
    const anovaTable = table.toAnovaTable("payment_method", "revenue");
    anovaTable.printTable();

    const alpha = 0.05;
    const anovaResult = anovaTable.oneWayAnova(alpha);
    const etaSquared = anovaTable.etaSquared();

    console.log("\n--- One-Way ANOVA Hypothesis Test Results ---");
    console.log(`F-Statistic: ${round(anovaResult.F, 4)}`);
    console.log(`Mean Squares: MS Between = ${round(anovaResult.msBetween, 4)}, MS Within = ${round(anovaResult.msWithin, 4)}`);
    console.log(`Critical Upper Bound (alpha = ${alpha}): ${round(anovaResult.criticalBounds.upper, 4)}`);
    console.log(`Hypothesis Result (H0: equal group means): ${anovaResult.passed ? "FAILED TO REJECT H0 (No significant difference)" : "REJECT H0 (Statistically significant difference)"}`);
    console.log(`Strength of association between payment method and revenue (Eta Squared): ${round(etaSquared, 4)}`);
    tStep = measure("ANOVA, hypothesis test, and Eta-squared calculation", tAnovaStart);


    console.log("\n=== 6. CRAMÉR'S V (Categorical vs. Categorical) ===");
    const tCramerStart = performance.now();
    const contingencyTable = table.toContingencyTable("device", "payment_method");
    contingencyTable.printContingencyTable();

    const chi2Result = contingencyTable.chiSquaredIndependenceTest(alpha);
    const cramerVVal = contingencyTable.cramerV();

    console.log("\n--- Chi-Squared Test of Independence Results ---");
    console.log(`Chi-Square Statistic (chi2): ${round(chi2Result.chi2, 4)}`);
    console.log(`Critical Upper Bound (alpha = ${alpha}): ${round(chi2Result.criticalBounds.upper, 4)}`);
    console.log(`Hypothesis Result (H0: variables are independent): ${chi2Result.passed ? "FAILED TO REJECT H0 (Variables are independent)" : "REJECT H0 (Statistically significant association)"}`);
    console.log(`Cramér's V (device vs. payment method): ${round(cramerVVal, 4)}`);
    tStep = measure("Contingency table, Chi-squared test, and Cramér's V calculation", tCramerStart);


    console.log("\n=== 7. TIME-SERIES TREND ANALYSIS (Revenue) ===");
    const revenueCol = table.getCol("revenue");
    
    const tLinTrendStart = performance.now();
    const linTrend = revenueCol.linearTrend();
    const tLinTrend = measure("  - Linear trend", tLinTrendStart);

    const expTrend = revenueCol.exponentialTrend();
    const tExpTrend = measure("  - Exponential trend", tLinTrend);

    const logTrend = revenueCol.logarithmicTrend();
    measure("  - Logarithmic trend", tExpTrend);

    console.table({
        Linear: { intercept_a: round(linTrend.a, 4), slope_b: round(linTrend.b, 4), mse: round(linTrend.mse, 4) },
        Exponential: { intercept_a: round(expTrend.a, 4), slope_b: round(expTrend.b, 4), mse: round(expTrend.mse, 4) },
        Logarithmic: { intercept_a: round(logTrend.a, 4), slope_b: round(logTrend.b, 4), mse: round(logTrend.mse, 4) }
    });
    tStep = measure("Full trend analysis block", tLinTrendStart);


    console.log("\n=== 8. BIVARIATE REGRESSION MODELS (Ad Spend -> Revenue) ===");
    const adSpendCol = table.getCol("ad_spend");

    const tLinRegStart = performance.now();
    const linReg = adSpendCol.linearRegression(revenueCol);
    const tLinReg = measure("  - Linear regression", tLinRegStart);

    const expReg = adSpendCol.exponentialRegression(revenueCol);
    const tExpReg = measure("  - Exponential regression", tLinReg);

    const powReg = adSpendCol.powerRegression(revenueCol);
    measure("  - Power regression", tExpReg);

    console.table({
        Linear: {
            b0_intercept: round(linReg.b0, 4),
            b1_slope: round(linReg.b1, 4),
            rsd: round(linReg.rsd, 4)
        },
        Exponential: {
            b0_intercept: round(expReg.b0, 4),
            b1_slope: round(expReg.b1, 4),
            rsd: round(expReg.rsd, 4)
        },
        Power: {
            b0_intercept: round(powReg.b0, 4),
            b1_slope: round(powReg.b1, 4),
            rsd: round(powReg.rsd, 4)
        }
    });
    tStep = measure("Full bivariate regression models block", tLinRegStart);


    const t1 = performance.now();
    console.log(`\n🏁 Total pipeline execution time: ${round((t1 - t0) / 1000, 3)} seconds.`);
}

pipeLine();