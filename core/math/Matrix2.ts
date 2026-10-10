import { flattenArray } from "../wasm.js";

export default class Matrix2 {
    private _rows: number;
    private _cols: number;
    private _values: Float64Array;

    constructor(values: Float64Array[] | Float64Array, rows?: number, cols?: number) {
        const isFlatten = values instanceof Float64Array;

        if (isFlatten && (typeof rows !== 'number' || typeof cols !== 'number')) {
            throw new Error("When the values array is flatten you must provide the column and row numbers!");
        }

        if (isFlatten && (Number(rows) <= 0 || Number(cols) <= 0)) {
            throw new Error("When the values array is flattened, the dimensions must be at least 1x1!");
        }

        if (values.length === 0 || (!isFlatten && values[0].length === 0)) {
            throw new Error("The provided array must contain at least one value!");
        }

        this._values = !isFlatten
            ? flattenArray(values as Float64Array[]) : values as Float64Array;
        this._cols = !isFlatten ? values.length : cols as number;
        this._rows = !isFlatten ? (values[0] as Float64Array).length : rows as number;
    }

    public get rows() {
        return this._rows;
    }

    public get cols() {
        return this._cols;
    }

    public get values() {
        return this._values.slice();
    }

    public isSquare(): boolean {
        return this.rows == this.cols;
    }

    public static fromColumns(columns: Float64Array[]): Matrix2 {
        if (!columns || columns.length === 0) {
            throw new Error("The provided array must contain at least one value!");
        }

        const cols = columns.length;
        const rows = columns[0].length;

        if (rows === 0) {
            throw new Error("The provided array must contain at least one value!");
        }

        for (let c = 0; c < cols; c++) {
            if (columns[c].length !== rows) {
                throw new Error("All columns must have the same length!");
            }
        }

        const values = new Float64Array(rows * cols);

        for (let c = 0; c < cols; c++) {
            const colData = columns[c];

            for (let r = 0; r < rows; r++) {
                values[r * cols + c] = colData[r];
            }
        }

        return new Matrix2(values, rows, cols);
    }

