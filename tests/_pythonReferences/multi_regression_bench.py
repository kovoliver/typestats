import time
import numpy as np
from scipy import stats

def generate_random_columns(rows: int, cols: int, min_val: float = 10_000.0, max_val: float = 1_000_000.0) -> np.ndarray:
    rng = np.random.default_rng()
    return rng.uniform(min_val, max_val, size=(rows, cols))

def run_benchmark():
    N = 1_000_000
    K = 4

    print("--- BENCHMARK STARTED ---")
    print(f"Dataset size: {N:,} rows, {K} predictor columns".replace(",", " "))

    start_gen = time.perf_counter()

    x_columns = generate_random_columns(N, K, 10_000.0, 1_000_000.0)
    y_column = generate_random_columns(N, 1, 10_000.0, 1_000_000.0).ravel()

    end_gen = time.perf_counter()
    print(f"Data generation time: {((end_gen - start_gen) * 1000):.2f} ms")

    start_init = time.perf_counter()

    X_design = np.c_[np.ones(N, dtype=np.float64), x_columns]

    end_init = time.perf_counter()
    print(f"MultiRegression initialization time: {((end_init - start_init) * 1000):.2f} ms")

    start_calc = time.perf_counter()

    betas, residuals, rank, s = np.linalg.lstsq(X_design, y_column, rcond=None)

    end_calc = time.perf_counter()

    calc_time_ms = (end_calc - start_calc) * 1000
    total_reg_time_ms = (end_calc - start_init) * 1000

    print(f"Regression computation time: {calc_time_ms:.2f} ms")
    print(f"Total execution time (initialization + regression): {total_reg_time_ms:.2f} ms")

    print("\n--- ESTIMATED COEFFICIENTS ---")
    print(f"beta_0 (intercept): {betas[0]}")
    for i in range(K):
        print(f"beta_{i + 1}: {betas[i + 1]}")

    start_rsd = time.perf_counter()

    if len(residuals) > 0:
        sum_sq_residuals = residuals[0]
    else:
        y_pred = X_design @ betas
        sum_sq_residuals = np.sum((y_column - y_pred) ** 2)

    df_e = N - K - 1
    rsd = np.sqrt(sum_sq_residuals / df_e)

    end_rsd = time.perf_counter()

    rsd_time_ms = (end_rsd - start_rsd) * 1000
    total_all_time_ms = (end_rsd - start_init) * 1000

    print("\n--- RESIDUAL STANDARD DEVIATION ---")
    print(f"RSD: {rsd}")
    print(f"RSD computation time: {rsd_time_ms:.2f} ms")
    print(f"Total execution time (initialization + regression + RSD): {total_all_time_ms:.2f} ms")

if __name__ == "__main__":
    run_benchmark()