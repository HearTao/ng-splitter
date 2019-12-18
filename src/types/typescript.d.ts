import { SourceFile, ResolvedModuleFull, UserPreferences } from "typescript";

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

export interface MultiMap<T> extends Map<T[]> {
    /**
     * Adds the value to an array of values associated with the key, and returns the array.
     * Creates the array if it does not already exist.
     */
    add(key: string, value: T): T[];
    /**
     * Removes a value from an array of values associated with the key.
     * Does not preserve the order of those values.
     * Does nothing if `key` is not in `map`, or `value` is not in `map[key]`.
     */
    remove(key: string, value: T): void;
}

export type RedirectTargetsMap = ReadonlyMap<readonly string[]>;

export interface GetEffectiveTypeRootsHost {
    directoryExists?(directoryName: string): boolean;
    getCurrentDirectory?(): string;
}

export interface ModuleSpecifierResolutionHost extends GetEffectiveTypeRootsHost {
    useCaseSensitiveFileNames?(): boolean;
    fileExists?(path: string): boolean;
    readFile?(path: string): string | undefined;
    getProbableSymlinks?(files: readonly SourceFile[]): ReadonlyMap<string>;
    getGlobalTypingsCacheLocation?(): string | undefined;
}

declare module "typescript" {
    interface SourceFile {
        resolvedModules?: Map<ResolvedModuleFull | undefined>
    }

    interface ModuleSpecifier{
        getNodeModulesPackageName (
            compilerOptions: CompilerOptions,
            importingSourceFileName: string,
            nodeModulesFileName: string,
            host: ModuleSpecifierResolutionHost,
            files: readonly SourceFile[],
            redirectTargetsMap: RedirectTargetsMap,
        ): string | undefined

        getModuleSpecifier(
            compilerOptions: CompilerOptions,
            importingSourceFile: SourceFile,
            importingSourceFileName: string,
            toFileName: string,
            host: ModuleSpecifierResolutionHost,
            files: readonly SourceFile[],
            preferences: UserPreferences,
            redirectTargetsMap: RedirectTargetsMap,
        ): string
    }

    const moduleSpecifiers: ModuleSpecifier

    interface Program {
        redirectTargetsMap: MultiMap<string>;
    }
}
