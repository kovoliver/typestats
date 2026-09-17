import numpy as np
from scipy import stats

def print_section(title):
    print(f"\n{'='*65}\n{title}\n{'='*65}")

# ---------------------------------------------------------
# 1. Mean Estimation (IID)
# ---------------------------------------------------------
print_section("1. Mean Estimation (IID)")
sample1 = np.array([10, 12, 14, 15, 19])
mean1 = np.mean(sample1)
n1 = len(sample1)
alpha = 0.05
z_crit = stats.norm.ppf(1 - alpha / 2)

# Known variance (sigma = 3.0, z-interval)
sigma = 3.0
margin_z = z_crit * (sigma / np.sqrt(n1))
ci_z = (mean1 - margin_z, mean1 + margin_z)
print(f"IID Mean (Known sigma = 3.0):")
print(f"  Calculated CI: [{ci_z[0]:.6f}, {ci_z[1]:.6f}]")
print(f"  Expected CI:   [11.370432, 16.629568]")

# Unknown variance (t-interval)
s1 = np.std(sample1, ddof=1)
t_crit = stats.t.ppf(1 - alpha / 2, df=n1 - 1)
margin_t = t_crit * (s1 / np.sqrt(n1))
ci_t = (mean1 - margin_t, mean1 + margin_t)
print(f"\nIID Mean (Unknown sigma, t-distribution):")
print(f"  Calculated CI: [{ci_t[0]:.6f}, {ci_t[1]:.6f}]")
print(f"  Expected CI:   [9.789313, 18.210687]")

# ---------------------------------------------------------
# 2. Proportion Estimation
# ---------------------------------------------------------
print_section("2. Proportion Estimation")
p = 0.5
n_prop = 100

# Wald IID
se_prop_iid = np.sqrt(p * (1 - p) / n_prop)
ci_prop_iid = (p - z_crit * se_prop_iid, p + z_crit * se_prop_iid)
print(f"Proportion Estimation IID (p=0.5, n=100, Wald):")
print(f"  Calculated CI: [{ci_prop_iid[0]:.6f}, {ci_prop_iid[1]:.6f}]")
print(f"  Expected CI:   [0.402002, 0.597998]")

# SRS with FPC (N = 1000)
N_prop = 1000
fpc_prop = np.sqrt(1 - n_prop / N_prop)
se_prop_srs = se_prop_iid * fpc_prop
ci_prop_srs = (p - z_crit * se_prop_srs, p + z_crit * se_prop_srs)
print(f"\nProportion Estimation SRS with FPC (N=1000):")
print(f"  Calculated CI: [{ci_prop_srs[0]:.6f}, {ci_prop_srs[1]:.6f}]")
print(f"  Interval Width (SRS vs IID): {ci_prop_srs[1]-ci_prop_srs[0]:.6f} < {ci_prop_iid[1]-ci_prop_iid[0]:.6f}")

# SRS for Large N (N = 10,000,000)
N_huge = 10_000_000
fpc_huge = np.sqrt(1 - n_prop / N_huge)
ci_prop_huge = (p - z_crit * se_prop_iid * fpc_huge, p + z_crit * se_prop_iid * fpc_huge)
print(f"\nProportion Estimation SRS (N=10 000 000 -> Converges to IID):")
print(f"  Calculated CI: [{ci_prop_huge[0]:.6f}, {ci_prop_huge[1]:.6f}]")

# ---------------------------------------------------------
# 3. SRS Mean Estimation with FPC
# ---------------------------------------------------------
print_section("3. SRS Mean Estimation with FPC")
sample_srs = np.array([20, 22, 19, 24, 25])
mean_srs = np.mean(sample_srs)
n_srs = len(sample_srs)
N_srs = 500
fpc_mean = np.sqrt(1 - n_srs / N_srs)

# Known variance (sigma = 4.0)
sigma_srs = 4.0
margin_srs_z = z_crit * (sigma_srs / np.sqrt(n_srs)) * fpc_mean
ci_srs_z = (mean_srs - margin_srs_z, mean_srs + margin_srs_z)
print(f"SRS Mean (Known sigma = 4.0, N=500):")
print(f"  Calculated CI: [{ci_srs_z[0]:.6f}, {ci_srs_z[1]:.6f}]")
print(f"  Expected CI:   [18.511484, 25.488516]")

# Unknown variance
s_srs = np.std(sample_srs, ddof=1)
t_crit_srs = stats.t.ppf(1 - alpha / 2, df=n_srs - 1)
margin_srs_t = t_crit_srs * (s_srs / np.sqrt(n_srs)) * fpc_mean
ci_srs_t = (mean_srs - margin_srs_t, mean_srs + margin_srs_t)
print(f"\nSRS Mean (Unknown sigma, N=500):")
print(f"  Calculated CI: [{ci_srs_t[0]:.6f}, {ci_srs_t[1]:.6f}]")
print(f"  Expected CI:   [18.850233, 25.149767]")

