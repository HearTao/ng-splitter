import { CompileNgModuleMetadata, StaticSymbol, TemplateAst, ElementAst } from "@angular/compiler";
import { Program, Node } from "typescript";

export function moduleIsValidFile(program: Program, metaData: CompileNgModuleMetadata) {
    const reference = metaData.type.reference as StaticSymbol
    return referenceIsValidFile(program, reference)
}

export function referenceIsValidFile(program: Program, reference: StaticSymbol) {
    const sourceFile = program.getSourceFile(reference.filePath)
    return !sourceFile.isDeclarationFile && !program.isSourceFileFromExternalLibrary(sourceFile)
}

export function isElementAst(node: TemplateAst): node is ElementAst {
    return node instanceof ElementAst
}

export function isDef<T>(v: T | undefined | null): v is T {
    return v !== undefined && v !== null
}

export function appendToSetMap<K, T>(map: Map<K, Set<T>>, key: K, value: T) {
    const set = map.get(key) || new Set<T>()
    set.add(value)
    map.set(key, set)
    return map
}

export function toArray<T>(iter: Iterable<T>): T[] {
    if (!iter) return []
    return Array.from(iter)
}

export function findOrCreate<T>(items: T[], cb: (v: T) => boolean, create: () => T) {
    const item = items.find(cb)
    if (item) {
        return item
    }
    const newItem = create()
    items.push(newItem)
    return newItem
}

export function findAncestor(node: Node, cb: (v: Node) => boolean) {
    while (node) {
        if (cb(node)) {
            return node
        }
        node = node.parent
    }
    return undefined
}

export function startsWith(str: string, prefix: string): boolean {
    return str.lastIndexOf(prefix, 0) === 0;
}

/** Like `forEach`, but suitable for use with numbers and strings (which may be falsy). */
export function firstDefined<T, U>(array: readonly T[] | undefined, callback: (element: T, index: number) => U | undefined): U | undefined {
    if (array === undefined) {
        return undefined;
    }

    for (let i = 0; i < array.length; i++) {
        const result = callback(array[i], i);
        if (result !== undefined) {
            return result;
        }
    }
    return undefined;
}

export function endsWith(str: string, suffix: string): boolean {
    const expectedPos = str.length - suffix.length;
    return expectedPos >= 0 && str.indexOf(suffix, expectedPos) === expectedPos;
}

export function some<T>(array: readonly T[] | undefined): array is readonly T[];
export function some<T>(array: readonly T[] | undefined, predicate: (value: T) => boolean): boolean;
export function some<T>(array: readonly T[] | undefined, predicate?: (value: T) => boolean): boolean {
    if (array) {
        if (predicate) {
            for (const v of array) {
                if (predicate(v)) {
                    return true;
                }
            }
        }
        else {
            return array.length > 0;
        }
    }
    return false;
}

export function equateStringsCaseInsensitive(a: string, b: string) {
    return a === b
        || a !== undefined
        && b !== undefined
        && a.toUpperCase() === b.toUpperCase();
}

export function equateValues<T>(a: T, b: T) {
    return a === b;
}

export function equateStringsCaseSensitive(a: string, b: string) {
    return equateValues(a, b);
}

/** Returns its argument. */
export function identity<T>(x: T) { return x; }

/**
     * Returns the last element of an array if non-empty, `undefined` otherwise.
     */
export function lastOrUndefined<T>(array: readonly T[]): T | undefined {
    return array.length === 0 ? undefined : array[array.length - 1];
}

export function removeSuffix(str: string, suffix: string): string {
    return endsWith(str, suffix) ? str.slice(0, str.length - suffix.length) : str;
}

/** Works like Array.prototype.find, returning `undefined` if no element satisfying the predicate is found. */
export function find<T, U extends T>(array: readonly T[], predicate: (element: T, index: number) => element is U): U | undefined;
export function find<T>(array: readonly T[], predicate: (element: T, index: number) => boolean): T | undefined;
export function find<T>(array: readonly T[], predicate: (element: T, index: number) => boolean): T | undefined {
    for (let i = 0; i < array.length; i++) {
        const value = array[i];
        if (predicate(value, i)) {
            return value;
        }
    }
    return undefined;
}

/** Returns lower case string */
export function toLowerCase(x: string) { return x.toLowerCase(); }
