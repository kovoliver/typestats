export abstract class Cache {
    protected _cache: Map<string, unknown> = new Map();

    protected containsCache(key:string):boolean {
        return this._cache.has(key);
    }

    protected getCached<T>(key: string, computeFn: () => T): T {
        if (this.containsCache(key)) {
            return this._cache.get(key) as T;
        }

        const result = computeFn();
        this._cache.set(key, result);
        return result;
    }

    protected clearCache(): void {
        this._cache.clear();
    }
}