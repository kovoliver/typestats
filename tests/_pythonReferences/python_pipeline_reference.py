import time
import pandas as pd
import numpy as np
from scipy import stats
from scipy.stats.contingency import association
import statsmodels.api as sm
from statsmodels.formula.api import ols
from sklearn.metrics import mean_squared_error

def describe_df(df: pd.DataFrame, title: str):
    print(f"\n--- {title} ---")
    print(f"Shape: {df.shape[0]} rows x {df.shape[1]} columns\n")
    
    overview = []
    for col in df.columns:
        missing = df[col].isna().sum()
        valid = df[col].count()
        total = len(df)
        missing_pct = round((missing / total) * 100, 2) if total > 0 else 0
        overview.append({
            'label': col,
            'type': str(df[col].dtype),
            'missing': missing,
            'valid': valid,
            'missing %': f"{missing_pct}%"
        })
    print(pd.DataFrame(overview).to_string(index=False))

def count_outliers_iqr(series: pd.Series) -> int:
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr_val = stats.iqr(series)
    lower_bound = q1 - 1.5 * iqr_val
    upper_bound = q3 + 1.5 * iqr_val
    return ((series < lower_bound) | (series > upper_bound)).sum()

def replace_outliers_iqr(series: pd.Series) -> pd.Series:
    s = series.copy()
    q1 = s.quantile(0.25)
    q3 = s.quantile(0.75)
    iqr_val = stats.iqr(s)
    lower_bound = q1 - 1.5 * iqr_val
    upper_bound = q3 + 1.5 * iqr_val
    
    outliers_mask = (s < lower_bound) | (s > upper_bound)
    median_val = s[~outliers_mask].median()
    s[outliers_mask] = median_val
    return s

