import { SourceFile, ResolvedModuleFull } from "typescript";

/** ES6 Map interface, only read methods included. */
export interface ReadonlyMap<T> {
    get(key: string): T | undefined;
    has(key: string): boolean;
    forEach(action: (value: T, key: string) => void): void;
    readonly size: number;
    keys(): Iterator<string>;
    values(): Iterator<T>;
    entries(): Iterator<[string, T]>;
}

/** ES6 Map interface. */
export interface Map<T> extends ReadonlyMap<T> {
    set(key: string, value: T): this;
    delete(key: string): boolean;
    clear(): void;
}

declare module "typescript" {
    interface SourceFile {
        resolvedModules?: Map<ResolvedModuleFull | undefined>
    }
}

