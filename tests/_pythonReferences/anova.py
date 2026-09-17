import numpy as np

def get_anova_metrics(groups):
    # Calculate group means and overall grand mean
    group_means = [np.mean(g) for g in groups]
    all_data = [x for g in groups for x in g]
    grand_mean = np.mean(all_data)
    
    # Sum of Squares calculations
    ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in groups)
    ss_within = sum(sum((x - np.mean(g))**2 for x in g) for g in groups)
    ss_total = ss_between + ss_within
    eta_squared = ss_between / ss_total
    
    return ss_between, ss_within, ss_total, eta_squared

# 4 selected ANOVA group datasets
tables = {
    "Table 1 (3 groups of 2)": [[2, 4], [3, 5], [4, 6]],
    "Table 2 (3 groups of 3)": [[1, 2, 3], [3, 4, 5], [5, 6, 7]],
    "Table 3 (3 groups of unequal sizes)": [[10, 12, 14], [20, 22], [30, 32, 34, 36]],
    "Table 4 (4 groups of equal sizes)": [[5, 7, 8, 10], [12, 14, 15, 19], [20, 21, 23, 24], [30, 32, 35, 39]]
}

print("=== SciPy / NumPy ANOVA SSD & Eta Squared Validation Results ===\n")

for name, groups in tables.items():
    b, w, tot, eta = get_anova_metrics(groups)
    print(f"--- {name} ---")
    print(f"Groups     : {groups}")
    print(f"SS_between : {b:.6f}")
    print(f"SS_within  : {w:.6f}")
    print(f"SS_total   : {tot:.6f}")
    print(f"Eta Squared: {eta:.6f}\n")