import { describe, it, expect } from 'vitest';
import {
    getPassed, zTest, tTest, zTestProportion, chi2Test, chi2FitTest,
    chiSquaredIndependenceTest, zTestTwoSamples, tTestTwoSamples,
    twoSampleAsymptoticZMeanTest, zTestProportionTwoSamples, fTestTwoSamples,
    tTestIndependent, oneWayAnova, bartlett
} from '../../core/inference/hypothesis';

describe('Hypothesis Testing Functions', () => {
    describe('getPassed', () => {
        describe('Validation and Error Handling', () => {
            it('throws an error for an invalid test direction', () => {
                expect(() => getPassed(1.96, 1.5, 'invalid-direction' as any))
                    .toThrow('Invalid test direction: invalid-direction');
            });
        });

        describe('Left-sided Test Logic (H0: value >= criticalVal)', () => {
            it('returns true when value is strictly greater than left critical value', () => {
                expect(getPassed(-1.6449, 0.0, 'left')).toBe(true);
            });

            it('returns true when value is exactly equal to left critical value', () => {
                expect(getPassed(-1.6449, -1.6449, 'left')).toBe(true);
            });

            it('returns false when value falls into the rejection region (less than critical value)', () => {
                expect(getPassed(-1.6449, -2.5, 'left')).toBe(false);
            });
        });

        describe('Right-sided Test Logic (H0: value <= criticalVal)', () => {
            it('returns true when value is strictly less than right critical value', () => {
                expect(getPassed(1.6449, 1.0, 'right')).toBe(true);
            });

            it('returns true when value is exactly equal to right critical value', () => {
                expect(getPassed(1.6449, 1.6449, 'right')).toBe(true);
            });

            it('returns false when value falls into the rejection region (greater than critical value)', () => {

                expect(getPassed(1.6449, 2.5, 'right')).toBe(false);
            });
        });

        describe('Two-sided Test Logic (H0: |value| <= criticalVal)', () => {
            it('returns true when absolute value is within bounds', () => {

                expect(getPassed(1.96, 1.5, 'two-sided')).toBe(true);
                expect(getPassed(1.96, -1.5, 'two-sided')).toBe(true);
            });

            it('returns true when absolute value is exactly equal to upper critical bound', () => {
                expect(getPassed(1.96, 1.96, 'two-sided')).toBe(true);
                expect(getPassed(1.96, -1.96, 'two-sided')).toBe(true);
            });

            it('returns false when positive value exceeds critical bound', () => {
                expect(getPassed(1.96, 2.5, 'two-sided')).toBe(false);
            });

            it('returns false when negative value falls outside critical bound', () => {
                expect(getPassed(1.96, -2.5, 'two-sided')).toBe(false);
            });
        });
    });

    describe('1. One-Sample z-Test', () => {
        it('calculates Z test statistic correctly for two-sided test (H0 accepted)', () => {
            const result = zTest([1, 2, 3], 0.75, 0.05, 1.5, 'two-sided');
            expect(result.z).toBeCloseTo(1.1547, 4);
            expect(result.passed).toBe(true);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.Z).toBe('number');
        });

        it('calculates Z test statistic correctly for two-sided test (H0 rejected)', () => {
            const result = zTest([1, 2, 3], 0.375, 0.05, 1.5, 'two-sided');
            expect(result.z).toBeCloseTo(2.3094, 4);
            expect(result.passed).toBe(false);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.Z).toBe('number');
        });

        it('calculates Z test statistic correctly for left-sided test (H0 accepted)', () => {
            const result = zTest([1, 2, 3], 0.375, 0.05, 1.5, 'left');
            expect(result.z).toBeCloseTo(2.3094, 4);
            expect(result.passed).toBe(true);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.Z).toBe('number');
        });

        it('calculates Z test statistic correctly for left-sided test (H0 rejected)', () => {
            const result = zTest([-1, -2, -3], 0.75, 0.05, 0, 'left');
            expect(result.z).toBeCloseTo(-4.6188, 4);
            expect(result.passed).toBe(false);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.Z).toBe('number');
        });

        it('calculates Z test statistic correctly for right-sided test (H0 accepted)', () => {
            const result = zTest([4, 8, 10, 12, 25, 7, 6], 7, 0.1, 7, 'right');
            expect(result.z).toBeCloseTo(1.2419, 4);
            expect(result.passed).toBe(true);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.Z).toBe('number');
        });

        it('calculates Z test statistic correctly for right-sided test (H0 rejected)', () => {
            const result = zTest([1, 2, 3], 0.375, 0.05, 1.5, 'right');
            expect(result.z).toBeCloseTo(2.3094, 4);
            expect(result.passed).toBe(false);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.Z).toBe('number');
        });
    });

    describe('tTest', () => {
        it('throws if sample size is less than 2', () => {
            expect(() => tTest([1], 0.05, 0, 'two-sided')).toThrow(/contain at least two values/);
        });

        it('throws if sample standard deviation is zero', () => {
            expect(() => tTest([2, 2, 2], 0.05, 0, 'two-sided')).toThrow(/cannot be zero/);
        });

        it('calculates t test statistic correctly for two-sided test (H0 accepted)', () => {
            const result = tTest([1, 2, 3], 0.05, 0, 'two-sided');
            expect(result.t).toBeCloseTo(3.4641, 4);
            expect(typeof result.passed).toBe('boolean');
            expect(result.passed).toBe(true);
            expect(typeof result.T).toBe('number');
        });

        it('calculates t test statistic correctly for two-sided test (H0 rejected)', () => {
            const result = tTest([4, 8, 10, 12, 25, 7, 6], 0.1, 1, 'two-sided');
            expect(result.t).toBeCloseTo(3.513, 3);
            expect(result.passed).toBe(false);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.T).toBe('number');
        });

        it('calculates t test statistic correctly for left-sided test (H0 accepted)', () => {
            const result = tTest([1, 2, 3], 0.05, 0, 'left');
            expect(result.t).toBeCloseTo(3.4641, 4);
            expect(result.passed).toBe(true);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.T).toBe('number');
        });

        it('calculates t test statistic correctly for left-sided test (H0 rejected)', () => {
            const result = tTest([-1, -2, -3], 0.05, 0, 'left');
            expect(result.t).toBeCloseTo(-3.4641, 4);
            expect(result.passed).toBe(false);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.T).toBe('number');
        });

        it('calculates t test statistic correctly for right-sided test (H0 accepted)', () => {
            const result = tTest([4, 8, 10, 12, 25, 7, 6], 0.1, 7, 'right');
            expect(result.t).toBeCloseTo(1.243, 3);
            expect(result.passed).toBe(true);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.T).toBe('number');
        });

        it('calculates t test statistic correctly for right-sided test (H0 rejected)', () => {
            const result = tTest([1, 2, 3], 0.05, 0, 'right');
            expect(result.t).toBeCloseTo(3.4641, 4);
            expect(result.passed).toBe(false);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.T).toBe('number');
        });
    });

    describe('zTestProportion', () => {
        describe('Validation and Edge Cases', () => {
            it('throws for invalid population proportion (<= 0 or >= 1)', () => {
                expect(() => zTestProportion(0, 0.5, 100, 0.05, 'two-sided'))
                    .toThrow(/strictly between 0 and 1/);
                expect(() => zTestProportion(1, 0.5, 100, 0.05, 'two-sided'))
                    .toThrow(/strictly between 0 and 1/);
            });

            it('throws for invalid sample proportion (< 0 or > 1)', () => {
                expect(() => zTestProportion(0.5, -0.1, 100, 0.05, 'two-sided'))
                    .toThrow(/between 0 and 1/);
                expect(() => zTestProportion(0.5, 1.1, 100, 0.05, 'two-sided'))
                    .toThrow(/between 0 and 1/);
            });

            it('throws if sample size is less than or equal to zero', () => {
                expect(() => zTestProportion(0.5, 0.6, 0, 0.05, 'two-sided'))
                    .toThrow(/greater than 0/);
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates Z test proportion correctly for two-sided test (H0 accepted)', () => {
                const result = zTestProportion(0.5, 0.52, 100, 0.05, 'two-sided');
                expect(result.z).toBeCloseTo(0.4, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });

            it('calculates Z test proportion correctly for two-sided test (H0 rejected)', () => {
                const result = zTestProportion(0.5, 0.6, 100, 0.05, 'two-sided');
                expect(result.z).toBeCloseTo(2.0, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });

            it('calculates Z test proportion correctly for left-sided test (H0 accepted)', () => {
                const result = zTestProportion(0.5, 0.6, 100, 0.05, 'left');
                expect(result.z).toBeCloseTo(2.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });

            it('calculates Z test proportion correctly for left-sided test (H0 rejected)', () => {
                const result = zTestProportion(0.5, 0.4, 100, 0.05, 'left');
                expect(result.z).toBeCloseTo(-2.0, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });

            it('calculates Z test proportion correctly for right-sided test (H0 accepted)', () => {
                const result = zTestProportion(0.5, 0.45, 100, 0.05, 'right');
                expect(result.z).toBeCloseTo(-1.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });

            it('calculates Z test proportion correctly for right-sided test (H0 rejected)', () => {
                const result = zTestProportion(0.5, 0.6, 100, 0.05, 'right');
                expect(result.z).toBeCloseTo(2.0, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });
        });
    });

    describe('chi2Test', () => {
        describe('Validation and Edge Cases', () => {
            it('throws if hypothetical variance is less than or equal to 0', () => {
                expect(() => chi2Test([1, 2, 3], 0, 0.05, 'right'))
                    .toThrow(/strictly greater than 0/);
                expect(() => chi2Test([1, 2, 3], -1, 0.05, 'right'))
                    .toThrow(/strictly greater than 0/);
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates chi2 test correctly for two-sided test (H0 accepted)', () => {
                const result = chi2Test([1, 2, 3], 1.0, 0.05, 'two-sided');
                expect(result.chi2).toBeCloseTo(2.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds).toBeDefined();
            });

            it('calculates chi2 test correctly for two-sided test (H0 rejected)', () => {
                const result = chi2Test([1, 2, 3], 0.2, 0.05, 'two-sided');
                expect(result.chi2).toBeCloseTo(10.0, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds).toBeDefined();
            });

            it('calculates chi2 test correctly for left-sided test (H0 accepted)', () => {
                const result = chi2Test([1, 2, 3], 1.0, 0.05, 'left');
                expect(result.chi2).toBeCloseTo(2.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds).toBeDefined();
            });

            it('calculates chi2 test correctly for left-sided test (H0 rejected)', () => {
                const result = chi2Test([1, 2, 3], 50.0, 0.05, 'left');
                expect(result.chi2).toBeCloseTo(0.04, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds).toBeDefined();
            });

            it('calculates chi2 test correctly for right-sided test (H0 accepted)', () => {
                const result = chi2Test([1, 2, 3], 1.0, 0.05, 'right');
                expect(result.chi2).toBeCloseTo(2.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds).toBeDefined();
            });

            it('calculates chi2 test correctly for right-sided test (H0 rejected)', () => {
                const result = chi2Test([1, 2, 3], 0.2, 0.05, 'right');
                expect(result.chi2).toBeCloseTo(10.0, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds).toBeDefined();
            });
        });
    });

    describe('chi2FitTest', () => {
        describe('Validation and Edge Cases', () => {
            it('throws if observed and expected arrays have different lengths', () => {
                expect(() => chi2FitTest([10, 20], [10, 20, 30], 0.05))
                    .toThrow(/same length/);
            });

            it('throws if arrays contain fewer than two categories', () => {
                expect(() => chi2FitTest([10], [10], 0.05))
                    .toThrow(/at least two categories/);
            });

            it('throws if observed frequencies are negative', () => {
                expect(() => chi2FitTest([-5, 15], [10, 10], 0.05))
                    .toThrow(/cannot be negative/);
            });

            it('throws if expected frequencies are less than or equal to 0', () => {
                expect(() => chi2FitTest([10, 10], [0, 10], 0.05))
                    .toThrow(/strictly greater than 0/);
            });

            it('throws if calculated degrees of freedom is less than or equal to 0', () => {
                expect(() => chi2FitTest([10, 10], [10, 10], 0.05, 1))
                    .toThrow(/Degrees of freedom must be greater than 0/);
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates chi2 fit statistic correctly when observed matches expected perfectly (H0 accepted)', () => {
                const result = chi2FitTest(
                    [10, 10, 10, 10, 10, 10],
                    [10, 10, 10, 10, 10, 10],
                    0.05
                );
                expect(result.chi2).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds.upper).toBeDefined();
            });

            it('calculates chi2 fit statistic correctly for large deviation (H0 rejected)', () => {
                const result = chi2FitTest(
                    [20, 5, 5, 30],
                    [15, 15, 15, 15],
                    0.05
                );
                expect(result.chi2).toBeCloseTo(30.0, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds.upper).toBeDefined();
            });

            it('adjusts degrees of freedom correctly when estimated parameters are specified', () => {
                const result = chi2FitTest(
                    [12, 18, 20, 25, 25],
                    [20, 20, 20, 20, 20],
                    0.05,
                    1
                );
                expect(result.chi2).toBeCloseTo(5.9, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
            });
        });
    });

    describe('chiSquaredIndependenceTest', () => {
        describe('Validation and Edge Cases', () => {
            it('throws if contingency table has fewer than 2 rows', () => {
                expect(() => chiSquaredIndependenceTest([[10, 20]], 0.05))
                    .toThrow(/at least 2 rows/);
            });

            it('throws if contingency table has fewer than 2 columns', () => {
                expect(() => chiSquaredIndependenceTest([[10], [20]], 0.05))
                    .toThrow(/at least 2 columns/);
            });

            it('throws if rows have inconsistent column lengths', () => {
                const table = [
                    [10, 20],
                    [10, 20, 30]
                ];
                expect(() => chiSquaredIndependenceTest(table, 0.05))
                    .toThrow(/same number of columns/);
            });

            it('throws if observed frequencies contain negative numbers', () => {
                const table = [
                    [-5, 10],
                    [10, 20]
                ];
                expect(() => chiSquaredIndependenceTest(table, 0.05))
                    .toThrow(/cannot be negative/);
            });

            it('throws if the entire contingency table contains only zeros', () => {
                const table = [
                    [0, 0],
                    [0, 0]
                ];
                expect(() => chiSquaredIndependenceTest(table, 0.05))
                    .toThrow(/non-zero data/);
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates chi2 statistic correctly when variables are perfectly independent (H0 accepted)', () => {
                const table = [
                    [10, 10],
                    [10, 10]
                ];
                const result = chiSquaredIndependenceTest(table, 0.05);

                expect(result.chi2).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds.upper).toBeDefined();
            });

            it('calculates chi2 statistic correctly for strong association (H0 rejected)', () => {
                const table = [
                    [40, 10],
                    [10, 40]
                ];

                const result = chiSquaredIndependenceTest(table, 0.05);

                expect(result.chi2).toBeCloseTo(36.0, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds.upper).toBeDefined();
            });

            it('calculates chi2 statistic and degrees of freedom correctly for 3x2 table', () => {
                const table = [
                    [10, 20],
                    [20, 10],
                    [15, 15]
                ];
                const result = chiSquaredIndependenceTest(table, 0.05);

                expect(result.chi2).toBeCloseTo(6.6667, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });
        });
    });

    describe('zTestTwoSamples', () => {
        describe('Validation and Edge Cases', () => {
            it('throws if either sample is empty', () => {
                expect(() => zTestTwoSamples([], [1, 2], 1, 1, 0.05, 'two-sided'))
                    .toThrow(/at least one element/);
                expect(() => zTestTwoSamples([1, 2], [], 1, 1, 0.05, 'two-sided'))
                    .toThrow(/at least one element/);
            });

            it('throws if population variances are less than or equal to 0', () => {
                expect(() => zTestTwoSamples([1, 2], [3, 4], 0, 1, 0.05, 'two-sided'))
                    .toThrow(/strictly greater than 0/);
                expect(() => zTestTwoSamples([1, 2], [3, 4], 1, -2, 0.05, 'two-sided'))
                    .toThrow(/strictly greater than 0/);
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates Z test statistic correctly for two-sided test (H0 accepted)', () => {
                const result = zTestTwoSamples([10, 12, 14], [10, 12, 14], 4, 4, 0.05, 'two-sided');

                expect(result.z).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });

            it('calculates Z test statistic correctly for two-sided test (H0 rejected)', () => {
                const result = zTestTwoSamples([20, 22, 24], [10, 12, 14], 3, 3, 0.05, 'two-sided');

                expect(result.z).toBeCloseTo(7.0711, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });

            it('calculates Z test statistic correctly with custom meanDifference', () => {
                const result = zTestTwoSamples([20, 22, 24], [10, 12, 14], 3, 3, 0.05, 'two-sided', 10);

                expect(result.z).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates Z test statistic correctly for left-sided test (H0 rejected)', () => {
                const result = zTestTwoSamples([10, 12, 14], [20, 22, 24], 3, 3, 0.05, 'left');

                expect(result.z).toBeCloseTo(-7.0711, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates Z test statistic correctly for right-sided test (H0 accepted)', () => {
                const result = zTestTwoSamples([10, 12, 14], [20, 22, 24], 3, 3, 0.05, 'right');

                expect(result.z).toBeCloseTo(-7.0711, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
            });
        });
    });

    describe('tTestTwoSamples', () => {
        describe('Validation and Edge Cases', () => {
            it('throws if either sample contains fewer than 2 elements', () => {
                expect(() => tTestTwoSamples([1], [1, 2, 3], 0.05, 'two-sided'))
                    .toThrow(/at least two elements/);
                expect(() => tTestTwoSamples([1, 2, 3], [2], 0.05, 'two-sided'))
                    .toThrow(/at least two elements/);
            });

            it('throws if standard error is zero (constant samples with zero variance)', () => {
                expect(() => tTestTwoSamples([2, 2, 2], [2, 2, 2], 0.05, 'two-sided'))
                    .toThrow(/Standard error is zero/);
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates Pooled Two-Sample t-test correctly (assumeEqualVariances = true, H0 rejected)', () => {
                const result = tTestTwoSamples([1, 2, 3, 4], [5, 6, 7, 8], 0.05, 'two-sided', true);

                expect(result.t).toBeCloseTo(-4.3818, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.T).toBe('number');
            });

            it('calculates Welch Two-Sample t-test correctly (assumeEqualVariances = false, H0 accepted)', () => {
                const result = tTestTwoSamples([1, 2, 3], [2, 3, 4, 5], 0.05, 'two-sided', false);

                expect(result.t).toBeCloseTo(-1.7321, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.T).toBe('number');
            });

            it('calculates t-test correctly with custom meanDifference', () => {
                const result = tTestTwoSamples([1, 2, 3, 4], [5, 6, 7, 8], 0.05, 'two-sided', true, -4.0);

                expect(result.t).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates left-sided Welch t-test correctly (H0 rejected)', () => {
                const result = tTestTwoSamples([1, 2, 3, 4], [5, 6, 7, 8], 0.05, 'left', false);

                expect(result.t).toBeCloseTo(-4.3818, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates right-sided Pooled t-test correctly (H0 accepted)', () => {
                const result = tTestTwoSamples([1, 2, 3, 4], [5, 6, 7, 8], 0.05, 'right', true);

                expect(result.t).toBeCloseTo(-4.3818, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
            });
        });
    });

    describe('twoSampleAsymptoticZMeanTest', () => {
        describe('Validation and Edge Cases', () => {
            it('throws if either sample contains fewer than 2 elements', () => {
                expect(() => twoSampleAsymptoticZMeanTest([1], [1, 2, 3], 0.05, 'two-sided'))
                    .toThrow(/at least two elements/);
                expect(() => twoSampleAsymptoticZMeanTest([1, 2, 3], [2], 0.05, 'two-sided'))
                    .toThrow(/at least two elements/);
            });

            it('throws if standard error is zero (constant samples)', () => {
                expect(() => twoSampleAsymptoticZMeanTest([2, 2, 2], [2, 2, 2], 0.05, 'two-sided'))
                    .toThrow(/Standard error is zero/);
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates asymptotic Z statistic correctly for two-sided test (H0 accepted)', () => {
                const result = twoSampleAsymptoticZMeanTest([10, 12, 14], [10, 12, 14], 0.05, 'two-sided');

                expect(result.z).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });

            it('calculates asymptotic Z statistic correctly for two-sided test (H0 rejected)', () => {
                const result = twoSampleAsymptoticZMeanTest([10, 12, 14], [2, 4, 6], 0.05, 'two-sided');

                expect(result.z).toBeCloseTo(4.89898, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });

            it('calculates asymptotic Z statistic correctly with custom meanDifference', () => {
                const result = twoSampleAsymptoticZMeanTest([10, 12, 14], [2, 4, 6], 0.05, 'two-sided', 8.0);

                expect(result.z).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates left-sided asymptotic Z test correctly (H0 rejected)', () => {
                const result = twoSampleAsymptoticZMeanTest([2, 4, 6], [10, 12, 14], 0.05, 'left');

                expect(result.z).toBeCloseTo(-4.89898, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates right-sided asymptotic Z test correctly (H0 accepted)', () => {
                const result = twoSampleAsymptoticZMeanTest([2, 4, 6], [10, 12, 14], 0.05, 'right');

                expect(result.z).toBeCloseTo(-4.89898, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
            });
        });
    });

    describe('zTestProportionTwoSamples', () => {
        describe('Validation and Edge Cases', () => {
            it('throws if sample proportions are outside [0, 1]', () => {
                expect(() => zTestProportionTwoSamples(-0.1, 100, 0.5, 100, 0.05, 'two-sided'))
                    .toThrow(/between 0 and 1/);
                expect(() => zTestProportionTwoSamples(0.5, 100, 1.2, 100, 0.05, 'two-sided'))
                    .toThrow(/between 0 and 1/);
            });

            it('throws if sample sizes are less than or equal to 0', () => {
                expect(() => zTestProportionTwoSamples(0.5, 0, 0.5, 100, 0.05, 'two-sided'))
                    .toThrow(/greater than 0/);
                expect(() => zTestProportionTwoSamples(0.5, 100, 0.5, -5, 0.05, 'two-sided'))
                    .toThrow(/greater than 0/);
            });

            it('throws if standard error is zero (e.g. both proportions are 0 or 1)', () => {
                expect(() => zTestProportionTwoSamples(0, 100, 0, 100, 0.05, 'two-sided'))
                    .toThrow(/Standard error is zero/);
                expect(() => zTestProportionTwoSamples(1, 100, 1, 100, 0.05, 'two-sided'))
                    .toThrow(/Standard error is zero/);
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates Pooled Z statistic correctly when proportions are equal (H0 accepted)', () => {
                const result = zTestProportionTwoSamples(0.5, 100, 0.5, 100, 0.05, 'two-sided');

                expect(result.z).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });

            it('calculates Pooled Z statistic correctly for significant difference (H0 rejected)', () => {
                const result = zTestProportionTwoSamples(0.6, 100, 0.4, 100, 0.05, 'two-sided');

                expect(result.z).toBeCloseTo(2.8284, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.Z).toBe('number');
            });

            it('calculates Unpooled Z statistic correctly with non-zero pDifference', () => {
                const result = zTestProportionTwoSamples(0.6, 100, 0.4, 100, 0.05, 'two-sided', 0.2);

                expect(result.z).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates left-sided Z test correctly (H0 rejected)', () => {
                const result = zTestProportionTwoSamples(0.3, 100, 0.5, 100, 0.05, 'left');

                expect(result.z).toBeCloseTo(-2.8868, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates right-sided Z test correctly (H0 accepted)', () => {
                const result = zTestProportionTwoSamples(0.3, 100, 0.5, 100, 0.05, 'right');

                expect(result.z).toBeCloseTo(-2.8868, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
            });
        });
    });

    describe('fTestTwoSamples', () => {
        describe('Validation and Edge Cases', () => {
            it('throws if either sample contains fewer than 2 elements', () => {
                expect(() => fTestTwoSamples([1], [1, 2, 3], 0.05, 'two-sided'))
                    .toThrow(/at least two elements/);
                expect(() => fTestTwoSamples([1, 2, 3], [2], 0.05, 'two-sided'))
                    .toThrow(/at least two elements/);
            });

            it('throws if the variance of the second sample is zero', () => {
                expect(() => fTestTwoSamples([1, 2, 3], [5, 5, 5], 0.05, 'two-sided'))
                    .toThrow(/variance of the second sample is zero/);
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates F statistic correctly when sample variances are equal (H0 accepted)', () => {
                const result = fTestTwoSamples([10, 12, 14], [10, 12, 14], 0.05, 'two-sided');

                expect(result.F).toBeCloseTo(1.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds.lower).toBeDefined();
                expect(result.criticalBounds.upper).toBeDefined();
            });

            it('calculates F statistic correctly for two-sided test with large variance difference (H0 rejected)', () => {
                const result = fTestTwoSamples([10, 20, 30, 40, 50], [10, 11, 12, 13, 14], 0.05, 'two-sided');

                expect(result.F).toBeCloseTo(100.0, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates left-sided F test correctly when sample1 variance is significantly smaller (H0 rejected)', () => {
                const result = fTestTwoSamples([10, 11, 12, 13, 14], [10, 20, 30, 40, 50], 0.05, 'left');

                expect(result.F).toBeCloseTo(0.01, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates right-sided F test correctly when sample1 variance is larger (H0 rejected)', () => {
                const result = fTestTwoSamples([10, 20, 30, 40, 50], [10, 11, 12, 13, 14], 0.05, 'right');

                expect(result.F).toBeCloseTo(100.0, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates right-sided F test correctly when sample1 variance is smaller (H0 accepted)', () => {
                const result = fTestTwoSamples([10, 11, 12, 13, 14], [10, 20, 30, 40, 50], 0.05, 'right');

                expect(result.F).toBeCloseTo(0.01, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
            });
        });
    });

    describe('tTestIndependent', () => {
        describe('Validation and Edge Cases', () => {
            it('throws if getPooledTContext fails due to sample size < 2', () => {
                expect(() => tTestIndependent([1], [1, 2, 3], 0.05, 'two-sided'))
                    .toThrow();
                expect(() => tTestIndependent([1, 2, 3], [2], 0.05, 'two-sided'))
                    .toThrow();
            });

            it('throws if pooled standard deviation is zero (constant samples)', () => {
                expect(() => tTestIndependent([5, 5, 5], [5, 5, 5], 0.05, 'two-sided'))
                    .toThrow('Pooled standard deviation cannot be zero.');
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates t-statistic correctly for equal sample means (H0 accepted)', () => {
                const result = tTestIndependent([10, 12, 14], [10, 12, 14], 0.05, 'two-sided');

                expect(result.t).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(typeof result.T).toBe('number');
            });

            it('calculates t-statistic correctly for significant difference (two-sided, H0 rejected)', () => {
                const result = tTestIndependent([10, 12, 14, 16], [2, 4, 6, 8], 0.05, 'two-sided');

                expect(result.t).toBeCloseTo(4.38178, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates right-sided independent t-test correctly (H0 rejected)', () => {
                const result = tTestIndependent([10, 12, 14, 16], [2, 4, 6, 8], 0.05, 'right');

                expect(result.t).toBeCloseTo(4.38178, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates left-sided independent t-test correctly (H0 accepted)', () => {
                const result = tTestIndependent([10, 12, 14, 16], [2, 4, 6, 8], 0.05, 'left');

                expect(result.t).toBeCloseTo(4.38178, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates negative t-statistic when sample1 mean is smaller', () => {
                const result = tTestIndependent([2, 4, 6, 8], [10, 12, 14, 16], 0.05, 'left');

                expect(result.t).toBeCloseTo(-4.38178, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });
        });
    });

    describe('oneWayAnova', () => {
        describe('Validation and Edge Cases', () => {
            it('throws if fewer than two groups are provided', () => {
                expect(() => oneWayAnova([[10, 12, 14]], 0.05))
                    .toThrow('At least two groups are required for ANOVA.');
            });

            it('throws if any group is empty', () => {
                expect(() => oneWayAnova([[10, 12], []], 0.05))
                    .toThrow('All groups must contain at least one element.');
            });

            it('throws if totalN - k <= 0 (not enough data points for dfWithin)', () => {
                expect(() => oneWayAnova([[10], [20]], 0.05))
                    .toThrow('Not enough data points to calculate within-group variance.');
            });

            it('throws if within-group variance is zero', () => {
                expect(() => oneWayAnova([[5, 5, 5], [10, 10, 10]], 0.05))
                    .toThrow('Within-group variance is zero, cannot calculate the F-statistic.');
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates F statistic and MS values correctly when group means are identical (H0 accepted)', () => {
                const result = oneWayAnova([
                    [10, 12, 14],
                    [10, 12, 14],
                    [10, 12, 14]
                ], 0.05);

                expect(result.msBetween).toBeCloseTo(0.0, 4);
                expect(result.F).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds.upper).toBeDefined();
            });

            it('calculates F statistic and MS values correctly for significantly different group means (H0 rejected)', () => {
                const result = oneWayAnova([
                    [10, 12, 14],
                    [20, 22, 24],
                    [30, 32, 34]
                ], 0.05);

                expect(result.msBetween).toBeCloseTo(300.0, 4);
                expect(result.msWithin).toBeCloseTo(4.0, 4);
                expect(result.F).toBeCloseTo(75.0, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates ANOVA correctly for unbalanced design (unequal group sizes)', () => {
                const result = oneWayAnova([
                    [2, 4, 6],
                    [10, 12, 14, 16]
                ], 0.05);

                expect(result.msWithin).toBeCloseTo(5.6, 4);
                expect(result.F).toBeCloseTo(24.7959, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });
        });
    });

    describe('bartlett', () => {
        describe('Validation and Edge Cases', () => {
            it('throws if fewer than two groups are provided', () => {
                expect(() => bartlett([[10, 12, 14]], 0.05))
                    .toThrow("At least two groups are required for Bartlett's test.");
            });

            it('throws if any group contains fewer than two elements', () => {
                expect(() => bartlett([[10, 12, 14], [5]], 0.05))
                    .toThrow("All groups must contain at least two elements to calculate sample variance.");
            });

            it('throws if any group has zero or negative variance', () => {
                expect(() => bartlett([[5, 5, 5], [10, 12, 14]], 0.05))
                    .toThrow("Variance of group is zero or negative. Bartlett's test requires strictly positive variances.");
            });
        });

        describe('Statistical Logic Validation', () => {
            it('calculates chi2 statistic correctly when group variances are identical (H0 accepted)', () => {
                const result = bartlett([
                    [10, 12, 14],
                    [20, 22, 24],
                    [30, 32, 34]
                ], 0.05);

                expect(result.chi2).toBeCloseTo(0.0, 4);
                expect(result.passed).toBe(true);
                expect(typeof result.passed).toBe('boolean');
                expect(result.criticalBounds.upper).toBeDefined();
            });

            it('calculates chi2 statistic correctly for significantly different group variances (H0 rejected)', () => {
                const result = bartlett([
                    [10, 11, 12],
                    [10, 20, 30]
                ], 0.05);

                expect(result.chi2).toBeCloseTo(5.1820, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });

            it('calculates Bartlett test correctly for unbalanced groups (unequal sizes)', () => {
                const result = bartlett([
                    [2, 4, 6],
                    [10, 20, 30, 40]
                ], 0.05);

                expect(result.chi2).toBeCloseTo(4.11576, 4);
                expect(result.passed).toBe(false);
                expect(typeof result.passed).toBe('boolean');
            });
        });
    });
});