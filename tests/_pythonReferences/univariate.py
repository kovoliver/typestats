import numpy as np
import scipy.stats as stats
import statistics
from sklearn.metrics import mean_squared_error

print("==================================================================")
print("UNIVARIATE STATISTICS - PYTHON REFERENCE VERIFICATION SCRIPT")
print("(MIXED FLOAT & INTEGER DATASETS)")
print("==================================================================\n")

# --- 1. MEAN ---
print("--- Mean ---")
print("mean([1.25, 2.5, 3.75, 4.2, 5.8]):", statistics.mean([1.25, 2.5, 3.75, 4.2, 5.8]))
print("mean([10.5, 20, 30.25]):", statistics.mean([10.5, 20, 30.25]))
print("mean([2.5, 7.5, 10, 20.6]):", statistics.mean([2.5, 7.5, 10, 20.6]))
print("mean([-10.5, 0, 10.2, 20.8]):", statistics.mean([-10.5, 0, 10.2, 20.8]))
print("mean([100.1, 200, 300.3, 400.4, 500]):", statistics.mean([100.1, 200, 300.3, 400.4, 500]))

# --- 2. GEOMETRIC MEAN ---
print("\n--- Geometric Mean ---")
print("geometric_mean([2.5, 8.0]):", statistics.geometric_mean([2.5, 8.0]))
print("geometric_mean([1.5, 3, 9.25]):", statistics.geometric_mean([1.5, 3, 9.25]))
print("geometric_mean([4.2, 16.8, 64]):", statistics.geometric_mean([4.2, 16.8, 64]))
print("geometric_mean([10.5, 100, 1000.25]):", statistics.geometric_mean([10.5, 100, 1000.25]))
print("geometric_mean([1.5, 6, 24.8]):", statistics.geometric_mean([1.5, 6, 24.8]))

# --- 3. WEIGHTED MEAN ---
print("\n--- Weighted Mean ---")
print("weighted_mean([10.5, 20], [1.5, 3]):", np.average([10.5, 20], weights=[1.5, 3]))
print("weighted_mean([1.2, 2.4, 3, 4.8], [0.5, 1, 1.5, 2]):", np.average([1.2, 2.4, 3, 4.8], weights=[0.5, 1, 1.5, 2]))
print("weighted_mean([10, 20.5, 30.25], [0.2, 0.3, 0.5]):", np.average([10, 20.5, 30.25], weights=[0.2, 0.3, 0.5]))
print("weighted_mean([5.5, 15, 25.25], [2.5, 1, 1]):", np.average([5.5, 15, 25.25], weights=[2.5, 1, 1]))
print("weighted_mean([100.5, 200, 300.25], [1, 2.5, 1]):", np.average([100.5, 200, 300.25], weights=[1, 2.5, 1]))

# --- 4. HARMONIC MEAN ---
print("\n--- Harmonic Mean ---")
print("harmonic_mean([10.5, 20], weights=[1.5, 1]):", statistics.harmonic_mean([10.5, 20], weights=[1.5, 1]))
print("harmonic_mean([1.2, 2.5, 4], weights=[1, 1.5, 1]):", statistics.harmonic_mean([1.2, 2.5, 4], weights=[1, 1.5, 1]))
print("harmonic_mean([5.5, 10, 20.25], weights=[1, 2.5, 1]):", statistics.harmonic_mean([5.5, 10, 20.25], weights=[1, 2.5, 1]))
print("harmonic_mean([2.5, 3.5, 6], weights=[1, 1, 1]):", statistics.harmonic_mean([2.5, 3.5, 6], weights=[1, 1, 1]))
print("harmonic_mean([10.2, 30, 60.5], weights=[2, 1, 2.5]):", statistics.harmonic_mean([10.2, 30, 60.5], weights=[2, 1, 2.5]))

# --- 5. SSD, VARIANCE & STD ---
print("\n--- SSD, Variance & Std ---")
for d in [[1.25, 2.5, 3.75, 4.2, 5.8], [2.5, 4, 6.25, 8.75], [10.1, 20.2, 30.3], [5.5, 5.5, 5.5], [-2.5, -1, 0, 1.25, 2]]:
    arr = np.array(d)
    print(f"ssd({d}):", np.sum((arr - np.mean(arr)) ** 2))

