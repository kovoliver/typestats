export function isEmpty<T>(value:T):boolean {
    if(typeof value === 'number') {
        return isNaN(value);
    }

    return value === null || value === "" || value === undefined;
}

export function defaultValue<T>(value:T, defaultVal:T):T {
    return !isEmpty(value) ? value : defaultVal;
}

export function getNonEmptyValues(values:number[]|number[][]) {
    return values.flat().filter((val)=>!isEmpty(val));
}