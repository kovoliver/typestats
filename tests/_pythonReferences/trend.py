import numpy as np

def calculate_linear_trend_zero_based(y):
    y = np.array(y, dtype=float)
    t = np.arange(0, len(y))  # t = 0, 1, 2, 3, 4
    b, a = np.polyfit(t, y, 1)
    y_pred = a + b * t
    mse = np.mean((y - y_pred) ** 2)
    return a, b, mse

def calculate_exponential_trend_zero_based(y):
    y = np.array(y, dtype=float)
    t = np.arange(0, len(y))  # t = 0, 1, 2, 3, 4
    ln_y = np.log(y)
    ln_b, ln_a = np.polyfit(t, ln_y, 1)
    a = np.exp(ln_a)
    b = np.exp(ln_b)
    y_pred = a * (b ** t)
    mse = np.mean((y - y_pred) ** 2)
    return a, b, mse

def calculate_polynomial_trend_zero_based(y, degree):
    y = np.array(y, dtype=float)
    t = np.arange(0, len(y))  # t = 0, 1, 2, 3, 4
    coeffs = np.polyfit(t, y, degree)
    coeffs_asc = coeffs[::-1]  # [a0, a1, a2, ...]
    y_pred = np.polyval(coeffs, t)
    mse = np.mean((y - y_pred) ** 2)
    return coeffs_asc, mse

def calculate_logarithmic_trend_zero_based(y):
    y = np.array(y, dtype=float)
    t = np.arange(0, len(y))  # t = 0, 1, 2, 3, 4
    ln_t = np.log(t + 1)      # ln(t + 1) offset a log(0) elkerülésére
    b, a = np.polyfit(ln_t, y, 1)
    y_pred = a + b * ln_t
    mse = np.mean((y - y_pred) ** 2)
    return a, b, mse

# Real-world noisy fractional dataset
noisy_data = [12.45, 25.89, 33.12, 51.04, 68.77]

print("=== Complete SciPy Benchmarks (0-based Indexing) ===")
print(f"Dataset: {noisy_data}\n")

# Linear Trend
a_lin, b_lin, mse_lin = calculate_linear_trend_zero_based(noisy_data)
print("--- Linear Trend ---")
print(f"a (intercept) : {a_lin:.6f}")
print(f"b (slope)     : {b_lin:.6f}")
print(f"MSE           : {mse_lin:.6f}\n")

# Exponential Trend
a_exp, b_exp, mse_exp = calculate_exponential_trend_zero_based(noisy_data)
print("--- Exponential Trend ---")
print(f"a (intercept) : {a_exp:.6f}")
print(f"b (base)      : {b_exp:.6f}")
print(f"MSE           : {mse_exp:.6f}\n")

# Polynomial Trend (Degree 2)
coeffs_poly, mse_poly = calculate_polynomial_trend_zero_based(noisy_data, 2)
print("--- Polynomial Trend (Degree 2) ---")
print(f"a0 (const)    : {coeffs_poly[0]:.6f}")
print(f"a1 (t)        : {coeffs_poly[1]:.6f}")
print(f"a2 (t^2)      : {coeffs_poly[2]:.6f}")
print(f"MSE           : {mse_poly:.6f}\n")

# Logarithmic Trend
a_log, b_log, mse_log = calculate_logarithmic_trend_zero_based(noisy_data)
print("--- Logarithmic Trend ---")
print(f"a (intercept) : {a_log:.6f}")
print(f"b (slope)     : {b_log:.6f}")
print(f"MSE           : {mse_log:.6f}\n")