# ---------------------------------------------------------
# 4. Variance Estimation
# ---------------------------------------------------------
print_section("4. Variance Estimation")
sample_var = np.array([5, 8, 12, 15, 20])
n_var = len(sample_var)
s2 = np.var(sample_var, ddof=1)
chi2_lower = stats.chi2.ppf(1 - alpha / 2, df=n_var - 1)
chi2_upper = stats.chi2.ppf(alpha / 2, df=n_var - 1)
ci_var_lower = (n_var - 1) * s2 / chi2_lower
ci_var_upper = (n_var - 1) * s2 / chi2_upper
print(f"Chi-Square Variance CI (n=5, s^2={s2:.2f}):")
print(f"  Calculated CI: [{ci_var_lower:.6f}, {ci_var_upper:.6f}]")
print(f"  Expected CI:   [12.384138, 284.877608]")

# ---------------------------------------------------------
# 5. Stratified Sampling Estimations
# ---------------------------------------------------------
print_section("5. Stratified Sampling Estimations")
s1_N, s1_data = 400, np.array([10, 12, 14])
s2_N, s2_data = 600, np.array([20, 22, 24, 26])

N_total = s1_N + s2_N
w1, w2 = s1_N / N_total, s2_N / N_total
m1, m2 = np.mean(s1_data), np.mean(s2_data)

st_mean = w1 * m1 + w2 * m2
st_total = N_total * st_mean

v1 = np.var(s1_data, ddof=1)
v2 = np.var(s2_data, ddof=1)
n1_st, n2_st = len(s1_data), len(s2_data)

# Stratified Mean Variance: sum( W_h^2 * (1 - n_h/N_h) * s_h^2 / n_h )
fpc1 = (1 - n1_st / s1_N)
fpc2 = (1 - n2_st / s2_N)
st_var = (w1**2) * fpc1 * (v1 / n1_st) + (w2**2) * fpc2 * (v2 / n2_st)

print(f"Stratified Mean:             {st_mean:.6f}  (Expected: 18.6)")
print(f"Stratified Total:           {st_total:.6f} (Expected: 18600)")
print(f"Stratified Mean Variance:   {st_var:.6f}  (Expected: 0.807733)")

# ---------------------------------------------------------
# 6. Difference Between Two Means and Proportions
# ---------------------------------------------------------
print_section("6. Difference Between Two Means and Proportions")
d1 = np.array([10, 12, 14, 16])
d2 = np.array([8, 9, 11, 13])
m1_d, m2_d = np.mean(d1), np.mean(d2)
n1_d, n2_d = len(d1), len(d2)
diff_mean = m1_d - m2_d

# Known Variance mean diff (var1=4, var2=4)
var1_known, var2_known = 4.0, 4.0
se_diff_known = np.sqrt(var1_known / n1_d + var2_known / n2_d)
ci_diff_known = (diff_mean - z_crit * se_diff_known, diff_mean + z_crit * se_diff_known)
print(f"Two Sample Mean Difference (Known variance = 4, 4):")
print(f"  Calculated CI: [{ci_diff_known[0]:.6f}, {ci_diff_known[1]:.6f}]")
print(f"  Expected CI:   [-0.021808, 5.521808]")

# Pooled t mean diff
s1_d_sq = np.var(d1, ddof=1)
s2_d_sq = np.var(d2, ddof=1)
sp2 = ((n1_d - 1) * s1_d_sq + (n2_d - 1) * s2_d_sq) / (n1_d + n2_d - 2)
se_pooled = np.sqrt(sp2 * (1 / n1_d + 1 / n2_d))
t_crit_pooled = stats.t.ppf(1 - alpha / 2, df=n1_d + n2_d - 2)
ci_diff_pooled = (diff_mean - t_crit_pooled * se_pooled, diff_mean + t_crit_pooled * se_pooled)
print(f"\nTwo Sample Mean Difference (Pooled t-test):")
print(f"  Calculated CI: [{ci_diff_pooled[0]:.6f}, {ci_diff_pooled[1]:.6f}]")
print(f"  Expected CI:   [-1.413946, 6.913946]")

# Proportion difference (40/100 vs 30/100)
p1_hat, p2_hat = 40 / 100, 30 / 100
diff_p = p1_hat - p2_hat
se_p_diff = np.sqrt((p1_hat * (1 - p1_hat) / 100) + (p2_hat * (1 - p2_hat) / 100))
ci_p_diff = (diff_p - z_crit * se_p_diff, diff_p + z_crit * se_p_diff)
print(f"\nProportion Difference (40/100 vs 30/100):")
print(f"  Calculated CI: [{ci_p_diff[0]:.6f}, {ci_p_diff[1]:.6f}]")
print(f"  Expected CI:   [-0.031478, 0.231478]")

# Paired mean difference
pair1 = np.array([12, 15, 18])
pair2 = np.array([10, 13, 15])
diffs = pair1 - pair2
mean_diffs = np.mean(diffs)
n_pair = len(diffs)
s_diffs = np.std(diffs, ddof=1)
t_crit_pair = stats.t.ppf(1 - alpha / 2, df=n_pair - 1)
margin_pair = t_crit_pair * (s_diffs / np.sqrt(n_pair))
ci_paired = (mean_diffs - margin_pair, mean_diffs + margin_pair)
print(f"\nPaired Mean Difference CI:")
print(f"  Calculated CI: [{ci_paired[0]:.6f}, {ci_paired[1]:.6f}]")
print(f"  Expected CI:   [0.899116, 3.767551]")