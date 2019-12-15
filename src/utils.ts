import { CompileNgModuleMetadata, StaticSymbol, TemplateAst, ElementAst } from "@angular/compiler";
import { Program, Node } from "typescript";

export function moduleIsValidFile (program: Program, metaData: CompileNgModuleMetadata) {
    const reference = metaData.type.reference as StaticSymbol
    return referenceIsValidFile(program, reference)
}

export function referenceIsValidFile (program: Program, reference: StaticSymbol) {
    const sourceFile = program.getSourceFile(reference.filePath)
    return !sourceFile.isDeclarationFile && !program.isSourceFileFromExternalLibrary(sourceFile)
}

export function isElementAst (node: TemplateAst): node is ElementAst {
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

export function find<T>(items: T[], cb: (v: T) => boolean): T {
    return items && items.find(cb)
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