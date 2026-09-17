import numpy as np
from scipy import stats
from statsmodels.stats.proportion import proportions_ztest

def print_header(title):
    print(f"\n{'='*80}\n{title}\n{'='*80}")

def print_result(test_name, stat_label, stat_val, passed):
    print(f"{test_name:<85} | {stat_label} = {stat_val:>8.4f} | Passed (H0 accepted): {passed}")

def is_passed(p_val, alpha):
    return bool(p_val >= alpha)

# ======================================================================
print_header("describe('zTest')")
def calc_ztest(data, pop_std, alpha, mu0, direction):
    data = np.array(data, dtype=float)
    z = (np.mean(data) - mu0) / (pop_std / np.sqrt(len(data)))
    if direction == 'two-sided':
        p = 2 * (1 - stats.norm.cdf(abs(z)))
    elif direction == 'left':
        p = stats.norm.cdf(z)
    elif direction == 'right':
        p = 1 - stats.norm.cdf(z)
    return z, p

tests = [
    ("two-sided test (H0 accepted)", [1, 2, 3], 0.75, 0.05, 1.5, 'two-sided'),
    ("two-sided test (H0 rejected)", [1, 2, 3], 0.375, 0.05, 1.5, 'two-sided'),
    ("left-sided test (H0 accepted)", [1, 2, 3], 0.375, 0.05, 1.5, 'left'),
    ("left-sided test (H0 rejected)", [-1, -2, -3], 0.75, 0.05, 0, 'left'),
    ("right-sided test (H0 accepted)", [4, 8, 10, 12, 25, 7, 6], 7, 0.1, 7, 'right'),
    ("right-sided test (H0 rejected)", [1, 2, 3], 0.375, 0.05, 1.5, 'right'),
]
for desc, d, std, a, mu, dir_ in tests:
    z, p = calc_ztest(d, std, a, mu, dir_)
    print_result(f"calculates Z test statistic correctly for {desc}", "z", z, is_passed(p, a))


# ======================================================================
print_header("describe('tTest')")
dir_map = {'two-sided': 'two-sided', 'left': 'less', 'right': 'greater'}
tests = [
    ("two-sided test (H0 accepted)", [1, 2, 3], 0.05, 0, 'two-sided'),
    ("two-sided test (H0 rejected)", [4, 8, 10, 12, 25, 7, 6], 0.1, 1, 'two-sided'),
    ("left-sided test (H0 accepted)", [1, 2, 3], 0.05, 0, 'left'),
    ("left-sided test (H0 rejected)", [-1, -2, -3], 0.05, 0, 'left'),
    ("right-sided test (H0 accepted)", [4, 8, 10, 12, 25, 7, 6], 0.1, 7, 'right'),
    ("right-sided test (H0 rejected)", [1, 2, 3], 0.05, 0, 'right'),
]
for desc, d, a, mu, dir_ in tests:
    res = stats.ttest_1samp(d, popmean=mu, alternative=dir_map[dir_])
    print_result(f"calculates t test statistic correctly for {desc}", "t", res.statistic, is_passed(res.pvalue, a))


# ======================================================================
print_header("describe('zTestProportion')")
tests = [
    ("two-sided test (H0 accepted)", 0.5, 0.52, 100, 0.05, 'two-sided'),
    ("two-sided test (H0 rejected)", 0.5, 0.6, 100, 0.05, 'two-sided'),
    ("left-sided test (H0 accepted)", 0.5, 0.6, 100, 0.05, 'left'),
    ("left-sided test (H0 rejected)", 0.5, 0.4, 100, 0.05, 'left'),
    ("right-sided test (H0 accepted)", 0.5, 0.45, 100, 0.05, 'right'),
    ("right-sided test (H0 rejected)", 0.5, 0.6, 100, 0.05, 'right'),
]
for desc, pop_p, samp_p, n, a, dir_ in tests:
    z, p = proportions_ztest(count=samp_p*n, nobs=n, value=pop_p, alternative=dir_map[dir_].replace('less','smaller').replace('greater','larger'), prop_var=pop_p)
    print_result(f"calculates Z test proportion correctly for {desc}", "z", z, is_passed(p, a))


# ======================================================================
print_header("describe('chi2Test')")
def calc_chi2_var_test(data, hyp_var, alpha, direction):
    data = np.array(data, dtype=float)
    df = len(data) - 1
    chi2 = df * np.var(data, ddof=1) / hyp_var
    p_right = 1 - stats.chi2.cdf(chi2, df)
    p_left = stats.chi2.cdf(chi2, df)
    
    if direction == 'two-sided':
        p = 2 * min(p_left, p_right)
    elif direction == 'left':
        p = p_left
    else:
        p = p_right
    return chi2, p

