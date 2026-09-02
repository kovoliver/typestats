import normalQuantile from './normalDist.js';

// ============================================================
// Special-function building blocks (log-gamma, incomplete beta)
// These are needed to evaluate the *exact* t-distribution CDF
// and PDF, which the Newton/Halley refinement step requires.
// ============================================================

const LANCZOS_G = 7;
const LANCZOS_COEFFICIENTS = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
];

/**
 * Natural log of the Gamma function, via the Lanczos approximation.
 * Accurate to ~15 significant digits.
 */
function logGamma(x: number): number {
    if (x < 0.5) {
        // Reflection formula, in case of small/negative arguments.
        return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    }

    const shifted = x - 1;
    let a = LANCZOS_COEFFICIENTS[0];
    const t = shifted + LANCZOS_G + 0.5;

    for (let i = 1; i < LANCZOS_G + 2; i++) {
        a += LANCZOS_COEFFICIENTS[i] / (shifted + i);
    }

    return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Continued-fraction evaluation used inside the regularized incomplete
 * beta function (Lentz's algorithm).
 */
function betaContinuedFraction(x: number, a: number, b: number): number {
    const MAX_ITERATIONS = 200;
    const EPSILON = 3e-16;
    const FLOOR = 1e-300;

    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;

    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FLOOR) d = FLOOR;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= MAX_ITERATIONS; m++) {
        const m2 = 2 * m;

        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FLOOR) d = FLOOR;
        c = 1 + aa / c;
        if (Math.abs(c) < FLOOR) c = FLOOR;
        d = 1 / d;
        h *= d * c;

        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FLOOR) d = FLOOR;
        c = 1 + aa / c;
        if (Math.abs(c) < FLOOR) c = FLOOR;
        d = 1 / d;
        const delta = d * c;
        h *= delta;

        if (Math.abs(delta - 1) < EPSILON) break;
    }

    return h;
}

/**
 * Regularized incomplete beta function I_x(a, b).
 */
function regularizedIncompleteBeta(x: number, a: number, b: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
    const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta);

    if (x < (a + 1) / (a + b + 2)) {
        return (front * betaContinuedFraction(x, a, b)) / a;
    }

    return 1 - (front * betaContinuedFraction(1 - x, b, a)) / b;
}

// ============================================================
// Exact Student's t-distribution CDF (upper tail) and PDF
// ============================================================

/**
 * P(T > q) for the Student's t-distribution with `df` degrees of
 * freedom, valid for q >= 0.
 */
function tUpperTailProbability(q: number, df: number): number {
    const x = df / (df + q * q);

    return 0.5 * regularizedIncompleteBeta(x, df / 2, 0.5);
}

/**
 * Probability density function of the Student's t-distribution.
 */
function tDensity(x: number, df: number): number {
    const logDensity =
        logGamma((df + 1) / 2) - logGamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + (x * x) / df);

    return Math.exp(logDensity);
}

// ============================================================
// t-quantile: exact closed forms for df < 3, Hill's algorithm
// (with Newton/Halley refinement) for df >= 3
// ============================================================

function studentSmall(p: number, df: number): number {
    if (df === 1) {
        return Math.tan(Math.PI * (p - 0.5));
    }

    return (2 * p - 1) / Math.sqrt(2 * p * (1 - p));
}

function studentGeneral(p: number, df: number): number {
    // Reduce to the two-sided tail probability; restore the sign at the end.
    const P = 2 * Math.min(p, 1 - p);
    const isNegative = p < 0.5;

    const a = 1 / (df - 0.5);
    const b = 48 / (a * a);
    const c0 = ((20700 * a / b - 98) * a - 16) * a + 96.36;
    const d = ((94.5 / (b + c0) - 3) / b + 1) * Math.sqrt((a * Math.PI) / 2) * df;

    const y0 = Math.pow(d * P, 2 / df);

    let q: number;

    if (y0 > 0.05 + a) {
        // Asymptotic inverse expansion about the normal distribution.
        const x = normalQuantile(P / 2);
        let y = x * x;

        let c = c0;
        if (df < 5) {
            c += 0.3 * (df - 4.5) * (x + 0.6);
        }
        c = (((0.05 * d * x - 5) * x - 7) * x - 2) * x + b + c;

        y = ((((((0.4 * y + 6.3) * y + 36) * y + 94.5) / c) - y - 3) / b + 1) * x;
        y = Math.expm1(a * y * y);
        q = Math.sqrt(df * y);
    } else {
        // Small-P branch.
        let y = y0;
        y = ((1 / (((df + 6) / (df * y) - 0.089 * d - 0.822) * (df + 2) * 3) + 0.5 / (df + 4)) * y - 1) * (df + 1) / (df + 2) + 1 / y;
        q = Math.sqrt(df * y);
    }

    // Newton/Halley refinement against the exact CDF and PDF (Hill, 1981 remark).
    for (let iteration = 0; iteration < 10; iteration++) {
        const density = tDensity(q, df);
        if (density <= 0) break;

        const correction = (tUpperTailProbability(q, df) - P / 2) / density;
        if (!Number.isFinite(correction) || Math.abs(correction) <= 1e-14 * Math.abs(q)) break;

        q += correction * (1 + (correction * q * (df + 1)) / (2 * (q * q + df)));
    }

    return isNegative ? -q : q;
}

/**
 * Calculates the quantile (inverse cumulative distribution function) for Student's t-distribution.
 *
 * @param p - Probability value strictly between 0 and 1.
 * @param df - Degrees of freedom (must be strictly positive).
 * @returns The t-quantile value corresponding to the given probability and degrees of freedom.
 * @throws {Error} If `p` is not strictly between 0 and 1, or if `df` is less than or equal to 0.
 */
export default function tQuantile(p: number, df: number): number {
    if (p <= 0 || p >= 1) {
        throw new Error('Probability (p) must be strictly between 0 and 1.');
    }

    if (df <= 0) {
        throw new Error('Degrees of freedom (df) must be strictly positive.');
    }

    if (df === 1 || df === 2) {
        return studentSmall(p, df);
    }

    return studentGeneral(p, df);
}