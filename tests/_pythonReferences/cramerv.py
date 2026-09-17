import numpy as np
from scipy.stats import chi2_contingency

def get_cramer_v(table):
    obs = np.array(table, dtype=float)
    # correction=False a pontos Chi-négyzet és Cramér-V参照 értékekhez
    chi2, _, _, _ = chi2_contingency(obs, correction=False)
    n = obs.sum()
    r, c = obs.shape
    v = np.sqrt(chi2 / (n * min(r - 1, c - 1)))
    return chi2, v

# 4 kiválasztott kontingenciatáblázat
tables = {
    "1. táblázat (2x2 aszimmetrikus)": [[10, 20], [30, 40]],
    "2. táblázat (2x2 független)": [[10, 20], [20, 40]],
    "3. táblázat (3x2 nem-négyzetes)": [[20, 6], [25, 12], [38, 40]],
    "4. táblázat (3x3 összefüggő)": [[50, 10, 20], [15, 45, 30], [25, 20, 55]]
}

print("=== SciPy Cramér-V és Chi-Square Validációs Eredmények ===\n")

for name, table in tables.items():
    chi2, v = get_cramer_v(table)
    print(f"--- {name} ---")
    print(f"Mátrix: {table}")
    print(f"Chi-Square : {chi2:.6f}")
    print(f"Cramér V   : {v:.6f}\n")