tests = [
    ("two-sided test (H0 accepted)", [1, 2, 3], 1.0, 0.05, 'two-sided'),
    ("two-sided test (H0 rejected)", [1, 2, 3], 0.2, 0.05, 'two-sided'),
    ("left-sided test (H0 accepted)", [1, 2, 3], 1.0, 0.05, 'left'),
    ("left-sided test (H0 rejected)", [1, 2, 3], 50.0, 0.05, 'left'),
    ("right-sided test (H0 accepted)", [1, 2, 3], 1.0, 0.05, 'right'),
    ("right-sided test (H0 rejected)", [1, 2, 3], 0.2, 0.05, 'right'),
]
for desc, d, h_var, a, dir_ in tests:
    chi2, p = calc_chi2_var_test(d, h_var, a, dir_)
    print_result(f"calculates chi2 test correctly for {desc}", "chi2", chi2, is_passed(p, a))


# ======================================================================
print_header("describe('chi2FitTest')")
tests = [
    ("perfect match (H0 accepted)", [10, 10, 10, 10, 10, 10], [10, 10, 10, 10, 10, 10], 0.05, 0),
    ("large deviation (H0 rejected)", [20, 5, 5, 30], [15, 15, 15, 15], 0.05, 0),
    ("estimated parameters specified", [12, 18, 20, 25, 25], [20, 20, 20, 20, 20], 0.05, 1),
]
for desc, obs, exp, a, est_params in tests:
    res = stats.chisquare(f_obs=obs, f_exp=exp, ddof=est_params)
    print_result(f"calculates chi2 fit statistic correctly for {desc}", "chi2", res.statistic, is_passed(res.pvalue, a))


# ======================================================================
print_header("describe('chiSquaredIndependenceTest')")
tests = [
    ("variables are perfectly independent (H0 accepted)", [[10, 10], [10, 10]], 0.05),
    ("strong association (H0 rejected)", [[40, 10], [10, 40]], 0.05),
    ("3x2 table", [[10, 20], [20, 10], [15, 15]], 0.05),
]
for desc, table, a in tests:
    chi2, p, dof, ex = stats.chi2_contingency(table, correction=False)
    print_result(f"calculates chi2 statistic correctly when {desc}", "chi2", chi2, is_passed(p, a))


# ======================================================================
print_header("describe('zTestTwoSamples')")
def calc_ztest_2samp(s1, s2, v1, v2, alpha, direction, mean_diff=0):
    s1, s2 = np.array(s1, dtype=float), np.array(s2, dtype=float)
    z = (np.mean(s1) - np.mean(s2) - mean_diff) / np.sqrt(v1/len(s1) + v2/len(s2))
    if direction == 'two-sided':
        p = 2 * (1 - stats.norm.cdf(abs(z)))
    elif direction == 'left':
        p = stats.norm.cdf(z)
    else:
        p = 1 - stats.norm.cdf(z)
    return z, p

tests = [
    ("two-sided test (H0 accepted)", [10, 12, 14], [10, 12, 14], 4, 4, 0.05, 'two-sided', 0),
    ("two-sided test (H0 rejected)", [20, 22, 24], [10, 12, 14], 3, 3, 0.05, 'two-sided', 0),
    ("custom meanDifference", [20, 22, 24], [10, 12, 14], 3, 3, 0.05, 'two-sided', 10),
    ("left-sided test (H0 rejected)", [10, 12, 14], [20, 22, 24], 3, 3, 0.05, 'left', 0),
    ("right-sided test (H0 accepted)", [10, 12, 14], [20, 22, 24], 3, 3, 0.05, 'right', 0),
]
for desc, s1, s2, v1, v2, a, dir_, diff in tests:
    z, p = calc_ztest_2samp(s1, s2, v1, v2, a, dir_, diff)
    print_result(f"calculates Z test statistic correctly for {desc}", "z", z, is_passed(p, a))


