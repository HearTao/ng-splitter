import { CompileNgModuleMetadata, StaticSymbol, TemplateAst, ElementAst } from "@angular/compiler";
import { Program } from "typescript";

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
