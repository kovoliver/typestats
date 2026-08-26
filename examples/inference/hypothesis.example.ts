import {
  zTest,
  tTest,
  zTestProportion,
  chi2Test,
  chi2FitTest,
  chiSquaredIndependenceTest,
  tTestTwoSamples,
  fTestTwoSamples,
  oneWayAnova,
  bartlett
} from '../../core/inference/hypothesis';

console.log('=== 1. One-Sample Hypothesis Tests ===');

const sample: number[] = [102, 105, 98, 108, 101, 104, 99];
const alpha = 0.05;

// One-sample Z-test (known population std = 5, H0: mu = 100)
console.log('Z-Test (known sigma):', zTest(sample, 5, alpha, 100, 'two-sided'));

// One-sample Student t-test (unknown std, H0: mu = 100)
console.log('t-Test (unknown sigma):', tTest(sample, alpha, 100, 'right'));

// One-sample Proportion Z-test (H0: p = 0.50, observed = 0.60, n = 100)
console.log('Proportion Z-Test:', zTestProportion(0.50, 0.60, 100, alpha, 'right'));

// One-sample Chi-Square Variance Test (H0: sigma^2 = 10)
console.log('Chi2 Variance Test:', chi2Test(sample, 10, alpha, 'two-sided'));


console.log('\n=== 2. Goodness-of-Fit & Independence Tests ===');

// Chi-Square Goodness-of-Fit (Dice roll experiment)
const observedFreq = [18, 22, 15, 25, 12, 28];
const expectedFreq = [20, 20, 20, 20, 20, 20];
console.log('Chi2 Goodness-of-Fit:', chi2FitTest(observedFreq, expectedFreq, alpha));

// Chi-Square Test of Independence (2x2 Contingency Table)
const contingencyTable = [
  [40, 60],
  [20, 80]
];
console.log('Chi2 Independence Test:', chiSquaredIndependenceTest(contingencyTable, alpha));


console.log('\n=== 3. Two-Sample & Multi-Group Tests ===');

const groupA = [12, 15, 14, 11, 13];
const groupB = [25, 22, 28, 24, 26];
const groupC = [18, 20, 19, 21, 17];

// Two-sample Welch t-test (unequal variances assumed)
console.log('Welch t-Test (Two Samples):', tTestTwoSamples(groupA, groupB, alpha, 'two-sided', false));

// Two-sample F-test for equal variances
console.log('F-Test for Variance Equality:', fTestTwoSamples(groupA, groupB, alpha, 'two-sided'));

// One-Way ANOVA across 3 groups
console.log('One-Way ANOVA:', oneWayAnova([groupA, groupB, groupC], alpha));

// Bartlett\'s Test for Homogeneity of Variances
console.log("Bartlett's Test:", bartlett([groupA, groupB, groupC], alpha));