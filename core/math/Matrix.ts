export default class Matrix {
    private _matrix: Float64Array[];
    private _rows: number;
    private _cols: number;

    constructor(values: Float64Array[]) {
        if (!values || values.length === 0) {
            throw new Error('Matrix cannot be empty.');
        }

        if (!values[0] || values[0].length === 0) {
            throw new Error('Matrix rows cannot be empty.');
        }

        const colsLength = values[0].length;
        for (let i = 0; i < values.length; i++) {
            if (values[i].length !== colsLength) {
                throw new Error('All rows in the matrix must have the same length.');
            }
        }

        this._matrix = new Array(values.length);
        for (let i = 0; i < values.length; i++) {
            this._matrix[i] = new Float64Array(values[i]);
        }
        this._rows = values.length;
        this._cols = colsLength;
    }

    public get values(): Float64Array[] {
        const copy: Float64Array[] = new Array(this._rows);
        for (let i = 0; i < this._rows; i++) {
            copy[i] = new Float64Array(this._matrix[i]);
        }
        return copy;
    }

    public get rows(): number {
        return this._rows;
    }

    public get cols(): number {
        return this._cols;
    }

    public get isSquare(): boolean {
        return this._rows === this._cols;
    }

    public get isSymmetric(): boolean {
        if (!this.isSquare) return false;
        for (let i = 0; i < this._rows; i++) {
            for (let j = i + 1; j < this._cols; j++) {
                if (Math.abs(this._matrix[i][j] - this._matrix[j][i]) > 1e-9) {
                    return false;
                }
            }
        }
        return true;
    }

    public getElement(rowIndex: number, colIndex: number): number {
        if (rowIndex < 0 || rowIndex >= this._rows || colIndex < 0 || colIndex >= this._cols) {
            throw new Error(`Index out of bounds: [${rowIndex}, ${colIndex}].`);
        }
        return this._matrix[rowIndex][colIndex];
    }

    private get transposedVals(): Float64Array[] {
        const result: Float64Array[] = new Array(this._cols);
        for (let col = 0; col < this._cols; col++) {
            const rowArr = new Float64Array(this._rows);
            for (let row = 0; row < this._rows; row++) {
                rowArr[row] = this._matrix[row][col];
            }
            result[col] = rowArr;
        }
        return result;
    }

    public get transposed(): Matrix {
        return new Matrix(this.transposedVals);
    }

    public get determinant(): number {
        if (!this.isSquare) {
            throw new Error('Determinant is only defined for square matrices.');
        }

        const n = this._rows;
        const A: Float64Array[] = new Array(n);
        for (let i = 0; i < n; i++) {
            A[i] = new Float64Array(this._matrix[i]);
        }

        let det = 1;
        let swapCount = 0;

        for (let i = 0; i < n; i++) {
            let pivotRow = i;
            for (let r = i + 1; r < n; r++) {
                if (Math.abs(A[r][i]) > Math.abs(A[pivotRow][i])) {
                    pivotRow = r;
                }
            }

            if (Math.abs(A[pivotRow][i]) < 1e-10) {
                return 0;
            }

            if (pivotRow !== i) {
                const temp = A[i];
                A[i] = A[pivotRow];
                A[pivotRow] = temp;
                swapCount++;
            }

            det *= A[i][i];

            for (let r = i + 1; r < n; r++) {
                const factor = A[r][i] / A[i][i];
                for (let c = i; c < n; c++) {
                    A[r][c] -= factor * A[i][c];
                }
            }
        }

        return swapCount % 2 === 0 ? det : -det;
    }

    public inverse(): Matrix {
        if (!this.isSquare) {
            throw new Error('Only square matrices can be inverted.');
        }

        const n = this._rows;
        const aug: Float64Array[] = new Array(n);

        for (let i = 0; i < n; i++) {
            const row = new Float64Array(2 * n);
            row.set(this._matrix[i], 0);
            row[n + i] = 1;
            aug[i] = row;
        }

        for (let i = 0; i < n; i++) {
            let pivotRow = i;
            for (let r = i + 1; r < n; r++) {
                if (Math.abs(aug[r][i]) > Math.abs(aug[pivotRow][i])) {
                    pivotRow = r;
                }
            }

            if (Math.abs(aug[pivotRow][i]) < 1e-10) {
                throw new Error('Matrix is singular and cannot be inverted (determinant is 0).');
            }

            if (pivotRow !== i) {
                const temp = aug[i];
                aug[i] = aug[pivotRow];
                aug[pivotRow] = temp;
            }

            const pivot = aug[i][i];
            for (let j = 0; j < 2 * n; j++) {
                aug[i][j] /= pivot;
            }

            for (let r = 0; r < n; r++) {
                if (r !== i) {
                    const factor = aug[r][i];
                    for (let j = 0; j < 2 * n; j++) {
                        aug[r][j] -= factor * aug[i][j];
                    }
                }
            }
        }

        const invValues: Float64Array[] = new Array(n);
        for (let i = 0; i < n; i++) {
            invValues[i] = aug[i].subarray(n);
        }
        return new Matrix(invValues);
    }

    public eigen(maxIterations = 100, tolerance = 1e-10): { values: Float64Array; vectors: Matrix } {
        if (!this.isSquare) {
            throw new Error('Eigenvalues are only defined for square matrices.');
        }

        if (!this.isSymmetric) {
            throw new Error('This implementation of eigen decomposition requires a real symmetric matrix.');
        }

        const n = this._rows;
        const A: Float64Array[] = new Array(n);
        const V: Float64Array[] = new Array(n);

        for (let i = 0; i < n; i++) {
            A[i] = new Float64Array(this._matrix[i]);
            V[i] = new Float64Array(n);
            V[i][i] = 1;
        }

        for (let iter = 0; iter < maxIterations; iter++) {
            let maxOffDiag = 0;
            let p = 0;
            let q = 1;

            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    if (Math.abs(A[i][j]) > maxOffDiag) {
                        maxOffDiag = Math.abs(A[i][j]);
                        p = i;
                        q = j;
                    }
                }
            }

            if (maxOffDiag < tolerance) {
                break;
            }

            const app = A[p][p];
            const aqq = A[q][q];
            const apq = A[p][q];

            const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
            const c = Math.cos(phi);
            const s = Math.sin(phi);

            A[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
            A[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
            A[p][q] = 0;
            A[q][p] = 0;

            for (let i = 0; i < n; i++) {
                if (i !== p && i !== q) {
                    const aip = A[i][p];
                    const aiq = A[i][q];

                    A[i][p] = c * aip - s * aiq;
                    A[p][i] = A[i][p];

                    A[i][q] = s * aip + c * aiq;
                    A[q][i] = A[i][q];
                }

                const vip = V[i][p];
                const viq = V[i][q];

                V[i][p] = c * vip - s * viq;
                V[i][q] = s * vip + c * viq;
            }
        }

        const eigenValues = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            eigenValues[i] = A[i][i];
        }

        return {
            values: eigenValues,
            vectors: new Matrix(V),
        };
    }

    public pivot(pivotRow: number, pivotCol: number): Matrix {
        if (pivotRow < 0 || pivotRow >= this._rows || pivotCol < 0 || pivotCol >= this._cols) {
            throw new Error(`Pivot index out of bounds: [${pivotRow}, ${pivotCol}].`);
        }

        const pivotValue = this._matrix[pivotRow][pivotCol];
        if (Math.abs(pivotValue) < 1e-10) {
            throw new Error(`Pivot element at [${pivotRow}, ${pivotCol}] cannot be zero.`);
        }

        const result: Float64Array[] = new Array(this._rows);
        for (let i = 0; i < this._rows; i++) {
            result[i] = new Float64Array(this._matrix[i]);
        }

        for (let j = 0; j < this._cols; j++) {
            result[pivotRow][j] /= pivotValue;
        }

        for (let i = 0; i < this._rows; i++) {
            if (i !== pivotRow) {
                const factor = result[i][pivotCol];
                for (let j = 0; j < this._cols; j++) {
                    result[i][j] -= factor * result[pivotRow][j];
                }
            }
        }

        return new Matrix(result);
    }

    public solve(b: Float64Array): Float64Array {
        if (b.length !== this._rows) {
            throw new Error(`A b vektor hossza (${b.length}) nem egyezik meg a mátrix sorainak számával (${this._rows}).`);
        }

        const augValues: Float64Array[] = new Array(this._rows);
        for (let i = 0; i < this._rows; i++) {
            const row = new Float64Array(this._cols + 1);
            row.set(this._matrix[i], 0);
            row[this._cols] = b[i];
            augValues[i] = row;
        }

        let aug = new Matrix(augValues);

        const m = aug.rows;
        const n = this._cols;
        let pivotRow = 0;
        const pivotCols: number[] = [];

        for (let col = 0; col < n && pivotRow < m; col++) {
            let maxRow = pivotRow;
            for (let r = pivotRow + 1; r < m; r++) {
                if (Math.abs(aug.getElement(r, col)) > Math.abs(aug.getElement(maxRow, col))) {
                    maxRow = r;
                }
            }

            if (Math.abs(aug.getElement(maxRow, col)) < 1e-10) {
                continue;
            }

            if (maxRow !== pivotRow) {
                const vals = aug.values;
                const temp = vals[pivotRow];
                vals[pivotRow] = vals[maxRow];
                vals[maxRow] = temp;
                aug = new Matrix(vals);
            }

            aug = aug.pivot(pivotRow, col);
            pivotCols.push(col);
            pivotRow++;
        }

        const finalVals = aug.values;
        for (let r = 0; r < m; r++) {
            let allZerosA = true;
            for (let c = 0; c < n; c++) {
                if (Math.abs(finalVals[r][c]) >= 1e-10) {
                    allZerosA = false;
                    break;
                }
            }
            const constantNonZero = Math.abs(finalVals[r][n]) > 1e-10;

            if (allZerosA && constantNonZero) {
                throw new Error('Az egyenletrendszernek nincs megoldása (ellentmondásos).');
            }
        }

        if (pivotCols.length < n) {
            throw new Error('Az egyenletrendszernek végtelen sok megoldása van (szabad paraméterek vannak).');
        }

        const x = new Float64Array(n);
        for (let i = 0; i < pivotCols.length; i++) {
            const col = pivotCols[i];
            x[col] = finalVals[i][n];
        }

        return x;
    }

    public multiply(matrixA: Matrix, matrixB: Matrix): Matrix {
        const a = matrixA.values;
        const b = matrixB.values;

        const rowsA = a.length;
        const colsA = a[0].length;
        const colsB = b[0].length;

        const result: Float64Array[] = new Array(rowsA);
        for (let i = 0; i < rowsA; i++) {
            result[i] = new Float64Array(colsB);
        }

        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
                let sum = 0;

                for (let k = 0; k < colsA; k++) {
                    sum += a[i][k] * b[k][j];
                }

                result[i][j] = sum;
            }
        }

        return new Matrix(result);
    }
}