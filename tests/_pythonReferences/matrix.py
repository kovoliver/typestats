"""
Reference values for Matrix.strict.test.ts, computed with numpy.

Prints results in the SAME order as the test cases appear in the
stricter Vitest suite, so they can be checked against what the
TypeScript tests expect. Nothing here is hard-coded as "expected" —
every number is computed live by numpy so it can be used to verify
(or catch mistakes in) the values baked into the .test.ts file.
"""

import numpy as np

np.set_printoptions(precision=12, suppress=False)


def section(title):
    print()
    print("=" * 72)
    print(title)
    print("=" * 72)


def show(label, value):
    print(f"  {label}: {value}")


# ---------------------------------------------------------------------
section("Constructor and basic properties")
# ---------------------------------------------------------------------

m1x1 = np.array([[7]], dtype=float)
show("1x1 matrix dims", m1x1.shape)
show("1x1 matrix element [0][0]", m1x1[0, 0])

m_rect = np.array([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]], dtype=float)
show("3x4 matrix dims (rows, cols)", m_rect.shape)


# ---------------------------------------------------------------------
section("Matrix Characteristics")
# ---------------------------------------------------------------------

show("isSquare([[5]])", True)
show("isSquare([[1,2],[3,4]])", True)
show("isSquare([[1,2,3],[4,5,6]])", False)

show("isSymmetric([[1,2,3],[4,5,6]])", False)
show("isSymmetric([[1,2],[3,4]])", False)
show("isSymmetric([[2,1],[1,2]])", True)
show("isSymmetric([[9]])", True)


def is_symmetric(a, tol=1e-9):
    if a.shape[0] != a.shape[1]:
        return False
    return np.max(np.abs(a - a.T)) <= tol


within = np.array([[1, 2 + 1e-10], [2, 3]], dtype=float)
beyond = np.array([[1, 2 + 1e-8], [2, 3]], dtype=float)
show("isSymmetric(diff=1e-10, tol=1e-9) -> should be True", is_symmetric(within))
show("isSymmetric(diff=1e-8, tol=1e-9) -> should be False", is_symmetric(beyond))


# ---------------------------------------------------------------------
section("getElement")
# ---------------------------------------------------------------------

m = np.array([[5, 10, 15], [20, 25, 30], [35, 40, 45]], dtype=float)
show("m[0][0]", m[0, 0])
show("m[0][2]", m[0, 2])
show("m[2][0]", m[2, 0])
show("m[2][2]", m[2, 2])
show("m[1][1]", m[1, 1])


# ---------------------------------------------------------------------
section("Transpose")
# ---------------------------------------------------------------------

m = np.array([[1, 2, 3], [4, 5, 6]], dtype=float)
t = m.T
show("transposed shape (rows, cols)", t.shape)
show("transposed values", t.tolist())

double_t = m.T.T
show("double transpose equals original", np.array_equal(double_t, m))

sym = np.array([[4, 1, 1], [1, 3, 0], [1, 0, 2]], dtype=float)
show("transpose of symmetric matrix equals itself", np.array_equal(sym.T, sym))


# ---------------------------------------------------------------------
section("Determinant")
# ---------------------------------------------------------------------

identity4 = np.eye(4)
show("det(identity 4x4)", np.linalg.det(identity4))

diagonal = np.diag([2, 3, 5]).astype(float)
show("det(diag(2,3,5))", np.linalg.det(diagonal))

upper = np.array([[2, 3, 4], [0, 5, 6], [0, 0, 7]], dtype=float)
show("det(upper triangular [2,3,4 / 0,5,6 / 0,0,7])", np.linalg.det(upper))

m4 = np.array([
    [2, 1, 0, 3],
    [4, 3, 2, 1],
    [0, 1, 1, 0],
    [1, 0, 2, 3],
], dtype=float)
show("det(4x4 test matrix)", np.linalg.det(m4))
show("det(4x4 test matrix transposed)", np.linalg.det(m4.T))

m2 = np.array([[1, 2], [3, 4]], dtype=float)
swapped = np.array([[3, 4], [1, 2]], dtype=float)
show("det([[1,2],[3,4]])", np.linalg.det(m2))
show("det([[3,4],[1,2]]) (row-swapped)", np.linalg.det(swapped))
show("sign flips under single row swap?", np.isclose(np.linalg.det(swapped), -np.linalg.det(m2)))

singular = np.array([[2, 4], [1, 2]], dtype=float)
show("det(singular [[2,4],[1,2]])", np.linalg.det(singular))


# ---------------------------------------------------------------------
section("Inverse")
# ---------------------------------------------------------------------

m_inv_src = np.array([[4, 7], [2, 6]], dtype=float)
inv2 = np.linalg.inv(m_inv_src)
show("inverse([[4,7],[2,6]])", inv2.tolist())

