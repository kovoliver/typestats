import { getTableFromCSVP } from "typestats/io";
import { round } from "typestats/utils";
import { performance } from "perf_hooks";

async function pipeline() {
    const t0 = performance.now();

    console.log("=== 1. LOADING & INITIAL SUMMARY ===");
    let table = await getTableFromCSVP("stat_dataset.csv", ",");
    table.describe();

    console.log("\n=== 2. DATA CLEANING & IMPUTATION ===");
    table = table
        .dropNa(["device", "payment_method"])
        .fillNaNumeric("ad_spend", "median")
        .fillNaNumeric("revenue", "median");

    table.describe();

    console.log("\n=== 3. OUTLIER ANALYSIS & TREATMENT ===");
    let outliersAdSpend = table.countOutliersIqr("ad_spend");
    let outliersRevenue = table.countOutliersIqr("revenue");
    console.log(`Initial outliers -> Ad Spend: ${outliersAdSpend}, Revenue: ${outliersRevenue}`);

    table = table
        .replaceOutliersIQR("ad_spend", "median")
        .replaceOutliersIQR("revenue", "median");

    table = table.orderByAsc("date");

    outliersAdSpend = table.countOutliersIqr("ad_spend");
    outliersRevenue = table.countOutliersIqr("revenue");
    console.log(`Outliers after IQR treatment -> Ad Spend: ${outliersAdSpend}, Revenue: ${outliersRevenue}`);

    console.log("\n=== 4. CORRELATION ANALYSIS ===");
    const correlation = table.correlation(["ad_spend", "revenue"], true);
    console.log("Pearson Correlation Matrix:");
    console.table(correlation);

    console.log("\n=== 5. ANOVA (Categorical vs. Numeric) ===");
    const anovaTable = table.toAnovaTable("payment_method", "revenue");
    anovaTable.printTable();
    const etaSquared = anovaTable.etaSquared();
    console.log(`Strength of association between payment method and revenue (Eta Squared): ${round(etaSquared, 4)}`);

    console.log("\n=== 6. CRAMÉR'S V (Categorical vs. Categorical) ===");
    const contingencyTable = table.toContingencyTable("device", "payment_method");
    contingencyTable.printContingencyTable();
    console.log(`Cramér's V (device vs. payment method): ${round(contingencyTable.cramerV(), 4)}`);

    console.log("\n=== 7. TIME-SERIES TREND ANALYSIS (Revenue) ===");
    const revenueCol = table.getCol("revenue");

    const linTrend = revenueCol.linearTrend();
    const expTrend = revenueCol.exponentialTrend();
    const logTrend = revenueCol.logarithmicTrend();

    console.table({
        Linear: { intercept_a: round(linTrend.a, 4), slope_b: round(linTrend.b, 4), mse: round(linTrend.mse, 4) },
        Exponential: { intercept_a: round(expTrend.a, 4), slope_b: round(expTrend.b, 4), mse: round(expTrend.mse, 4) },
        Logarithmic: { intercept_a: round(logTrend.a, 4), slope_b: round(logTrend.b, 4), mse: round(logTrend.mse, 4) }
    });

    console.log("\n=== 8. BIVARIATE REGRESSION MODELS (Ad Spend -> Revenue) ===");
    const adSpendCol = table.getCol("ad_spend");

    const linReg = adSpendCol.linearRegression(revenueCol);
    const expReg = adSpendCol.exponentialRegression(revenueCol);
    const powReg = adSpendCol.powerRegression(revenueCol);

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

    const t1 = performance.now();
    console.log(`TypeStats: Pipeline execution completed in ${round((t1 - t0) / 1000, 3)} seconds.`);
}

pipeline();