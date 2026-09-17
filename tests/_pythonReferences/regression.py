import numpy as np

def linear_regression(x, y):
    x = np.array(x, dtype=float)
    y = np.array(y, dtype=float)
    if len(x) != len(y) or len(x) < 2:
        raise ValueError("Invalid dataset length")
    if np.var(x) == 0:
        raise ValueError("Zero variance in independent variable")
    
    b1, b0 = np.polyfit(x, y, 1)
    return b0, b1

def exponential_regression(x, y):
    x = np.array(x, dtype=float)
    y = np.array(y, dtype=float)
    if np.any(y <= 0):
        raise ValueError("Non-positive values in dependent variable")
    
    # ln(y) = ln(b0) + ln(b1) * x  ==>  y = b0 * (b1^x)
    ln_y = np.log(y)
    ln_b1, ln_b0 = np.polyfit(x, ln_y, 1)
    
    b0 = np.exp(ln_b0)
    b1 = np.exp(ln_b1)
    return b0, b1

def power_regression(x, y):
    x = np.array(x, dtype=float)
    y = np.array(y, dtype=float)
    if np.any(x <= 0) or np.any(y <= 0):
        raise ValueError("Non-positive values in variables")
    
    # ln(y) = ln(b0) + b1 * ln(x)  ==>  y = b0 * (x^b1)
    ln_x = np.log(x)
    ln_y = np.log(y)
    b1, ln_b0 = np.polyfit(ln_x, ln_y, 1)
    
    b0 = np.exp(ln_b0)
    return b0, b1

def calculate_rsd(x, y, model_type, b0, b1):
    x = np.array(x, dtype=float)
    y = np.array(y, dtype=float)
    n = len(x)
    
    if model_type == 'linear':
        y_pred = b0 + b1 * x
    elif model_type == 'exponential':
        y_pred = b0 * (b1 ** x)
    elif model_type == 'power':
        y_pred = b0 * (x ** b1)
        
    sse = np.sum((y - y_pred) ** 2)
    rsd = np.sqrt(sse / (n - 2))
    return rsd

print("=== Regression Class Calculations (NumPy / SciPy Reference) ===\n")

# -----------------------------------------------------------------------------
# Linear Regression
# -----------------------------------------------------------------------------
print("--- Linear Regression ---")

# Description: should calculate linear regression coefficients correctly
x_lin = [1, 2, 3, 4, 5]
y_lin = [2, 4, 5, 4, 5]
b0_lin, b1_lin = linear_regression(x_lin, y_lin)
print("[it]: should calculate linear regression coefficients correctly")
print(f"     Data X: {x_lin}, Y: {y_lin}")
print(f"     Calculated b0: {b0_lin:.6f}")
print(f"     Calculated b1: {b1_lin:.6f}\n")

# -----------------------------------------------------------------------------
# Exponential Regression
# -----------------------------------------------------------------------------
print("--- Exponential Regression ---")

# Description: should calculate exact exponential regression coefficients
x_exp = [1, 2, 3, 4]
y_exp = [3.6, 6.48, 11.664, 20.9952]
b0_exp, b1_exp = exponential_regression(x_exp, y_exp)
print("[it]: should calculate exact exponential regression coefficients")
print(f"     Data X: {x_exp}, Y: {y_exp}")
print(f"     Calculated b0: {b0_exp:.6f}")
print(f"     Calculated b1: {b1_exp:.6f}\n")

# -----------------------------------------------------------------------------
# Power Regression
# -----------------------------------------------------------------------------
print("--- Power Regression ---")

# Description: should calculate exact power regression coefficients
x_pow = [1, 4, 9, 16]
y_pow = [2, 16, 54, 128]
b0_pow, b1_pow = power_regression(x_pow, y_pow)
print("[it]: should calculate exact power regression coefficients")
print(f"     Data X: {x_pow}, Y: {y_pow}")
print(f"     Calculated b0: {b0_pow:.6f}")
print(f"     Calculated b1: {b1_pow:.6f}\n")

# -----------------------------------------------------------------------------
# RSD (Residual Standard Deviation) Calculation
# -----------------------------------------------------------------------------
print("--- RSD (Residual Standard Deviation) Calculation ---")

# Description: should calculate exact RSD for linear regression
rsd_lin = calculate_rsd(x_lin, y_lin, 'linear', b0_lin, b1_lin)
print("[it]: should calculate exact RSD for linear regression")
print(f"     Data X: {x_lin}, Y: {y_lin}")
print(f"     Calculated Linear RSD: {rsd_lin:.6f}\n")

# Description: should calculate exact RSD for exponential regression
x_exp_rsd = [1, 2, 3, 4]
y_exp_rsd = [2, 4, 8, 16]
b0_exp_rsd, b1_exp_rsd = exponential_regression(x_exp_rsd, y_exp_rsd)
rsd_exp = calculate_rsd(x_exp_rsd, y_exp_rsd, 'exponential', b0_exp_rsd, b1_exp_rsd)
print("[it]: should calculate exact RSD for exponential regression")
print(f"     Data X: {x_exp_rsd}, Y: {y_exp_rsd}")
print(f"     Calculated Exponential RSD: {rsd_exp:.6f}\n")

