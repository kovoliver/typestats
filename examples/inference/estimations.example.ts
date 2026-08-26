import {
  meanEstimationIIDwithoutSTD,
  meanEstimationSRSwithoutSTD,
  proportionEstimationIID,
  varianceEstimationIID,
  estimateStratifiedMean,
  getMeanDiffPooledCI,
  getProportionDiff,
  getPairedMeanDiff
} from '../../core/inference/estimations';
import type { Stratum } from '../../core/types';

console.log('=== 1. Single-Sample Estimation ===');

// Sample dataset and significance level (alpha = 0.05 for 95% CI)
const sampleData: number[] = [102, 108, 98, 115, 105, 110, 99, 104];
const alpha = 0.05;

// Mean Confidence Interval (IID vs. Finite Population SRS)
console.log('IID Mean CI (Unknown Std):', meanEstimationIIDwithoutSTD(sampleData, alpha));
console.log('SRS Mean CI (N = 500 Population):', meanEstimationSRSwithoutSTD(sampleData, alpha, 500));

// Proportion Estimation (e.g., 45% sample proportion in 200 items)
console.log('Proportion CI (p = 0.45, n = 200):', proportionEstimationIID(0.45, alpha, 200));

// Variance Estimation (Chi-Square method)
console.log('Variance CI:', varianceEstimationIID(sampleData, alpha));


console.log('\n=== 2. Stratified Sampling Estimation ===');

// Define strata data
const strata: Stratum[] = [
  { label:'label1', stratumSize: 1000, samples: [12, 15, 14, 11, 13] },
  { label:'label2', stratumSize: 500,  samples: [25, 22, 28, 24] },
  { label:'label3', stratumSize: 200,  samples: [40, 45, 42] }
];

console.log('Estimated Stratified Mean:', estimateStratifiedMean(strata));


console.log('\n=== 3. Two-Sample & Paired Difference Intervals ===');

const groupA: number[] = [82, 85, 90, 78, 88];
const groupB: number[] = [75, 79, 81, 72, 77];

// Difference between independent means (Pooled t-distribution)
console.log('Independent Means Difference CI:', getMeanDiffPooledCI(groupA, groupB, alpha));

// Difference between two proportions (k1/n1 vs. k2/n2)
// Example: 40 successes in 100 vs. 25 successes in 100
console.log('Proportion Difference CI:', getProportionDiff(40, 100, 25, 100, alpha));

// Paired samples (Before vs. After measurements)
const beforeTreatment: number[] = [140, 135, 150, 145, 138];
const afterTreatment:  number[] = [132, 130, 142, 138, 135];

console.log('Paired Mean Difference CI:', getPairedMeanDiff(beforeTreatment, afterTreatment, alpha));