# ======================================================================
print_header("describe('tTestTwoSamples')")
tests = [
    ("Pooled Two-Sample t-test correctly (assumeEqualVariances = true, H0 rejected)", [1, 2, 3, 4], [5, 6, 7, 8], 0.05, 'two-sided', True, 0),
    ("Welch Two-Sample t-test correctly (assumeEqualVariances = false, H0 accepted)", [1, 2, 3], [2, 3, 4, 5], 0.05, 'two-sided', False, 0),
    ("t-test correctly with custom meanDifference", [1, 2, 3, 4], [5, 6, 7, 8], 0.05, 'two-sided', True, -4.0),
    ("left-sided Welch t-test correctly (H0 rejected)", [1, 2, 3, 4], [5, 6, 7, 8], 0.05, 'left', False, 0),
    ("right-sided Pooled t-test correctly (H0 accepted)", [1, 2, 3, 4], [5, 6, 7, 8], 0.05, 'right', True, 0),
]
for desc, s1, s2, a, dir_, eq_var, diff in tests:
    res = stats.ttest_ind(np.array(s1, dtype=float) - diff, np.array(s2, dtype=float), equal_var=eq_var, alternative=dir_map[dir_])
    print_result(f"calculates {desc}", "t", res.statistic, is_passed(res.pvalue, a))


# ======================================================================
print_header("describe('twoSampleAsymptoticZMeanTest')")
def calc_asymptotic_z(s1, s2, alpha, direction, diff=0):
    s1, s2 = np.array(s1, dtype=float), np.array(s2, dtype=float)
    z = (np.mean(s1) - np.mean(s2) - diff) / np.sqrt(np.var(s1, ddof=1)/len(s1) + np.var(s2, ddof=1)/len(s2))
    if direction == 'two-sided':
        p = 2 * (1 - stats.norm.cdf(abs(z)))
    elif direction == 'left':
        p = stats.norm.cdf(z)
    else:
        p = 1 - stats.norm.cdf(z)
    return z, p

tests = [
    ("two-sided test (H0 accepted)", [10, 12, 14], [10, 12, 14], 0.05, 'two-sided', 0),
    ("two-sided test (H0 rejected)", [10, 12, 14], [2, 4, 6], 0.05, 'two-sided', 0),
    ("custom meanDifference", [10, 12, 14], [2, 4, 6], 0.05, 'two-sided', 8.0),
    ("left-sided asymptotic Z test correctly (H0 rejected)", [2, 4, 6], [10, 12, 14], 0.05, 'left', 0),
    ("right-sided asymptotic Z test correctly (H0 accepted)", [2, 4, 6], [10, 12, 14], 0.05, 'right', 0),
]
for desc, s1, s2, a, dir_, diff in tests:
    z, p = calc_asymptotic_z(s1, s2, a, dir_, diff)
    print_result(f"calculates asymptotic Z statistic correctly for {desc}", "z", z, is_passed(p, a))


# ======================================================================
print_header("describe('zTestProportionTwoSamples')")
def calc_ztest_prop2(p1, n1, p2, n2, alpha, direction, pdiff=0):
    if pdiff == 0:
        p_pool = (p1 * n1 + p2 * n2) / (n1 + n2)
        se = np.sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))
    else:
        se = np.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2)
    
    z = (p1 - p2 - pdiff) / se
    if direction == 'two-sided':
        p = 2 * (1 - stats.norm.cdf(abs(z)))
    elif direction == 'left':
        p = stats.norm.cdf(z)
    else:
        p = 1 - stats.norm.cdf(z)
    return z, p

tests = [
    ("Pooled Z statistic correctly when proportions are equal (H0 accepted)", 0.5, 100, 0.5, 100, 0.05, 'two-sided', 0),
    ("Pooled Z statistic correctly for significant difference (H0 rejected)", 0.6, 100, 0.4, 100, 0.05, 'two-sided', 0),
    ("Unpooled Z statistic correctly with non-zero pDifference", 0.6, 100, 0.4, 100, 0.05, 'two-sided', 0.2),
    ("left-sided Z test correctly (H0 rejected)", 0.3, 100, 0.5, 100, 0.05, 'left', 0),
    ("right-sided Z test correctly (H0 accepted)", 0.3, 100, 0.5, 100, 0.05, 'right', 0),
]
for desc, p1, n1, p2, n2, a, dir_, pdiff in tests:
    z, p = calc_ztest_prop2(p1, n1, p2, n2, a, dir_, pdiff)
    print_result(f"calculates {desc}", "z", z, is_passed(p, a))


