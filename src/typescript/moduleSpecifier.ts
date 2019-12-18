import { CompilerHost, moduleSpecifiers, Program, createSourceFile, ScriptTarget } from "typescript";
import { identity, toLowerCase, referenceIsValidFile } from "../utils";
import { GetCanonicalFileName, Info } from "./types";
import { getDirectoryPath } from "./path";
import { StaticSymbol } from "@angular/compiler";

export function createGetCanonicalFileName(useCaseSensitiveFileNames: boolean): GetCanonicalFileName {
    return useCaseSensitiveFileNames ? identity : toLowerCase;
}

export function getInfo(host: CompilerHost, importingSourceFileName: string): Info {
    const getCanonicalFileName = createGetCanonicalFileName(host.useCaseSensitiveFileNames ? host.useCaseSensitiveFileNames() : true);
    const sourceDirectory = getDirectoryPath(importingSourceFileName);
    return { getCanonicalFileName, sourceDirectory };
}

export function generateImportSpecifier(tsProgram: Program, host: CompilerHost, moduleFile: string, file: StaticSymbol) {
    const info = getInfo(host, file.filePath)
    if (referenceIsValidFile(tsProgram, file)) {
        const sourceFile = createSourceFile(file.filePath, '', ScriptTarget.Latest)
        return moduleSpecifiers.getModuleSpecifier(tsProgram.getCompilerOptions(), sourceFile, file.filePath, moduleFile, host, tsProgram.getSourceFiles(), {
            importModuleSpecifierPreference: 'non-relative',
            importModuleSpecifierEnding: 'minimal'
        }, tsProgram.redirectTargetsMap);
    } else {
        return moduleSpecifiers.getNodeModulesPackageName(tsProgram.getCompilerOptions(), info.getCanonicalFileName(moduleFile), info.getCanonicalFileName(info.sourceDirectory), host, tsProgram.getSourceFiles(), tsProgram.redirectTargetsMap) || info.sourceDirectory
    }
}