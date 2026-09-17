import numpy as np
from scipy import stats
from scipy.stats import contingency

# --- HELPERS ---
def helper_anova_ssd(groups):
    flat_data = np.concatenate(groups)
    global_mean = np.mean(flat_data)
    ss_total = np.sum((flat_data - global_mean)**2)
    ss_within = sum(np.sum((g - np.mean(g))**2) for g in groups)
    ss_between = sum(len(g) * (np.mean(g) - global_mean)**2 for g in groups)
    eta_sq = ss_between / ss_total if ss_total != 0 else 0
    return ss_within, ss_between, ss_total, eta_sq

def helper_safe_pearson(x, y):
    if np.std(x) == 0 or np.std(y) == 0:
        return 0.0
    return stats.pearsonr(x, y)[0]

print("=========================================================")
print("   BIVARIATE AND MATRIX STATISTICAL FUNCTIONS (SciPy)    ")
print("=========================================================\n")


# ---------------------------------------------------------
print("DESCRIBE: Contingency Table and Matrix Operations")
# ---------------------------------------------------------
contingencyTable = np.array([[10, 20], [30, 40]])

print("  it: should calculate total count correctly")
print(f"      Total Count: {np.sum(contingencyTable)}")

print("  it: should extract a specific column correctly (Col 0)")
print(f"      Column 0: {contingencyTable[:, 0].tolist()}")

print("  it: should extract all columns via getColumns")
print(f"      All Columns: {contingencyTable.T.tolist()}")

print("  it: should calculate combination table (marginal totals)")
row_sums = contingencyTable.sum(axis=1, keepdims=True)
col_sums = contingencyTable.sum(axis=0)
grand_tot = contingencyTable.sum()
comb = np.hstack((contingencyTable, row_sums))
comb = np.vstack((comb, np.append(col_sums, grand_tot)))
print(f"      Combination Table:\n{comb}\n")


# ---------------------------------------------------------
print("DESCRIBE: Chi-Square Calculations with Larger and Fractional Data")
# ---------------------------------------------------------
fractionalTable1 = np.array([
    [2.5, 5.5, 12.0], [4.5, 6.5, 9.0], 
    [6.5, 8.5, 5.0], [6.5, 9.5, 24.0]
])
print("  it: Table 5 (4x3 matrix with fractions)")
print(f"      Chi-Square: {stats.chi2_contingency(fractionalTable1, correction=False)[0]}")

fractionalTable2 = np.array([
    [2.5, 6.5, 9.5, 11.5], [5.5, 9.5, 14.5, 20.5], [2.0, 4.0, 6.0, 8.0]
])
print("  it: Table 6 (3x4 matrix with fractions)")
print(f"      Chi-Square: {stats.chi2_contingency(fractionalTable2, correction=False)[0]}")

fractionalTable3 = np.array([
    [20.5, 19.5, 21.0, 19.0, 20.0], [18.5, 21.5, 19.5, 20.5, 20.0],
    [22.0, 18.0, 20.5, 19.5, 20.0], [19.0, 21.0, 19.0, 21.0, 20.0],
    [20.0, 20.0, 20.0, 20.0, 20.0]
])
print("  it: Table 7 (5x5 matrix with fractions)")
print(f"      Chi-Square: {stats.chi2_contingency(fractionalTable3, correction=False)[0]}\n")


# ---------------------------------------------------------
print("DESCRIBE: Independence Test and Association (Cramér V)")
# ---------------------------------------------------------
t1 = np.array([[10, 20], [30, 40]])
print("  it: Table 1 (2x2 asymmetric)")
print(f"      Cramér V: {contingency.association(t1, method='cramer')}")

t2 = np.array([[10, 20], [20, 40]])
print("  it: Table 2 (2x2 independent)")
print(f"      Cramér V: {contingency.association(t2, method='cramer')}")

t3 = np.array([[20, 6], [25, 12], [38, 40]])
print("  it: Table 3 (3x2 non-square)")
print(f"      Cramér V: {contingency.association(t3, method='cramer')}")

t4 = np.array([[50, 10, 20], [15, 45, 30], [25, 20, 55]])
print("  it: Table 4 (3x3 square)")
print(f"      Cramér V: {contingency.association(t4, method='cramer')}\n")


# ---------------------------------------------------------
print("DESCRIBE: ANOVA SSD and Eta Squared")
# ---------------------------------------------------------
g1 = [np.array([2, 4]), np.array([3, 5]), np.array([4, 6])]
w1, b1, t1, eta1 = helper_anova_ssd(g1)
print("  it: should calculate exact Within, Between, Total SSD, and Eta Sq (Group Table / Table 1)")
print(f"      Within: {w1} | Between: {b1} | Total: {t1} | EtaSq: {eta1}")

