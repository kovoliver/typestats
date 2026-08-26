# TypeStats

A comprehensive, robust TypeScript-based statistical and mathematical library designed for data analysis, research, and modeling tasks. The package covers essential tools for descriptive statistics, hypothesis testing, probability distributions, and matrix operations.

## 📂 Project Structure & Implemented Features

The project is organized into the following core modules:

### 1. Descriptive Statistics (`calculations/statistics/`)
- **Univariate Analysis (`univariate.ts`)**: Measures of central tendency and dispersion (mean, mode, median, quartiles, variance, standard deviation), along with shape metrics like skewness and kurtosis (based on central moments). Contains tools for frequency series and Lorenz curve data.
- **Bivariate Analysis (`bivariate.ts`)**: Relationship and correlation testing, including covariance, Pearson correlation, rank correlation, Cramér's V, and ANOVA for independence.
- **Frequency Tables (`FrequencyTable.ts`)**: Generation of frequency distributions, grouping data, and calculating base, chain, and intensity ratios.

### 2. Statistical Inference & Modeling (`calculations/inference/`)
- **Hypothesis Testing (`hypothesis.ts`)**: Extensive suite of tests including:
  - One-sample and two-sample Z-tests and t-tests (for population means and proportions).
  - Asymptotic Z-tests.
  - F-tests for population variances.
  - Chi-square tests (goodness-of-fit, independence, and homogeneity).
  - Analysis of Variance (ANOVA) for multiple population means and Bartlett's test for variances.
  - Includes underlying calculations for standard errors, critical regions, acceptance regions, and significance levels based on the Central Limit Theorem.
- **Estimations (`estimations.ts`)**: Calculations for confidence intervals, Mean Squared Error (MSE), and point estimations for mean, proportion, and variance (covering simple random sampling and other sampling designs).
- **Regression (`Regression.ts`)**: Linear regression computations and parameter estimations.
- **Trend Analysis (`Trend.ts`)**: Time series modeling and trend line fitting.

### 3. Probability Distributions (`calculations/distributions/`)
Core distribution functions and their inverses required for determining p-values, critical values, and confidence intervals:
- **Normal Distribution (`normalDist.ts`)**: Z-distribution calculations and standard normal inverse values.
- **Student's t-Distribution (`studentDist.ts`)**: t-values and inverse distribution features.
- **Chi-Square Distribution (`chiSquareDist.ts`)**: Chi-square probabilities and inverse functions.
- **F-Distribution (`fDist.ts`)**: F-distribution probabilities and inverse limits.

### 4. Mathematical Operations (`calculations/math/`)
- **Matrix (`Matrix.ts`)**: Multi-dimensional data structures and matrix operations (multiplication, transposition, determinants, inverses) that serve as the foundational math for multivariate regression and ANOVA calculations.

### 5. Utility Functions (`calculations/utils/`)
- **`numberUtils.ts`**: Helper functions for precision handling, number formatting, and rounding.
- **`testAndEstimationUtils.ts`**: Internal utility functions that support the execution of hypothesis tests and estimations (e.g., iterative calculations for degrees of freedom).

### 6. Type Definitions
- **`types.ts`**: TypeScript interfaces and custom type definitions. These ensure strict type checking, robust error handling, and comprehensive IntelliSense support throughout the library.

## 📜 License
Please refer to the `LICENSE` file for usage and distribution terms.