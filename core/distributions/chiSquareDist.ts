import normalQuantile from './normalDist.js';

// ============================================================
// Special-function building blocks (log-gamma, incomplete gamma)
// Needed to evaluate the *exact* chi-squared CDF and PDF, which
// the Newton/Halley refinement step requires.
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

const MAX_ITERATIONS = 20000;
const EPSILON = 3e-16;
const FLOOR = 1e-300;

/**
 * Series expansion for the regularized lower incomplete gamma function,
 * valid for x < a + 1.
 */
function incompleteGammaSeries(a: number, x: number): number {
    if (x <= 0) return 0;

    let ap = a;
    let sum = 1 / a;
    let delta = sum;

    for (let n = 0; n < MAX_ITERATIONS; n++) {
        ap += 1;
        delta *= x / ap;
        sum += delta;
        if (Math.abs(delta) < Math.abs(sum) * EPSILON) break;
    }

    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

/**
 * Continued-fraction evaluation for the regularized upper incomplete
 * gamma function, valid for x >= a + 1 (Lentz's algorithm).
 */
function incompleteGammaContinuedFraction(a: number, x: number): number {
    let b = x + 1 - a;
    let c = 1 / FLOOR;
    let d = 1 / b;
    let h = d;

    for (let i = 1; i <= MAX_ITERATIONS; i++) {
        const an = -i * (i - a);
        b += 2;
        d = an * d + b;
        if (Math.abs(d) < FLOOR) d = FLOOR;
        c = b + an / c;
        if (Math.abs(c) < FLOOR) c = FLOOR;
        d = 1 / d;
        const delta = d * c;
        h *= delta;
        if (Math.abs(delta - 1) < EPSILON) break;
    }

    return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/**
 * Regularized lower incomplete gamma function P(a, x).
 */
function regularizedLowerIncompleteGamma(a: number, x: number): number {
    if (x < 0 || a <= 0) {
        throw new Error('regularizedLowerIncompleteGamma: require x >= 0 and a > 0.');
    }
    if (x === 0) return 0;

    if (x < a + 1) {
        return incompleteGammaSeries(a, x);
    }

    return 1 - incompleteGammaContinuedFraction(a, x);
}

// ============================================================
// Exact chi-squared CDF and PDF
// ============================================================

/**
 * P(X <= x) for the chi-squared distribution with `df` degrees of freedom.
 */
function chiSquareCDF(x: number, df: number): number {
    if (x <= 0) return 0;

    return regularizedLowerIncompleteGamma(df / 2, x / 2);
}

/**
 * Probability density function of the chi-squared distribution.
 */
function chiSquarePDF(x: number, df: number): number {
    if (x <= 0) return 0;

    const halfDf = df / 2;
    const logDensity = (halfDf - 1) * Math.log(x) - x / 2 - halfDf * Math.LN2 - logGamma(halfDf);

    return Math.exp(logDensity);
}

/**
 * Derivative of the chi-squared PDF with respect to x. Kept for reference,
 * but intentionally unused in the refinement loop below: for df < 2 the
 * density is singular at x -> 0, which makes a Halley-style correction
 * (which relies on this second derivative) numerically unstable there.
 * A bracket-safeguarded Newton step is used instead, which stays robust
 * even near that singularity.
 */
function chiSquarePDFDerivative(x: number, df: number, density: number): number {
    return density * ((df / 2 - 1) / x - 0.5);
}

// ============================================================
// Chi-squared quantile: Wilson-Hilferty starting guess, refined
// with a bracket-safeguarded Newton iteration (rtsafe-style)
// against the exact CDF/PDF.
// ============================================================

/**
 * Wilson-Hilferty approximation: a cube-root normal approximation that
 * gives a good starting guess for the chi-squared quantile.
 */
function wilsonHilferty(p: number, df: number): number {
    const z = normalQuantile(p);
    const term = 1 - 2 / (9 * df) + z * Math.sqrt(2 / (9 * df));

    return df * Math.pow(term, 3);
}

/**
 * Calculates the quantile (inverse cumulative distribution function) for
 * the chi-squared distribution.
 *
 * @param p - Probability value strictly between 0 and 1.
 * @param df - Degrees of freedom (must be strictly positive).
 * @returns The chi-squared quantile value corresponding to the given probability and degrees of freedom.
 * @throws {Error} If `p` is not strictly between 0 and 1, or if `df` is less than or equal to 0.
 */
export default function chiSquareQuantile(p: number, df: number): number {
    if (p <= 0 || p >= 1) {
        throw new Error('Probability (p) must be strictly between 0 and 1.');
    }

    if (df <= 0) {
        throw new Error('Degrees of freedom (df) must be strictly positive.');
    }

    let lo = 0;
    let hi = Math.max(wilsonHilferty(p, df), df, 1);
    while (chiSquareCDF(hi, df) < p) {
        hi *= 2;
    }

    let x = wilsonHilferty(p, df);
    if (!Number.isFinite(x) || x <= lo || x >= hi) {
        x = 0.5 * (lo + hi);
    }

    for (let iteration = 0; iteration < 100; iteration++) {
        const f0 = chiSquareCDF(x, df) - p;
        const f1 = chiSquarePDF(x, df);

        if (f0 < 0) {
            lo = x;
        } else {
            hi = x;
        }

        let xNew: number;
        if (f1 > 0 && Number.isFinite(f1)) {
            const newtonCandidate = x - f0 / f1;
            xNew = newtonCandidate > lo && newtonCandidate < hi && Number.isFinite(newtonCandidate) ? newtonCandidate : 0.5 * (lo + hi);
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