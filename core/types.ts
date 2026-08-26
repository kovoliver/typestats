export const PercentMode = {
    linear: 'linear',
    lower: 'lower',
    higher: 'higher',
    nearest: 'nearest',
    midpoint: 'midpoint',
    interpolated: 'interpolated'
} as const;

export type PercentMode = typeof PercentMode[keyof typeof PercentMode];

export const TrendType = {
    Linear: 'LINEAR',
    Exponential: 'EXPONENTIAL',
    Polynomial: 'POLYNOMIAL',
    Logarithmic: 'LOGARITHMIC',
} as const;

export type TrendType = (typeof TrendType)[keyof typeof TrendType];

export const RegressionType = {
    Linear: 'LINEAR',
    Exponential: 'EXPONENTIAL',
    Polynomial: 'POWER',
} as const;

export type RegressionType = (typeof RegressionType)[keyof typeof RegressionType];

export interface Stratum {
    label: string;
    samples: number[];
    stratumSize: number;
}

export type ConfidenceInterval = {
    lower: number;
    upper: number;
}