# Description: should calculate exact RSD for power regression
x_pow_rsd = [1, 2, 3, 4, 5]
y_pow_rsd = [2, 5, 9, 15, 27]
b0_pow_rsd, b1_pow_rsd = power_regression(x_pow_rsd, y_pow_rsd)
rsd_pow = calculate_rsd(x_pow_rsd, y_pow_rsd, 'power', b0_pow_rsd, b1_pow_rsd)
print("[it]: should calculate exact RSD for power regression")
print(f"     Data X: {x_pow_rsd}, Y: {y_pow_rsd}")
print(f"     Calculated Power RSD: {rsd_pow:.6f}\n")

# -----------------------------------------------------------------------------
# Advanced Regression & RSD Tests (Negative/Decimals & Scales)
# -----------------------------------------------------------------------------
print("--- Advanced Regression & RSD Tests ---")

# 1. Linear with negative & decimals
x_lin_adv = [-5.25, -4.10, -3.15, -2.05, -1.10, 0.20, 1.15, 2.30, 3.40, 4.55]
y_lin_adv = [-12.85, -10.20, -8.15, -5.90, -3.40, -0.15, 2.45, 5.10, 7.80, 10.35]
b0_la, b1_la = linear_regression(x_lin_adv, y_lin_adv)
rsd_la = calculate_rsd(x_lin_adv, y_lin_adv, 'linear', b0_la, b1_la)
print(f"Linear (Negative & Decimals) -> b0: {b0_la:.6f}, b1: {b1_la:.6f}, RSD: {rsd_la:.6f}")

# 2. Exponential 100s
x_e100 = [100.25, 105.50, 110.75, 115.20, 120.40, 125.80, 130.15, 135.60, 140.90, 145.30]
y_e100 = [205.54, 223.12, 242.21, 262.93, 285.42, 309.83, 336.32, 365.07, 396.28, 430.15]
b0_e1, b1_e1 = exponential_regression(x_e100, y_e100)
rsd_e1 = calculate_rsd(x_e100, y_e100, 'exponential', b0_e1, b1_e1)
print(f"Exp 100s -> b0: {b0_e1:.6f}, b1: {b1_e1:.6f}, RSD: {rsd_e1:.6f}")

# 3. Exponential 1000s
x_e1000 = [1100.5, 1220.4, 1340.2, 1460.8, 1580.1, 1700.5, 1820.3, 1940.9, 2060.2, 2180.7]
y_e1000 = [150.25, 170.85, 194.25, 220.85, 251.15, 285.65, 324.85, 369.45, 420.25, 478.05]
b0_e2, b1_e2 = exponential_regression(x_e1000, y_e1000)
rsd_e2 = calculate_rsd(x_e1000, y_e1000, 'exponential', b0_e2, b1_e2)
print(f"Exp 1000s -> b0: {b0_e2:.6f}, b1: {b1_e2:.6f}, RSD: {rsd_e2:.6f}")

# 4. Exponential 10k
x_e10k = [10050.2, 11020.5, 12010.8, 13040.1, 14025.4, 15060.7, 16010.3, 17050.6, 18020.9, 19040.2]
y_e10k = [450.12, 490.25, 533.90, 581.40, 633.15, 689.50, 750.90, 817.85, 890.80, 970.30]
b0_e3, b1_e3 = exponential_regression(x_e10k, y_e10k)
rsd_e3 = calculate_rsd(x_e10k, y_e10k, 'exponential', b0_e3, b1_e3)
print(f"Exp 10k -> b0: {b0_e3:.6f}, b1: {b1_e3:.6f}, RSD: {rsd_e3:.6f}")

# 5. Power 100s
x_p100 = [110.5, 125.2, 140.8, 155.1, 170.4, 185.7, 200.2, 215.9, 230.1, 245.6]
y_p100 = [12.45, 14.10, 15.80, 17.35, 18.95, 20.50, 22.05, 23.60, 25.10, 26.65]
b0_p1, b1_p1 = power_regression(x_p100, y_p100)
rsd_p1 = calculate_rsd(x_p100, y_p100, 'power', b0_p1, b1_p1)
print(f"Power 100s -> b0: {b0_p1:.6f}, b1: {b1_p1:.6f}, RSD: {rsd_p1:.6f}")

# 6. Power 1000s
x_p1000 = [1150.2, 1300.5, 1450.8, 1600.1, 1750.4, 1900.7, 2050.3, 2200.6, 2350.9, 2500.2]
y_p1000 = [45.20, 51.10, 56.80, 62.30, 67.75, 73.10, 78.40, 83.65, 88.85, 94.05]
b0_p2, b1_p2 = power_regression(x_p1000, y_p1000)
rsd_p2 = calculate_rsd(x_p1000, y_p1000, 'power', b0_p2, b1_p2)
print(f"Power 1000s -> b0: {b0_p2:.6f}, b1: {b1_p2:.6f}, RSD: {rsd_p2:.6f}")

# 7. Power 10k
x_p10k = [10500.2, 12050.5, 13500.8, 15050.1, 16500.4, 18050.7, 19500.3, 21050.6, 22500.9, 24050.2]
y_p10k = [120.50, 137.80, 154.20, 171.10, 187.35, 204.05, 220.15, 236.80, 252.85, 269.45]
b0_p3, b1_p3 = power_regression(x_p10k, y_p10k)
rsd_p3 = calculate_rsd(x_p10k, y_p10k, 'power', b0_p3, b1_p3)
print(f"Power 10k -> b0: {b0_p3:.6f}, b1: {b1_p3:.6f}, RSD: {rsd_p3:.6f}")