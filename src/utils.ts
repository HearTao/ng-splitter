import { CompileNgModuleMetadata, StaticSymbol, TemplateAst, ElementAst } from "@angular/compiler";
import { Program } from "typescript";

export function moduleIsValidFile (program: Program, metaData: CompileNgModuleMetadata) {
    const reference = metaData.type.reference as StaticSymbol
    const sourceFile = program.getSourceFile(reference.filePath)
    return !sourceFile.isDeclarationFile && !program.isSourceFileFromExternalLibrary(sourceFile)
}

export function isElementAst (node: TemplateAst): node is ElementAst {
    return node instanceof ElementAst
}