    public isSymmetric(): boolean {
        if (!this.isSquare()) {
            return false;
        }

        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.getElement(row, col) - Math.abs(this.getElement(row, col)) > 1e-9) {
                    return false;
                }
            }
        }

        return true;
    }

    public getElement(row: number, col: number) {
        return this._values[row * this._cols + col];
    }

    public get transposed() {
        const values = new Float64Array(this._cols * this._rows);

        for (let r = 0; r < this._rows; r++) {
            for (let c = 0; c < this._cols; c++) {
                values[c * this._rows + r] =
                    this._values[r * this._cols + c];
            }
        }

        return new Matrix2(values, this._cols, this._rows);
    }

    public multiply(matrix: Matrix2): Matrix2 {
        if (this._cols !== matrix.rows) {
            throw new Error("Matrix dimensions are incompatible.");
        }

        const values = new Float64Array(this._rows * matrix.cols);

        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < matrix.cols; col++) {
                let sum = 0;
                let c = 0;

                for (let k = 0; k < this._cols; k++) {
                    const x = this._values[row * this._cols + k] *
                        matrix._values[k * matrix.cols + col];

                    const t = sum + x;

                    if (Math.abs(sum) >= Math.abs(x)) {
                        c += (sum - t) + x;
                    } else {
                        c += (x - t) + sum;
                    }

                    sum = t;
                }

                values[row * matrix.cols + col] = sum + c;
            }
        }

        return new Matrix2(values, this._rows, matrix.cols);
    }

    public multiplyCentered(matrix: Matrix2): Matrix2 {
        if (this._cols !== matrix.rows) {
            throw new Error("Matrix dimensions are incompatible.");
        }

        const rowMeansA = new Float64Array(this._rows);

        for (let row = 0; row < this._rows; row++) {
            let sum = 0;
            const rowOffset = row * this._cols;
            for (let k = 0; k < this._cols; k++) {
                sum += this._values[rowOffset + k];
            }
            rowMeansA[row] = sum / this._cols;
        }

        const colMeansB = new Float64Array(matrix.cols);

        for (let col = 0; col < matrix.cols; col++) {
            let sum = 0;
            for (let row = 0; row < matrix.rows; row++) {
                sum += matrix._values[row * matrix.cols + col];
            }
            colMeansB[col] = sum / matrix.rows;
        }

        const values = new Float64Array(this._rows * matrix.cols);

        for (let row = 0; row < this._rows; row++) {
            const rowOffsetA = row * this._cols;
            const meanA = rowMeansA[row];

            for (let col = 0; col < matrix.cols; col++) {
                let sum = 0;
                let c = 0;
                const meanB = colMeansB[col];

                for (let k = 0; k < this._cols; k++) {
                    const valA = this._values[rowOffsetA + k] - meanA;
                    const valB = matrix._values[k * matrix.cols + col] - meanB;
                    const x = valA * valB;
                    const t = sum + x;

                    if (Math.abs(sum) >= Math.abs(x)) {
                        c += (sum - t) + x;
                    } else {
                        c += (x - t) + sum;
                    }

                    sum = t;
                }

                values[row * matrix.cols + col] = sum + c;
            }
        }

        return new Matrix2(values, this._rows, matrix.cols);
    }

    public multiplyCenteredOptimized(matrix: Matrix2): Matrix2 {
        const rowsA = this._rows;
        const colsA = this._cols;
        const colsB = matrix.cols;
        const valuesA = this._values;
        const valuesB = matrix._values;

        const colMeansA = new Float64Array(colsA);

        for (let c = 0; c < colsA; c++) {
            let sum = 0;
            for (let r = 0; r < rowsA; r++) {
                sum += valuesA[r * colsA + c];
            }
            colMeansA[c] = sum / rowsA;
        }

        const colMeansB = new Float64Array(colsB);
        
        for (let c = 0; c < colsB; c++) {
            let sum = 0;
            for (let r = 0; r < matrix.rows; r++) {
                sum += valuesB[r * colsB + c];
            }
            colMeansB[c] = sum / matrix.rows;
        }

        const resultValues = new Float64Array(rowsA * colsB);

        for (let r = 0; r < rowsA; r++) {
            const rowOffsetA = r * colsA;

            for (let c = 0; c < colsB; c++) {
                let sum = 0;
                let compensation = 0;
                const meanB = colMeansB[c];

                for (let k = 0; k < colsA; k++) {
                    const valA = valuesA[rowOffsetA + k] - colMeansA[k];
                    const valB = valuesB[k * colsB + c] - meanB;
                    const prod = valA * valB;

                    const t = sum + prod;
                    if (Math.abs(sum) >= Math.abs(prod)) {
                        compensation += (sum - t) + prod;
                    } else {
                        compensation += (prod - t) + sum;
                    }
                    sum = t;
                }

                resultValues[r * colsB + c] = sum + compensation;
            }
        }

        return new Matrix2(resultValues, rowsA, colsB);
    }

    public static createIdentityMatrix(rows: number, cols: number = rows): Matrix2 {
        const values = new Float64Array(rows * cols);
        const minDim = Math.min(rows, cols);

        for (let i = 0; i < minDim; i++) {
            values[i * cols + i] = 1.0;
        }

        return new Matrix2(values, rows, cols);
    }

    public solve(matrix: Matrix2): Matrix2 {
        if (this._rows !== this._cols) {
            throw new Error("The coefficient matrix must be square.");
        }

        if (this._rows !== matrix.rows) {
            throw new Error("Matrix dimensions are incompatible for solving.");
        }

        const n = this._rows;
        const rhsCols = matrix.cols;

        const A = new Float64Array(this._values);
        const B = new Float64Array(matrix._values);

        for (let i = 0; i < n; i++) {
            let pivotRow = i;
            let maxVal = Math.abs(A[i * n + i]);

            for (let k = i + 1; k < n; k++) {
                const val = Math.abs(A[k * n + i]);

                if (val > maxVal) {
                    maxVal = val;
                    pivotRow = k;
                }
            }

            if (Math.abs(maxVal) < 1e-12) {
                throw new Error("Matrix is singular or nearly singular.");
            }

            if (pivotRow !== i) {
                for (let j = 0; j < n; j++) {
                    const temp = A[i * n + j];
                    A[i * n + j] = A[pivotRow * n + j];
                    A[pivotRow * n + j] = temp;
                }

                for (let j = 0; j < rhsCols; j++) {
                    const temp = B[i * rhsCols + j];
                    B[i * rhsCols + j] = B[pivotRow * rhsCols + j];
                    B[pivotRow * rhsCols + j] = temp;
                }
            }

            const pivot = A[i * n + i];

            for (let j = 0; j < n; j++) {
                A[i * n + j] /= pivot;
            }

            for (let j = 0; j < rhsCols; j++) {
                B[i * rhsCols + j] /= pivot;
            }

            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = A[k * n + i];

                    for (let j = 0; j < n; j++) {
                        let sum = A[k * n + j];
                        let c = 0;
                        const x = -factor * A[i * n + j];
                        const t = sum + x;

                        if (Math.abs(sum) >= Math.abs(x)) {
                            c += (sum - t) + x;
                        } else {
                            c += (x - t) + sum;
                        }

                        A[k * n + j] = t + c;
                    }

                    for (let j = 0; j < rhsCols; j++) {
                        let sum = B[k * rhsCols + j];
                        let c = 0;
                        const x = -factor * B[i * rhsCols + j];
                        const t = sum + x;

                        if (Math.abs(sum) >= Math.abs(x)) {
                            c += (sum - t) + x;
                        } else {
                            c += (x - t) + sum;
                        }

                        B[k * rhsCols + j] = t + c;
                    }
                }
            }
        }

        return new Matrix2(B, n, rhsCols);
    }

    public get inverted(): Matrix2 {
        if (this._rows !== this._cols) {
            throw new Error("Only square matrices can be inverted.");
        }

        const identity = Matrix2.createIdentityMatrix(this._rows, this._cols);
        return this.solve(identity);
    }
}