print("pvariance([1.25, 2.5, 3.75, 4.2, 5.8]):", statistics.pvariance([1.25, 2.5, 3.75, 4.2, 5.8]))
print("variance([1.25, 2.5, 3.75, 4.2, 5.8]):", statistics.variance([1.25, 2.5, 3.75, 4.2, 5.8]))
print("pvariance([10.5, 20, 30.25]):", statistics.pvariance([10.5, 20, 30.25]))
print("variance([10.5, 20, 30.25]):", statistics.variance([10.5, 20, 30.25]))
print("variance([2.5, 4, 4.5, 4.5, 55.25, 5, 5.75, 7, 9]):", statistics.variance([2.5, 4, 4.5, 4.5, 55.25, 5, 5.75, 7, 9]))

print("pstdev([1.25, 2.5, 3.75, 4.2, 5.8]):", statistics.pstdev([1.25, 2.5, 3.75, 4.2, 5.8]))
print("stdev([1.25, 2.5, 3.75, 4.2, 5.8]):", statistics.stdev([1.25, 2.5, 3.75, 4.2, 5.8]))
print("stdev([10.5, 20, 30.25]):", statistics.stdev([10.5, 20, 30.25]))
print("pstdev([10.5, 20, 30.25]):", statistics.pstdev([10.5, 20, 30.25]))
print("stdev([100.25, 200, 300.75, 400.5]):", statistics.stdev([100.25, 200, 300.75, 400.5]))

# --- 6. PERCENTILES & QUARTILES ---
print("\n--- Percentiles & Quartiles ---")
data = [10.25, 20.5, 30.75, 40.0, 50.8]
print("median([10.25, 20.5, 30.75, 40.0, 50.8]):", statistics.median(data))
print("q1([10.25, 20.5, 30.75, 40.0, 50.8]):", np.percentile(data, 25))
print("q3([10.25, 20.5, 30.75, 40.0, 50.8]):", np.percentile(data, 75))
print("q4([10.25, 20.5, 30.75, 40.0, 50.8]):", np.percentile(data, 100))
print("percentile([10.25, 20.5, 30.75, 40.0, 50.8], 0.5):", np.percentile(data, 50))
print("median([1.25, 2.5, 3.75, 4.5]):", statistics.median([1.25, 2.5, 3.75, 4.5]))
print("q1([1.1..9.9]):", np.percentile([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9], 25))
print("q3([1.1..9.9]):", np.percentile([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9], 75))
print("percentile([0.5, 100.25], 0.1):", np.percentile([0.5, 100.25], 10))

# --- 7. MODE ---
print("\n--- Mode ---")
print("multimode([1.25, 2.5, 2.5, 3]):", statistics.multimode([1.25, 2.5, 2.5, 3]))
print("multimode([1.1, 1.1, 2.5, 2.5, 3]):", statistics.multimode([1.1, 1.1, 2.5, 2.5, 3]))
print("multimode([5.5, 5.5, 5.5, 1, 2.25]):", statistics.multimode([5.5, 5.5, 5.5, 1, 2.25]))
print("multimode([1.25, 2, 3.5, 3.5, 4.1, 4.1]):", statistics.multimode([1.25, 2, 3.5, 3.5, 4.1, 4.1]))
print("multimode([10.5, 10.5, 10.5, 20, 20, 30.25]):", statistics.multimode([10.5, 10.5, 10.5, 20, 20, 30.25]))

# --- 8. SKEWNESS AND KURTOSIS ---
print("\n--- Skewness & Kurtosis ---")
skewed_datasets = [
    [1.25, 2.5, 2.5, 3.75, 10.5],
    [1.1, 5.25, 7.5, 10, 23.4, 44.8],
    [11, 12.45, 4.2, 5.1, 20.2, 25.8, 19.6],
    [2.25, 3.5, 5, 7.75, 11.2, 13, 17.8, 19.1],
    [10.5, 12, 12, 14.25, 18.5, 24]
]

# Pearson 2. mutatója (3 * (mean - median) / std_pop)
d1 = skewed_datasets[0]
pearson_val = 3 * (statistics.mean(d1) - statistics.median(d1)) / statistics.pstdev(d1)
print("pearsonMeSkewness([1.25, 2.5, 2.5, 3.75, 10.5]):", pearson_val)

# Bowley skewness: (Q3 + Q1 - 2*Med) / (Q3 - Q1)
q1_d1, q3_d1, med_d1 = np.percentile(d1, 25), np.percentile(d1, 75), statistics.median(d1)
print("bowleySkewness([1.25, 2.5, 2.5, 3.75, 10.5]):", (q3_d1 + q1_d1 - 2 * med_d1) / (q3_d1 - q1_d1))

