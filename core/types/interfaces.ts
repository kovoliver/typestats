import { DbEngineType } from "./types.js";

export interface DbConnection {
    engine: DbEngineType;
    nativePool: any;
    execQuery: (sql: string, params?: any[]) => Promise<Record<string, any>[]>;
    close: () => Promise<void>;
}