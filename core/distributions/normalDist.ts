/**
 * Cody (1969) rational Chebyshev coefficients for the standard normal CDF,
 * as used in R's pnorm(). Covers |x| <= sqrt(32) ~= 5.6569, i.e. roughly
 * p in (1e-8, 1 - 1e-8) - more than enough range for statistical use
 * (t-quantiles, p-values, confidence intervals).
 */
const codyCoeffs = {
    // Region 1: |x| <= z0
    a0: 2.2352520354606839287,
    a1: 161.02823106855587881,
    a2: 1067.6894854603709582,
    a3: 18154.981253343561249,
    a4: 0.065682337918207449113,
    b0: 47.20258190468824187,
    b1: 976.09855173777669322,
    b2: 10260.932208618978205,
    b3: 45507.789335026729956,

    // Region 2: z0 < |x| <= sqrt(32)
    c0: 0.39894151208813466764,
    c1: 8.8831497943883759412,
    c2: 93.506656132177855979,
    c3: 597.27027639480026226,
    c4: 2494.5375852903726711,
    c5: 6848.1904505362823326,
    c6: 11602.651437647350124,
    c7: 9842.7148383839780218,
    c8: 1.0765576773720192317e-8,
    d0: 22.266688044328115691,
    d1: 235.38790178262499861,
    d2: 1519.377599407554805,
    d3: 6485.558298266760755,
    d4: 18615.571640885098091,
    d5: 34900.952721145977266,
    d6: 38912.003286093271411,
    d7: 19685.429676859990727,
};

const Z0 = 0.6744897501960817; // = qnorm(0.75)
const SQRT_32 = Math.sqrt(32); // ~5.656854249

/**
 * Standard normal CDF, Phi(x), via Cody's (1969) rational Chebyshev
 * approximation (regions 1 and 2 only - valid for |x| <= sqrt(32)).
 *
 * @param x - Value at which to evaluate the standard normal CDF.
 * @returns Phi(x), accurate to ~16-18 significant digits for |x| <= sqrt(32).
 * @throws {Error} If |x| > sqrt(32) (extreme-tail region not implemented).
 */
export function normalCDF(x: number): number {
    const y = Math.abs(x);

    if (y <= Z0) {
        const t = x * x;

        const numerator = (((codyCoeffs.a4 * t + codyCoeffs.a0) * t + codyCoeffs.a1) * t + codyCoeffs.a2) * t + codyCoeffs.a3;
        const denominator = (((t + codyCoeffs.b0) * t + codyCoeffs.b1) * t + codyCoeffs.b2) * t + codyCoeffs.b3;

        return 0.5 + x * (numerator / denominator);
    }

    if (y <= SQRT_32) {
        const cCoefficients = [
            codyCoeffs.c0,
            codyCoeffs.c1,
            codyCoeffs.c2,
            codyCoeffs.c3,
            codyCoeffs.c4,
            codyCoeffs.c5,
            codyCoeffs.c6,
        ];
        const dCoefficients = [
            codyCoeffs.d0,
            codyCoeffs.d1,
            codyCoeffs.d2,
            codyCoeffs.d3,
            codyCoeffs.d4,
            codyCoeffs.d5,
            codyCoeffs.d6,
        ];

        let numerator = codyCoeffs.c8 * y;
        let denominator = y;

        for (let i = 0; i < cCoefficients.length; i++) {
            numerator = (numerator + cCoefficients[i]) * y;
            denominator = (denominator + dCoefficients[i]) * y;
        }

        numerator += codyCoeffs.c7;
        denominator += codyCoeffs.d7;

        const tail = Math.exp(-(x * x) / 2) * (numerator / denominator);

        return x <= 0 ? tail : 1 - tail;
    }

    throw new Error('normalCDF: |x| exceeds sqrt(32); extreme-tail region not implemented.');
}

/**
 * One Halley-iteration refinement step for a normal-quantile estimate,
 * using the high-precision normalCDF above instead of a low-precision
 * erfc approximation. This is what actually improves on the raw
 * Acklam estimate (unlike the AS 7.1.26-based version).
 *
 * @param x - Raw normal quantile estimate (e.g. from Acklam's algorithm).
 * @param p - The target probability the quantile was computed for.
 * @returns A refined normal quantile estimate.
 */
function refineWithHalley(x: number, p: number): number {
    const e = normalCDF(x) - p;
    const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);

    return x - u / (1 + (x * u) / 2);
}

// --- Acklam's algorithm (raw estimate) ---

const zCoeffs = {
    a1: -39.69683028665376,
    a2: 220.9460984245205,
    a3: -275.9285104469687,
    a4: 138.3577518672690,
    a5: -30.66479806614716,
    a6: 2.506628277459239,
    b1: -54.47609879822406,
    b2: 161.5858368580409,
    b3: -155.6989798598866,
    b4: 66.80131188771972,
    b5: -13.28068155288572,
    c1: -0.007784894002430293,
    c2: -0.3223964580411365,
    c3: -2.400758277161838,
    c4: -2.549732539343734,
    c5: 4.374664141464968,
    c6: 2.938163982698783,
    d1: 0.007784695709041462,
    d2: 0.3224671290700398,
    d3: 2.445134137142996,
    d4: 3.754408661907416,
};

function normalQuantileMiddle(p: number): number {
    const q = p - 0.5;
    const r = q * q;

    const numerator =
        ((((zCoeffs.a1 * r + zCoeffs.a2) * r + zCoeffs.a3) * r + zCoeffs.a4) * r + zCoeffs.a5) * r + zCoeffs.a6;

    const denominator =
        ((((zCoeffs.b1 * r + zCoeffs.b2) * r + zCoeffs.b3) * r + zCoeffs.b4) * r + zCoeffs.b5) * r + 1;

    return (numerator / denominator) * q;
}

function normalQuantileSides(p: number): number {
    const isUpperTail = p > 0.97575;
    const q = p < 0.02425 ? Math.sqrt(-2 * Math.log(p)) : Math.sqrt(-2 * Math.log(1 - p));

    const numerator =
        ((((zCoeffs.c1 * q + zCoeffs.c2) * q + zCoeffs.c3) * q + zCoeffs.c4) * q + zCoeffs.c5) * q + zCoeffs.c6;

    const denominator =
        (((zCoeffs.d1 * q + zCoeffs.d2) * q + zCoeffs.d3) * q + zCoeffs.d4) * q + 1;

    const val = numerator / denominator;

    return isUpperTail ? -val : val;
}

/**
 * Calculates the quantile (inverse CDF / probit) for the standard normal
 * distribution N(0, 1), refined with one Halley iteration against a
 * high-precision (Cody) CDF evaluation.
 *
 * @param p - Probability value strictly between 0 and 1.
 * @returns The standard normal z-score corresponding to the given probability.
 * @throws {Error} If `p` is not strictly between 0 and 1.
 */
export default function normalQuantile(p: number): number {
    if (p <= 0 || p >= 1) {
        throw new Error('The probability must be strictly between 0 and 1.');
    }

    const raw = p < 0.02425 || p > 0.97575 ? normalQuantileSides(p) : normalQuantileMiddle(p);

    return refineWithHalley(raw, p);
}