d2 = [1.1, 5.25, 7.5, 10, 23.4, 44.8]
q1_d2, q3_d2, med_d2 = np.percentile(d2, 25), np.percentile(d2, 75), statistics.median(d2)
print("bowleySkewness(skewedData2):", (q3_d2 + q1_d2 - 2 * med_d2) / (q3_d2 - q1_d2))

# Kelly skewness: (P90 + P10 - 2*P50) / (P90 - P10)
p90, p10, p50 = np.percentile(d1, 90), np.percentile(d1, 10), np.percentile(d1, 50)
print("kellySkewness([1.25, 2.5, 2.5, 3.75, 10.5]):", (p90 + p10 - 2 * p50) / (p90 - p10))

d5 = [10.5, 12, 12, 14.25, 18.5, 24]
pearson_val_d5 = 3 * (statistics.mean(d5) - statistics.median(d5)) / statistics.pstdev(d5)
print("pearsonMeSkewness(skewedData5):", pearson_val_d5)

print("\n--- SPSS / Scipy Sample Skewness & Excess Kurtosis (bias=False) ---")
for idx, dataset in enumerate(skewed_datasets, 1):
    sk = stats.skew(dataset, bias=False)
    kt = stats.kurtosis(dataset, bias=False)
    print(f"Dataset {idx} {dataset}:")
    print(f"   Skewness: {sk:.5f}")
    print(f"   Excess Kurtosis: {kt:.5f}")

# --- 9. RANGE, IQR, RSD, MSE ---
print("\n--- Range, IQR, RSD & MSE ---")
print("ptp([2.25, 5, 10.75]):", np.ptp([2.25, 5, 10.75]))
print("ptp([1.1, 1.1, 1.1]):", np.ptp([1.1, 1.1, 1.1]))
print("ptp([-10.5, 0, 10.25]):", np.ptp([-10.5, 0, 10.25]))
print("ptp([100.1, 500.5, 200]):", np.ptp([100.1, 500.5, 200]))
print("ptp([1.5, 2.8, 9.1]):", np.ptp([1.5, 2.8, 9.1]))

print("iqr([10.25, 20.5, 30.75, 40.0, 50.8]):", stats.iqr([10.25, 20.5, 30.75, 40.0, 50.8]))
print("iqr([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9]):", stats.iqr([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9]))
print("iqr([2.5, 4, 6.25, 8.5, 10, 12.75]):", stats.iqr([2.5, 4, 6.25, 8.5, 10, 12.75]))
print("iqr([100.5..700.5]):", stats.iqr([100.5, 200, 300.25, 400, 500.75, 600, 700.5]))
print("iqr([1.5, 1.5, 1.5, 1.5, 1.5]):", stats.iqr([1.5, 1.5, 1.5, 1.5, 1.5]))

print("rsd_pop([10.5, 20, 30.25]):", statistics.pstdev([10.5, 20, 30.25]) / statistics.mean([10.5, 20, 30.25]))
print("rsd_sample([10.5, 20, 30.25]):", statistics.stdev([10.5, 20, 30.25]) / statistics.mean([10.5, 20, 30.25]))
print("rsd_pop([100.25, 200, 300.75, 400.5]):", statistics.pstdev([100.25, 200, 300.75, 400.5]) / statistics.mean([100.25, 200, 300.75, 400.5]))
print("rsd_sample([2.5, 4, 6.25, 8.5]):", statistics.stdev([2.5, 4, 6.25, 8.5]) / statistics.mean([2.5, 4, 6.25, 8.5]))

print("mse([1.5, 2.5, 3.5], [1.5, 2.5, 3.5]):", mean_squared_error([1.5, 2.5, 3.5], [1.5, 2.5, 3.5]))
print("mse([1.25, 2.5, 3.75], [2, 2, 2]):", mean_squared_error([1.25, 2.5, 3.75], [2, 2, 2]))
print("mse([10.5, 20.25, 30], [12, 18.5, 33.1]):", mean_squared_error([10.5, 20.25, 30], [12, 18.5, 33.1]))
print("mse([0, 0, 0], [2.5, 2.5, 2.5]):", mean_squared_error([0, 0, 0], [2.5, 2.5, 2.5]))
print("mse([1.5, 2.5, 3.5], [1.0, 2.0, 3.0]):", mean_squared_error([1.5, 2.5, 3.5], [1.0, 2.0, 3.0]))