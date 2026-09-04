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
    linear: 'linear',
    exponential: 'exponential',
    polynomial: 'polynomial',
    logarithmic: 'logarithmic',
} as const;

export type TrendType = (typeof TrendType)[keyof typeof TrendType];

export const RegressionType = {
    linear: 'linear',
    exponential: 'exponential',
    power: 'power',
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
    mode:'mode',
    mediam:'median',
    mean:'mean',
    none:'none'
} as const;

export type ImputeType = (typeof ImputeType)[keyof typeof ImputeType];

export const OutlierStrategy = {
    delete:'delete',
    impute:'impute'
} as const;

export type OutlierStrategy = (typeof OutlierStrategy)[keyof typeof OutlierStrategy];

export type Boundaries = {
    min?:number,
    max?:number,
};

export const ScaleType = {
    normalize:'normalize',
    standardize:'standardize'
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

export type RegressionModel = {
    b0:number;
    b1:number;
    rsd:number;
}

export type TrendModel = {
    a:number;
    b:number;
    mse:number;
}

export type ColumnInfo = {
    columnName: string,
    type:ColType,
    validCount: number,
    missingCount: number,
    missingPercent: number|string
}