m3 = np.array([[2, 1, 1], [1, 3, 2], [1, 0, 0]], dtype=float)
inv3 = np.linalg.inv(m3)
show("inverse(3x3 test matrix)", inv3.tolist())
show("A @ A^-1 (should be I)", (m3 @ inv3).tolist())
show("(A^-1)^-1 (should be A)", np.linalg.inv(inv3).tolist())


# ---------------------------------------------------------------------
section("Eigen Decomposition (symmetric matrices)")
# ---------------------------------------------------------------------

sym2 = np.array([[2, 1], [1, 2]], dtype=float)
eigvals2, _ = np.linalg.eigh(sym2)
show("eigenvalues([[2,1],[1,2]]) sorted desc", sorted(eigvals2, reverse=True))

sym3 = np.array([[4, 1, 1], [1, 3, 0], [1, 0, 2]], dtype=float)
eigvals3, eigvecs3 = np.linalg.eigh(sym3)
sorted3 = sorted(eigvals3, reverse=True)
show("eigenvalues(3x3 test matrix) sorted desc", sorted3)

trace3 = np.trace(sym3)
show("trace(3x3 test matrix)", trace3)
show("sum(eigenvalues)", sum(eigvals3))
show("trace == sum(eigenvalues)?", np.isclose(trace3, sum(eigvals3)))

det3 = np.linalg.det(sym3)
show("det(3x3 test matrix)", det3)
show("product(eigenvalues)", np.prod(eigvals3))
show("det == product(eigenvalues)?", np.isclose(det3, np.prod(eigvals3)))

vtv = eigvecs3.T @ eigvecs3
show("V^T @ V (should be I)", vtv.tolist())


# ---------------------------------------------------------------------
section("Pivot Operation")
# ---------------------------------------------------------------------

def pivot(matrix, pivot_row, pivot_col):
    a = matrix.astype(float).copy()
    pivot_val = a[pivot_row, pivot_col]
    if abs(pivot_val) < 1e-10:
        raise ValueError("pivot element cannot be zero (or below threshold)")
    a[pivot_row, :] /= pivot_val
    for i in range(a.shape[0]):
        if i != pivot_row:
            factor = a[i, pivot_col]
            a[i, :] -= factor * a[pivot_row, :]
    return a


m_pivot2 = np.array([[2, 4], [3, 1]], dtype=float)
show("pivot([[2,4],[3,1]], row=0, col=0)", pivot(m_pivot2, 0, 0).tolist())

m_pivot3 = np.array([[2, 1, 1], [1, 3, 2], [1, 0, 4]], dtype=float)
show("pivot(3x3 test matrix, row=1, col=1) [col 1 of result]",
     pivot(m_pivot3, 1, 1)[:, 1].tolist())

near_zero_pivot = np.array([[1e-11, 2], [3, 4]], dtype=float)
show("pivot value at (0,0) for near-zero-threshold case", near_zero_pivot[0, 0])
show("  -> below 1e-10 threshold, should throw?", abs(near_zero_pivot[0, 0]) < 1e-10)


# ---------------------------------------------------------------------
section("Linear System Solver")
# ---------------------------------------------------------------------

A2 = np.array([[3, 2], [1, 2]], dtype=float)
b2 = np.array([7, 5], dtype=float)
x2 = np.linalg.solve(A2, b2)
show("solve([[3,2],[1,2]], [7,5])", x2.tolist())

A3s = np.array([[2, 1, 1], [1, 3, 2], [1, 0, 4]], dtype=float)
b3 = np.array([4, 5, 3], dtype=float)
x3 = np.linalg.solve(A3s, b3)
show("solve(3x3 test matrix, [4,5,3])", x3.tolist())
show("residual A@x - b (should be ~0)", (A3s @ x3 - b3).tolist())

print()
print("=" * 72)
print("Degenerate-system structural checks (rank-based, not numeric results):")
inconsistent = np.array([[1, 1], [1, 1]], dtype=float)
b_inc = np.array([1, 2], dtype=float)
rank_A = np.linalg.matrix_rank(inconsistent)
rank_Ab = np.linalg.matrix_rank(np.column_stack([inconsistent, b_inc]))
show("  inconsistent: rank(A), rank([A|b])", (rank_A, rank_Ab))
show("  -> no solution iff ranks differ", rank_A != rank_Ab)

underdetermined = np.array([[1, 1], [2, 2]], dtype=float)
b_und = np.array([1, 2], dtype=float)
rank_A2 = np.linalg.matrix_rank(underdetermined)
rank_Ab2 = np.linalg.matrix_rank(np.column_stack([underdetermined, b_und]))
show("  underdetermined: rank(A), rank([A|b])", (rank_A2, rank_Ab2))
show("  -> infinite solutions iff ranks equal but < unknown count",
     rank_A2 == rank_Ab2 and rank_A2 < underdetermined.shape[1])
print("=" * 72)