def pipeline():
    t0 = time.perf_counter()

    print("=== 1. LOADING & INITIAL SUMMARY ===")
    df = pd.read_csv("stat_dataset.csv", sep=",")
    describe_df(df, "Initial Dataset Summary")

    print("\n=== 2. DATA CLEANING & IMPUTATION ===")
    df = df.dropna(subset=["device", "payment_method"]).copy()
    
    df["ad_spend"] = df["ad_spend"].fillna(df["ad_spend"].median())
    df["revenue"] = df["revenue"].fillna(df["revenue"].median())
    
    describe_df(df, "Cleaned Dataset Summary")

    print("\n=== 3. OUTLIER ANALYSIS & TREATMENT ===")
    outliers_ad_spend = count_outliers_iqr(df["ad_spend"])
    outliers_revenue = count_outliers_iqr(df["revenue"])
    print(f"Initial outliers -> Ad Spend: {outliers_ad_spend}, Revenue: {outliers_revenue}")

    df["ad_spend"] = replace_outliers_iqr(df["ad_spend"])
    df["revenue"] = replace_outliers_iqr(df["revenue"])
    df = df.sort_values(by="date", ascending=True).reset_index(drop=True)

    outliers_ad_spend_new = count_outliers_iqr(df["ad_spend"])
    outliers_revenue_new = count_outliers_iqr(df["revenue"])
    print(f"Outliers after IQR treatment -> Ad Spend: {outliers_ad_spend_new}, Revenue: {outliers_revenue_new}")

    print("\n=== 4. CORRELATION ANALYSIS ===")
    corr_matrix = df[["ad_spend", "revenue"]].corr(method="pearson").round(4)
    print("Pearson Correlation Matrix:")
    print(corr_matrix.to_string())

    print("\n=== 5. ANOVA (Categorical vs. Numeric) via statsmodels ===")
    model = ols('revenue ~ C(payment_method)', data=df).fit()
    anova_table = sm.stats.anova_lm(model, typ=2)
    
    ss_between = anova_table.loc['C(payment_method)', 'sum_sq']
    ss_total = anova_table['sum_sq'].sum()
    eta_squared = ss_between / ss_total

    anova_summary = df.groupby("payment_method")["revenue"].agg(["count", "mean", "std"]).round(4)
    print(anova_summary.to_string())
    print(f"Strength of association between payment method and revenue (Eta Squared): {round(eta_squared, 4)}")

    print("\n=== 6. CRAMÉR'S V (Categorical vs. Categorical) via scipy.stats ===")
    contingency = pd.crosstab(df["device"], df["payment_method"])
    print(contingency.to_string())
    
    cramer_v_val = association(contingency, method="cramer")
    print(f"Cramér's V (device vs. payment method): {round(cramer_v_val, 4)}")

    print("\n=== 7. TIME-SERIES TREND ANALYSIS (Revenue) via scipy.stats.linregress ===")
    y_revenue = df["revenue"].values
    t_steps_0 = np.arange(0, len(y_revenue))
    t_steps_1 = np.arange(1, len(y_revenue) + 1)

    res_lin = stats.linregress(t_steps_0, y_revenue)
    b_lin_t, a_lin_t = res_lin.slope, res_lin.intercept
    pred_lin_t = a_lin_t + b_lin_t * t_steps_0
    mse_lin_t = mean_squared_error(y_revenue, pred_lin_t)

    res_exp = stats.linregress(t_steps_0, np.log(y_revenue))
    b_exp_kiteny, ln_a_exp_t = res_exp.slope, res_exp.intercept
    a_exp_t = np.exp(ln_a_exp_t)
    B_exp_t = np.exp(b_exp_kiteny)
    pred_exp_t = a_exp_t * (B_exp_t ** t_steps_0)
    mse_exp_t = mean_squared_error(y_revenue, pred_exp_t)

    # 7.3 Logaritmikus trend (y = a + b * ln(t))
    res_log = stats.linregress(np.log(t_steps_1), y_revenue)
    b_log_t, a_log_t = res_log.slope, res_log.intercept
    pred_log_t = a_log_t + b_log_t * np.log(t_steps_1)
    mse_log_t = mean_squared_error(y_revenue, pred_log_t)

    trend_results = pd.DataFrame({
        "intercept_a": [round(a_lin_t, 4), round(a_exp_t, 4), round(a_log_t, 4)],
        "slope_b": [round(b_lin_t, 4), round(B_exp_t, 4), round(b_log_t, 4)],
        "mse": [round(mse_lin_t, 4), round(mse_exp_t, 4), round(mse_log_t, 4)]
    }, index=["Linear", "Exponential", "Logarithmic"])
    print(trend_results.to_string())

    print("\n=== 8. BIVARIATE REGRESSION MODELS (Ad Spend -> Revenue) via scipy.stats.linregress ===")
    x_ad = df["ad_spend"].values
    y_rev = df["revenue"].values
    n = len(df)

    reg_lin = stats.linregress(x_ad, y_rev)
    b1_reg_lin, b0_reg_lin = reg_lin.slope, reg_lin.intercept
    pred_reg_lin = b0_reg_lin + b1_reg_lin * x_ad
    rsd_lin = np.sqrt(np.sum((y_rev - pred_reg_lin) ** 2) / (n - 2))

    reg_exp = stats.linregress(x_ad, np.log(y_rev))
    b1_reg_exp_kiteny, ln_b0_reg_exp = reg_exp.slope, reg_exp.intercept
    b0_reg_exp = np.exp(ln_b0_reg_exp)
    B1_reg_exp = np.exp(b1_reg_exp_kiteny)
    pred_reg_exp = b0_reg_exp * (B1_reg_exp ** x_ad)
    rsd_exp = np.sqrt(np.sum((y_rev - pred_reg_exp) ** 2) / (n - 2))

    reg_pow = stats.linregress(np.log(x_ad), np.log(y_rev))
    b1_reg_pow, ln_b0_reg_pow = reg_pow.slope, reg_pow.intercept
    b0_reg_pow = np.exp(ln_b0_reg_pow)
    pred_reg_pow = b0_reg_pow * (x_ad ** b1_reg_pow)
    rsd_pow = np.sqrt(np.sum((y_rev - pred_reg_pow) ** 2) / (n - 2))

    regression_results = pd.DataFrame({
        "b0_intercept": [round(b0_reg_lin, 4), round(b0_reg_exp, 4), round(b0_reg_pow, 4)],
        "b1_slope": [round(b1_reg_lin, 4), round(B1_reg_exp, 4), round(b1_reg_pow, 4)],
        "rsd": [round(rsd_lin, 4), round(rsd_exp, 4), round(rsd_pow, 4)]
    }, index=["Linear", "Exponential", "Power"])
    print(regression_results.to_string())

    t1 = time.perf_counter()
    print(f"\nPython: Pipeline execution completed in {round(t1 - t0, 3)} seconds.")

if __name__ == "__main__":
    pipeline()