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

export const ImputeType = {
    mode:'MODE',
    mediam:'MEDIAN',
    mean:'MEAN',
    none:'NONE'
} as const;

export type ImputeType = (typeof ImputeType)[keyof typeof ImputeType];

export const OutlierStrategy = {
    delete:'DELETE',
    impute:'IMPUTE'
} as const;

export type OutlierStrategy = (typeof OutlierStrategy)[keyof typeof OutlierStrategy];

export type Boundaries = {
    min?:number,
    max?:number,
};

export const ScaleType = {
    normalize:'NORMALIZE',
    standardize:'STANDARDIZE'
} as const;

export type ScaleType = (typeof ScaleType)[keyof typeof ScaleType];

export const ColType = {
    number:'number',
    bool:'bool',
    string:'string'
} as const;

export type ColType = (typeof ColType)[keyof typeof ColType];

export type ColInfo = {
    label:string;
    type?:ColType;
}

export interface CleanResult<T> {
    cleaned: T;
    indices: number[];
}