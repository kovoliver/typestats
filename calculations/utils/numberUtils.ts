export function round(value: number, decimals = -1): number {
    if (decimals === -1) return value;

    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

export function orderAsc(values: number[]): number[] {
    return values.sort((a, b) => a - b);
}

export function orderDesc(values: number[]): number[] {
    return values.sort((a, b) => b - a);
}

export function isInteger(value: number): boolean {
    return round(value, 0) === value;
}

export function range(from: number, to: number) {
    return Array.from(
        { length: to - from + 1 },
        (_, i) => from + i
    );
}