# ======================================================================
print_header("describe('fTestTwoSamples')")
def calc_f_test(s1, s2, alpha, direction):
    s1, s2 = np.array(s1, dtype=float), np.array(s2, dtype=float)
    v1, v2 = np.var(s1, ddof=1), np.var(s2, ddof=1)
    df1, df2 = len(s1) - 1, len(s2) - 1
    f = v1 / v2
    p_right = 1 - stats.f.cdf(f, df1, df2)
    p_left = stats.f.cdf(f, df1, df2)
    
    if direction == 'two-sided':
        p = 2 * min(p_left, p_right)
    elif direction == 'left':
        p = p_left
    else:
        p = p_right
    return f, p

tests = [
    ("F statistic correctly when sample variances are equal (H0 accepted)", [10, 12, 14], [10, 12, 14], 0.05, 'two-sided'),
    ("F statistic correctly for two-sided test with large variance difference (H0 rejected)", [10, 20, 30, 40, 50], [10, 11, 12, 13, 14], 0.05, 'two-sided'),
    ("left-sided F test correctly when sample1 variance is significantly smaller (H0 rejected)", [10, 11, 12, 13, 14], [10, 20, 30, 40, 50], 0.05, 'left'),
    ("right-sided F test correctly when sample1 variance is larger (H0 rejected)", [10, 20, 30, 40, 50], [10, 11, 12, 13, 14], 0.05, 'right'),
    ("right-sided F test correctly when sample1 variance is smaller (H0 accepted)", [10, 11, 12, 13, 14], [10, 20, 30, 40, 50], 0.05, 'right'),
]
for desc, s1, s2, a, dir_ in tests:
    f, p = calc_f_test(s1, s2, a, dir_)
    print_result(f"calculates {desc}", "F", f, is_passed(p, a))


# ======================================================================
print_header("describe('tTestIndependent')")
tests = [
    ("t-statistic correctly for equal sample means (H0 accepted)", [10, 12, 14], [10, 12, 14], 0.05, 'two-sided'),
    ("t-statistic correctly for significant difference (two-sided, H0 rejected)", [10, 12, 14, 16], [2, 4, 6, 8], 0.05, 'two-sided'),
    ("right-sided independent t-test correctly (H0 rejected)", [10, 12, 14, 16], [2, 4, 6, 8], 0.05, 'right'),
    ("left-sided independent t-test correctly (H0 accepted)", [10, 12, 14, 16], [2, 4, 6, 8], 0.05, 'left'),
    ("negative t-statistic when sample1 mean is smaller", [2, 4, 6, 8], [10, 12, 14, 16], 0.05, 'left'),
]
for desc, s1, s2, a, dir_ in tests:
    res = stats.ttest_ind(np.array(s1, dtype=float), np.array(s2, dtype=float), equal_var=True, alternative=dir_map[dir_])
    print_result(f"calculates {desc}", "t", res.statistic, is_passed(res.pvalue, a))


# ======================================================================
print_header("describe('oneWayAnova')")
tests = [
    ("F statistic and MS values correctly when group means are identical (H0 accepted)", [[10, 12, 14], [10, 12, 14], [10, 12, 14]], 0.05),
    ("F statistic and MS values correctly for significantly different group means (H0 rejected)", [[10, 12, 14], [20, 22, 24], [30, 32, 34]], 0.05),
    ("ANOVA correctly for unbalanced design (unequal group sizes)", [[2, 4, 6], [10, 12, 14, 16]], 0.05),
]
for desc, groups, a in tests:
    formatted_groups = [np.array(g, dtype=float) for g in groups]
    res = stats.f_oneway(*formatted_groups)
    print_result(f"calculates {desc}", "F", res.statistic, is_passed(res.pvalue, a))


# ======================================================================
print_header("describe('bartlett')")
tests = [
    ("chi2 statistic correctly when group variances are identical (H0 accepted)", [[10.0, 12.0, 14.0], [20.0, 22.0, 24.0], [30.0, 32.0, 34.0]], 0.05),
    ("chi2 statistic correctly for significantly different group variances (H0 rejected)", [[10.0, 11.0, 12.0], [10.0, 20.0, 30.0]], 0.05),
    ("Bartlett test correctly for unbalanced groups (unequal sizes)", [[2.0, 4.0, 6.0], [10.0, 20.0, 30.0, 40.0]], 0.05),
]
for desc, groups, a in tests:
    formatted_groups = [np.array(g, dtype=float) for g in groups]
    res = stats.bartlett(*formatted_groups)
    print_result(f"calculates {desc}", "chi2", res.statistic, is_passed(res.pvalue, a))