g2 = [np.array([1, 2, 3]), np.array([3, 4, 5]), np.array([5, 6, 7])]
w2, b2, t2, eta2 = helper_anova_ssd(g2)
print("  it: should satisfy SSD partition identity and calculate Eta Sq (Table 2)")
print(f"      Within: {w2} | Between: {b2} | Total: {t2} | EtaSq: {eta2} | W+B=T: {w2+b2==t2}")

g3 = [np.array([10, 12, 14]), np.array([20, 22]), np.array([30, 32, 34, 36])]
w3, b3, t3, eta3 = helper_anova_ssd(g3)
print("  it: Table 3 (3 groups of unequal sizes)")
print(f"      Within: {w3} | Between: {b3} | Total: {t3} | EtaSq: {eta3}")

g4 = [
    np.array([5, 7, 8, 10]), np.array([12, 14, 15, 19]),
    np.array([20, 21, 23, 24]), np.array([30, 32, 35, 39])
]
w4, b4, t4, eta4 = helper_anova_ssd(g4)
print("  it: Table 4 (4 groups of 4 larger datasets)")
print(f"      Within: {w4} | Between: {b4} | Total: {t4} | EtaSq: {eta4}\n")


# ---------------------------------------------------------
print("DESCRIBE: Covariance and Pearson Correlation")
# ---------------------------------------------------------
x, y = np.array([1, 2, 3, 4, 5]), np.array([2, 4, 6, 8, 10])
print("  it: should calculate population and sample covariance")
print(f"      Pop Cov (ddof=0): {np.cov(x, y, ddof=0)[0, 1]}")
print(f"      Sam Cov (ddof=1): {np.cov(x, y, ddof=1)[0, 1]}")

print("  it: should calculate Pearson correlation coefficient")
print(f"      [1..5] & [2..10]: {helper_safe_pearson(x, y)}")
print(f"      Zero var test:    {helper_safe_pearson([5, 5, 5], [1, 2, 3])}")
print(f"      General arrays:   {helper_safe_pearson([5, 7, 9, 11, 12, 23], [1, 4, 6, 7, 9, 10])}")

print("  it: should correctly compute negative linear correlation")
print(f"      Pearson: {helper_safe_pearson([1, 2, 3, 4, 5], [5, 4, 2, 1, 0])}")

print("  it: should compute accurate correlation for real decimal data")
print(f"      Pearson: {helper_safe_pearson([10, 20, 30, 40, 50], [12, 24, 28, 42, 58])}")

print("  it: should be numerically stable with large numbers and offsets")
x_large = [1e9 + 1, 1e9 + 2, 1e9 + 3, 1e9 + 4, 1e9 + 5]
y_large = [100.5, 200.5, 300.5, 400.5, 500.5]
print(f"      Pearson: {helper_safe_pearson(x_large, y_large)}")

print("  it: should handle zero variance (constant array) safely")
print(f"      Pearson: {helper_safe_pearson([5, 5, 5, 5, 5], [1, 2, 3, 4, 5])}\n")


# ---------------------------------------------------------
print("DESCRIBE: Ranks and Spearman Correlation")
# ---------------------------------------------------------
print("  describe: getRanks")
print("  it: should compute fractional ranks correctly")
print(f"      Ranks of [10, 20, 20, 30]: {stats.rankdata([10, 20, 20, 30])}")

print("\n  describe: rankCorrelation (Spearman)")
print("  it: should calculate exact Spearman rank correlation coefficient")
print(f"      Spearman: {stats.spearmanr([1, 2, 3, 4, 5], [1, 2, 4, 3, 5])[0]}")

print("  it: should return 1 for perfectly monotonic increasing data")
print(f"      Spearman: {stats.spearmanr([10, 20, 30, 40], [5, 15, 25, 35])[0]}")

print("  it: should return -1 for perfectly monotonic decreasing data")
print(f"      Spearman: {stats.spearmanr([1, 2, 3, 4], [40, 30, 20, 10])[0]}")

print("  it: should correctly handle tied ranks")
print(f"      Spearman: {stats.spearmanr([10, 20, 20, 30, 40], [1, 2, 3, 3, 5])[0]}")

print("  it: should calculate Spearman correlation for small sample with single tie")
print(f"      Spearman: {stats.spearmanr([5, 10, 10, 15, 20], [2, 4, 6, 6, 10])[0]}")

print("  it: should calculate Spearman correlation with multiple and triple ties")
print(f"      Spearman: {stats.spearmanr([10, 10, 10, 20, 30, 40], [5, 15, 25, 25, 25, 50])[0]}")

print("  it: should calculate Spearman correlation for negative association with ties")
print(f"      Spearman: {stats.spearmanr([1, 2, 3, 3, 5, 6], [10, 8, 8, 4, 2, 1])[0]}")

print("  it: should calculate Spearman correlation when values repeat in sequence")
print(f"      Spearman: {stats.spearmanr([100, 100, 200, 200, 300, 300], [10, 30, 20, 40, 30, 50])[0]}")