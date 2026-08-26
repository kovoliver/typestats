import {
  chiSquare,
  cramerV,
  totalSSD,
  betweenSSD,
  withinSSD,
  etaSquared,
  covariance,
  correlation,
  rankCorrelation,
  calcCombinationTable
} from '../../core/statistics/bivariate';

console.log('=== 1. Nominal Association (Contingency Table) ===');

// Contingency table: Rows = Education Level, Columns = Preferred Media Channel
const contingencyTable: number[][] = [
  [30, 20, 10], // High School
  [20, 40, 20], // Bachelor's
  [10, 20, 50]  // Master's / PhD
];

console.log('Extended Table (with totals):', calcCombinationTable(contingencyTable));
console.log('Chi-Square (χ²):', chiSquare(contingencyTable, 4));
console.log("Cramér's V:", cramerV(contingencyTable, 4));


console.log('\n=== 2. Mixed / Group Variance Analysis (ANOVA-like SSD) ===');

// Groups: Exam scores grouped by study methods (3 groups)
const groupedData: number[][] = [
  [55, 60, 65, 70], // Group A: Self-study
  [65, 70, 75, 80], // Group B: Group study
  [80, 85, 90, 95]  // Group C: Tutoring
];

console.log('Total Sum of Squared Deviations (SST):', totalSSD(groupedData, 2));
console.log('Between-Group Sum of Squares (SSB):', betweenSSD(groupedData, 2));
console.log('Within-Group Sum of Squares (SSW):', withinSSD(groupedData, 2));
console.log('Eta Squared (η² / Effect Size):', etaSquared(groupedData, 4));


console.log('\n=== 3. Numerical Correlation & Rank Association ===');

// Two continuous variables: Study Hours vs. Test Scores
const studyHours: number[] = [2, 4, 6, 8, 10, 12];
const testScores: number[] = [50, 58, 68, 74, 88, 95];

console.log('Population Covariance:', covariance(studyHours, testScores, false, 2));
console.log('Sample Covariance:', covariance(studyHours, testScores, true, 2));
console.log("Pearson's Correlation Coefficient (r):", correlation(studyHours, testScores, true, 4));

// Rank correlation example (Spearman)
const ordinalRankA: number[] = [1, 2, 3, 4, 5, 6];
const ordinalRankB: number[] = [2, 1, 4, 3, 6, 5];

console.log("Spearman's Rank Correlation (rho):", rankCorrelation(ordinalRankA, ordinalRankB, true, 4));