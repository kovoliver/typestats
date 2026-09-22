import time

import numpy as np
import pandas as pd
import pingouin as pg
import statsmodels.api as sm
from scipy import stats
from scipy.stats.contingency import association
from sklearn.metrics import mean_squared_error


def measure(label: str, start_time: float) -> float:
    end_time = time.perf_counter()
    print(f"⏱️ [Time] {label}: {round(end_time - start_time, 4)} s")
    return end_time


def pipeline():
    t0 = time.perf_counter()
    t_step = t0

    print("=== 1. LOADING & INITIAL SUMMARY ===")
    df = pd.read_csv("stat_dataset.csv", sep=",", parse_dates=["date"])
    t_step = measure("Data loading and type conversion", t_step)

    print(df.describe(include="all"))
    t_step = measure("Initial descriptive statistics (describe)", t_step)

    print("\n=== 1.5 DATA ORDERING ===")
    df = df.sort_values("date", kind="stable", ignore_index=True)
    t_step = measure("Ordering by date ascending (orderByAsc)", t_step)

    print("\n=== 2. CATEGORICAL DATA CLEANING ===")
    t_fill_start = time.perf_counter()
    df = df.fillna({"device": "Unknown", "payment_method": "Unknown"})
    t_step = measure("Categorical missing data imputation (fillNa)", t_fill_start)

    print(df.describe(include="all"))
    t_step = measure("Descriptive statistics after categorical cleaning (describe)", t_step)

    print("\n=== 3. OUTLIER ANALYSIS & SINGLE-PASS TS CLEANING ===")
    num_cols = ["ad_spend", "revenue"]

    t_count_init_start = time.perf_counter()
    q = df[num_cols].quantile([0.25, 0.75])
    iqr = q.loc[0.75] - q.loc[0.25]
    lower = q.loc[0.25] - 1.5 * iqr
    upper = q.loc[0.75] + 1.5 * iqr
    is_outlier = df[num_cols].lt(lower) | df[num_cols].gt(upper)
    outliers_init = is_outlier.sum()
    print(f"Initial outliers -> Ad Spend: {outliers_init['ad_spend']}, Revenue: {outliers_init['revenue']}")
    t_step = measure("Counting initial outliers", t_count_init_start)

    t_replace_start = time.perf_counter()
    df[num_cols] = (
        df[num_cols]
        .mask(is_outlier)
        .interpolate(method="linear", limit_direction="both")
    )
    t_step = measure(
        "Single-pass time-series cleaning and outlier replacement (ad_spend + revenue)",
        t_replace_start,
    )

    t_count_after_start = time.perf_counter()
    q2 = df[num_cols].quantile([0.25, 0.75])
    iqr2 = q2.loc[0.75] - q2.loc[0.25]
    outliers_after = (
        df[num_cols].lt(q2.loc[0.25] - 1.5 * iqr2) | df[num_cols].gt(q2.loc[0.75] + 1.5 * iqr2)
    ).sum()
    print(f"Outliers after IQR treatment -> Ad Spend: {outliers_after['ad_spend']}, Revenue: {outliers_after['revenue']}")
    t_step = measure("Counting outliers after treatment", t_count_after_start)

    print("\n=== 4. CORRELATION ANALYSIS ===")
    t_corr_start = time.perf_counter()
    correlation = df[num_cols].corr(method="pearson")
    print("Pearson Correlation Matrix:")
    print(correlation.round(4))
    t_step = measure("Pearson correlation calculation", t_corr_start)

    print("\n=== 5. ANOVA & EFFECT SIZE (Categorical vs. Numeric) ===")
    t_anova_start = time.perf_counter()
    
    anova_table = pg.anova(data=df, dv="revenue", between="payment_method", detailed=True)
    print(anova_table.to_string(index=False))

    alpha = 0.05
    f_val = anova_table.loc[0, "F"]
    df_between = int(anova_table.loc[0, "DF"])
    df_within = int(anova_table.loc[1, "DF"])
    ms_between = anova_table.loc[0, "MS"]
    ms_within = anova_table.loc[1, "MS"]
    eta_squared = anova_table.loc[0, "np2"]
    
    f_critical = stats.f.ppf(1 - alpha, df_between, df_within)
    h0_passed = f_val <= f_critical

    print("\n--- One-Way ANOVA Hypothesis Test Results ---")
    print(f"F-Statistic: {round(f_val, 4)}")
    print(f"Mean Squares: MS Between = {round(ms_between, 4)}, MS Within = {round(ms_within, 4)}")
    print(f"Critical Upper Bound (alpha = {alpha}): {round(f_critical, 4)}")
    print(f"Hypothesis Result (H0: equal group means): {'FAILED TO REJECT H0 (No significant difference)' if h0_passed else 'REJECT H0 (Statistically significant difference)'}")
    print(f"Strength of association between payment method and revenue (Eta Squared): {round(eta_squared, 4)}")
    t_step = measure("ANOVA, hypothesis test, and Eta-squared calculation", t_anova_start)

    print("\n=== 6. CHI-SQUARED TEST & CRAMÉR'S V (Categorical vs. Categorical) ===")
    t_cramer_start = time.perf_counter()
    
    contingency_table = pd.crosstab(df["device"], df["payment_method"], margins=True, margins_name="Total")
    print(contingency_table)

    observed = pd.crosstab(df["device"], df["payment_method"]).values
    chi2_val, p_val, dof, expected = stats.chi2_contingency(observed)
    
    chi2_critical = stats.chi2.ppf(1 - alpha, dof)
    chi2_h0_passed = chi2_val <= chi2_critical
    
    cramer_v = association(observed, method="cramer")

    print("\n--- Chi-Squared Test of Independence Results ---")
    print(f"Chi-Square Statistic (chi2): {round(chi2_val, 4)}")
    print(f"Critical Upper Bound (alpha = {alpha}): {round(chi2_critical, 4)}")
    print(f"Hypothesis Result (H0: variables are independent): {'FAILED TO REJECT H0 (Variables are independent)' if chi2_h0_passed else 'REJECT H0 (Statistically significant association)'}")
    print(f"Cramér's V (device vs. payment method): {round(cramer_v, 4)}")
    t_step = measure("Contingency table, Chi-squared test, and Cramér's V calculation", t_cramer_start)

    print("\n=== 7. TIME-SERIES TREND ANALYSIS (Revenue) ===")
    revenue = df["revenue"].to_numpy()
    ad_spend = df["ad_spend"].to_numpy()
    ln_revenue = np.log(revenue)
    
    t_0based = np.arange(0, len(revenue))
    t_1based = np.arange(1, len(revenue) + 1)
    ln_t = np.log(t_1based)

    t_lin_trend_start = time.perf_counter()
    lin_trend = stats.linregress(t_0based, revenue)
    lin_pred = lin_trend.intercept + lin_trend.slope * t_0based
    lin_trend_mse = mean_squared_error(revenue, lin_pred)
    t_lin_trend = measure("  - Linear trend", t_lin_trend_start)

    exp_trend = stats.linregress(t_0based, ln_revenue)
    exp_a = np.exp(exp_trend.intercept)
    exp_b_factor = np.exp(exp_trend.slope)
    exp_pred = exp_a * np.exp(exp_trend.slope * t_0based)
    exp_trend_mse = mean_squared_error(revenue, exp_pred)
    t_exp_trend = measure("  - Exponential trend", t_lin_trend)

    log_trend = stats.linregress(ln_t, revenue)
    log_pred = log_trend.intercept + log_trend.slope * ln_t
    log_trend_mse = mean_squared_error(revenue, log_pred)
    measure("  - Logarithmic trend", t_exp_trend)

    print(pd.DataFrame({
        "Linear": {"intercept_a": lin_trend.intercept, "slope_b": lin_trend.slope, "mse": lin_trend_mse},
        "Exponential": {"intercept_a": exp_a, "slope_b": exp_b_factor, "mse": exp_trend_mse},
        "Logarithmic": {"intercept_a": log_trend.intercept, "slope_b": log_trend.slope, "mse": log_trend_mse},
    }).T.round(4))
    t_step = measure("Full trend analysis block", t_lin_trend_start)

    print("\n=== 8. BIVARIATE REGRESSION MODELS (Ad Spend -> Revenue) ===")
    t_lin_reg_start = time.perf_counter()
    
    lin_reg = sm.OLS(revenue, sm.add_constant(ad_spend)).fit()
    lin_pred = lin_reg.predict(sm.add_constant(ad_spend))
    lin_rsd = np.sqrt(np.sum((revenue - lin_pred) ** 2) / lin_reg.df_resid)
    t_lin_reg = measure("  - Linear regression", t_lin_reg_start)

    exp_reg = sm.OLS(ln_revenue, sm.add_constant(ad_spend)).fit()
    exp_b0 = np.exp(exp_reg.params[0])
    exp_b1_factor = np.exp(exp_reg.params[1])
    exp_pred = exp_b0 * np.exp(exp_reg.params[1] * ad_spend)
    exp_rsd = np.sqrt(np.sum((revenue - exp_pred) ** 2) / exp_reg.df_resid)
    t_exp_reg = measure("  - Exponential regression", t_lin_reg)

    pow_reg = sm.OLS(ln_revenue, sm.add_constant(np.log(ad_spend))).fit()
    pow_b0 = np.exp(pow_reg.params[0])
    pow_b1 = pow_reg.params[1]
    pow_pred = pow_b0 * (ad_spend ** pow_b1)
    pow_rsd = np.sqrt(np.sum((revenue - pow_pred) ** 2) / pow_reg.df_resid)
    measure("  - Power regression", t_exp_reg)

    print(pd.DataFrame({
        "Linear": {
            "b0_intercept": lin_reg.params[0],
            "b1_slope": lin_reg.params[1],
            "rsd": lin_rsd,
        },
        "Exponential": {
            "b0_intercept": exp_b0,
            "b1_slope": exp_b1_factor,
            "rsd": exp_rsd,
        },
        "Power": {
            "b0_intercept": pow_b0,
            "b1_slope": pow_b1,
            "rsd": pow_rsd,
        },
    }).T.round(4))
    t_step = measure("Full bivariate regression models block", t_lin_reg_start)

    t1 = time.perf_counter()
    print(f"\n🏁 Total pipeline execution time: {round(t1 - t0, 3)} seconds.")


if __name__ == "__main__":
    pipeline()