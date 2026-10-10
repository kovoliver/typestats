import { RegressionType } from "../types/types.js";
import { mean } from "../wasm.js";
import Matrix2 from "../math/Matrix2.js";

export default class MultiRegression {
    private _xValues: Float64Array[];
    private _x: Matrix2;
    private _y: Matrix2;
    private _logX: Matrix2 | null = null;
    private _logY: Matrix2 | null = null;
    private _N: number;
    private _K: number;

    constructor(independents: Float64Array[], dependent: Float64Array) {
        this._N = dependent.length;
        this._K = independents.length;

        this._xValues = independents;
        this._y = new Matrix2(dependent, dependent.length, 1);
        this._x = Matrix2.fromColumns(independents);
    }

    private calculateLogXLazy() {
        const logColumns = this._xValues.map(
            col => Float64Array.from(col, Math.log)
        );

        this._logX = Matrix2.fromColumns(logColumns);
    }

    private calculateLogYLazy() {
        const logYvalues = new Float64Array(this._N);

        for (let row = 0; row < this._N; row++) {
            logYvalues[row] = Math.log(this._y.values[row]);
        }

        this._logY = new Matrix2(logYvalues, this._N, 1);
    }

    public calculateRegression(type: RegressionType = "linear") {
        const logXNecessary = type === "logarithmic" || type === "power";
        const logYNecessary = type === "exponential" || type === "power";

        if (logXNecessary && this._logX === null) {
            this.calculateLogXLazy();
        }

        if (logYNecessary && this._logY === null) {
            this.calculateLogYLazy();
        }

        const xValues = !logXNecessary ? this._x.values : this._logX?.values!;
        const yValues = !logYNecessary ? this._y.values : this._logY?.values!;

        const N = this._N;
        const K = this._K;
        const p = K + 1;
        const q = K + 1;

        const yMean = mean(yValues);

        const colTmp = new Float64Array(N);
        const xMeans = new Float64Array(K);

        for (let j = 0; j < K; j++) {
            for (let r = 0; r < N; r++) {
                colTmp[r] = xValues[r * K + j];
            }

            xMeans[j] = mean(colTmp);
        }

        const BLOCK = Math.max(64, Math.floor(4096 / q));
        const scratch = new Float64Array(q * BLOCK);
        const gram = new Float64Array(q * q);

        for (let start = 0; start < N; start += BLOCK) {
            const len = Math.min(BLOCK, N - start);
            const yDst = K * BLOCK;

            for (let r = 0; r < len; r++) {
                const row = (start + r) * K;

                for (let j = 0; j < K; j++) {
                    scratch[j * BLOCK + r] = xValues[row + j] - xMeans[j];
                }

                scratch[yDst + r] = yValues[start + r] - yMean;
            }

            const limit = len - 3;

            for (let j = 0; j < q; j++) {
                const aOff = j * BLOCK;

                for (let i = j; i < q; i++) {
                    const bOff = i * BLOCK;

                    let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
                    let r = 0;

                    for (; r < limit; r += 4) {
                        s0 += scratch[aOff + r] * scratch[bOff + r];
                        s1 += scratch[aOff + r + 1] * scratch[bOff + r + 1];
                        s2 += scratch[aOff + r + 2] * scratch[bOff + r + 2];
                        s3 += scratch[aOff + r + 3] * scratch[bOff + r + 3];
                    }

                    for (; r < len; r++) {
                        s0 += scratch[aOff + r] * scratch[bOff + r];
                    }

                    gram[j * q + i] += (s0 + s1) + (s2 + s3);
                }
            }
        }

        const dXtX = new Float64Array(K * K);
        const dXtY = new Float64Array(K);

        for (let j = 0; j < K; j++) {
            dXtY[j] = gram[j * q + K];

            for (let i = j; i < K; i++) {
                const v = gram[j * q + i];
                dXtX[j * K + i] = v;
                dXtX[i * K + j] = v;
            }
        }

        const dYtY = gram[K * q + K];

        const dXtX_Matrix = new Matrix2(dXtX, K, K);
        const dXtY_Matrix = new Matrix2(dXtY, K, 1);
        const slopeBetas = dXtX_Matrix.solve(dXtY_Matrix);

        let beta0 = yMean;
        let betaXtY = 0;

        for (let j = 0; j < K; j++) {
            const bJ = slopeBetas.getElement(j, 0);
            beta0 -= bJ * xMeans[j];
            betaXtY += bJ * dXtY[j];
        }

        const betas = new Float64Array(p);
        betas[0] = beta0;

        for (let j = 0; j < K; j++) {
            betas[j + 1] = slopeBetas.getElement(j, 0);
        }

        const ssRes = Math.max(0, dYtY - betaXtY);
        const rsd = Math.sqrt(ssRes / (N - p));

        const dfReg = K;
        const dfRes = N - p;
        const msReg = betaXtY / dfReg;
        const msRes = ssRes / dfRes;
        const fValue = msRes > 0 ? msReg / msRes : 0;

        return { betas, rsd, fValue };
    }

    private linLogFunc(
        i: number,
        coeffs: Float64Array,
        isLog: boolean = false
    ) {
        let predictedSum = coeffs[0];
        let predC = 0;

        for (let j = 1; j < coeffs.length; j++) {
            const xVal = !isLog ? this._xValues[j - 1][i] : Math.log(this._xValues[j - 1][i]);
            const yPart = xVal * coeffs[j];
            const t = predictedSum + yPart;

            if (Math.abs(predictedSum) >= Math.abs(yPart)) {
                predC += (predictedSum - t) + yPart;
            } else {
                predC += (yPart - t) + predictedSum;
            }

            predictedSum = t;
        }

        return predictedSum + predC;
    }

    public linFunc(
        i: number,
        coeffs: Float64Array
    ) {
        return this.linLogFunc(i, coeffs);
    }

    public logFunc(
        i: number,
        coeffs: Float64Array
    ) {
        return this.linLogFunc(i, coeffs, true);
    }

    public expFunc(i: number, coeffs: Float64Array) {
        let predictedSum = coeffs[0];

        for (let j = 1; j < coeffs.length; j++) {
            const y = coeffs[j] ** this._xValues[j - 1][i];
            predictedSum *= y;
        }

        return predictedSum;
    }

    public powFunc(i: number, coeffs: Float64Array) {
        let predictedSum = coeffs[0];

        for (let j = 1; j < coeffs.length; j++) {
            const y = this._xValues[j - 1][i] ** coeffs[j];
            predictedSum *= y;
        }

        return predictedSum;
    }
}