import chiSquareQuantile from './chiSquareDist.js';

// ============================================================
// Special-function building blocks (log-gamma, incomplete beta)
// Needed to evaluate the *exact* F-distribution CDF and PDF, which
// the Newton refinement step requires. (Same Lanczos/Lentz machinery
// as in the t-distribution module - duplicated here so this file
// stays self-contained.)
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
// Exact F-distribution CDF and PDF
// ============================================================

/**
 * P(X <= x) for the F-distribution with (d1, d2) degrees of freedom.
 * Uses the standard relation to the regularized incomplete beta function.
 */
function fCDF(x: number, d1: number, d2: number): number {
    if (x <= 0) return 0;

    const y = (d1 * x) / (d1 * x + d2);

    return regularizedIncompleteBeta(y, d1 / 2, d2 / 2);
}

/**
 * Probability density function of the F-distribution.
 */
function fPDF(x: number, d1: number, d2: number): number {
    if (x <= 0) return 0;

    const logBeta = logGamma(d1 / 2) + logGamma(d2 / 2) - logGamma((d1 + d2) / 2);
    const logDensity =
        (d1 / 2) * Math.log(d1 / d2) +
        (d1 / 2 - 1) * Math.log(x) -
        ((d1 + d2) / 2) * Math.log(1 + (d1 / d2) * x) -
        logBeta;

    return Math.exp(logDensity);
}

// ============================================================
// F quantile: chi-square-ratio starting guess, refined with a
// bracket-safeguarded Newton iteration (rtsafe-style) against
// the exact CDF/PDF - same pattern as the chi-square module.
// ============================================================

/**
 * Rough starting guess built from the ratio of two independent chi-square
 * quantiles, evaluated at p and 1-p. This is NOT the exact F quantile
 * (the numerator and denominator chi-squares in the true F ratio don't
 * both sit at the same tail probability), but it's a cheap, reasonably
 * close seed, and correctness of the final answer only relies on the
 * bracketed Newton loop below - not on this guess being accurate.
 */
function chiRatioStartingGuess(p: number, d1: number, d2: number): number {
    const numerator = chiSquareQuantile(p, d1) / d1;
    const denominator = chiSquareQuantile(1 - p, d2) / d2;

    return numerator / denominator;
}

/**
 * Calculates the quantile (inverse cumulative distribution function) for
 * the F-distribution.
 *
 * @param p - Probability value strictly between 0 and 1.
 * @param d1 - Numerator degrees of freedom (must be strictly positive).
 * @param d2 - Denominator degrees of freedom (must be strictly positive).
 * @returns The F quantile value corresponding to the given probability and degrees of freedom.
 * @throws {Error} If `p` is not strictly between 0 and 1, or if `d1`/`d2` is <= 0.
 */
export default function fQuantile(p: number, d1: number, d2: number): number {
    if (p <= 0 || p >= 1) {
        throw new Error('Probability (p) must be strictly between 0 and 1.');
    }

    if (d1 <= 0 || d2 <= 0) {
        throw new Error('Degrees of freedom (d1, d2) must be strictly positive.');
    }

    let lo = 0;
    let hi = Math.max(chiRatioStartingGuess(p, d1, d2), 1);
    while (fCDF(hi, d1, d2) < p) {
        hi *= 2;
    }

    let x = chiRatioStartingGuess(p, d1, d2);
    if (!Number.isFinite(x) || x <= lo || x >= hi) {
        x = 0.5 * (lo + hi);
    }

    // Bracket-safeguarded Newton (rtsafe-style): for d1 < 2 the density is
    // singular at x -> 0, same caveat as the chi-square module's df < 2
    // case, so any wild Newton step just falls back to bisection via the
    // bracket check below.
    for (let iteration = 0; iteration < 100; iteration++) {
        const f0 = fCDF(x, d1, d2) - p;
        const f1 = fPDF(x, d1, d2);

        if (f0 < 0) {
            lo = x;
        } else {
            hi = x;
        }

        let xNew: number;
        if (f1 > 0 && Number.isFinite(f1)) {
            const newtonCandidate = x - f0 / f1;
            xNew = newtonCandidate > lo && newtonCandidate < hi && Number.isFinite(newtonCandidate) 
            ? newtonCandidate : 0.5 * (lo + hi);
        } else {
            xNew = 0.5 * (lo + hi);
        }

        if (Math.abs(xNew - x) <= 1e-14 * Math.max(x, 1e-300)) {
            x = xNew;
            break;
        }

        x = xNew;
    }

    return x;
}