import { CompilerHost, moduleSpecifiers, Program, SourceFile } from 'typescript'
import { identity, toLowerCase, referenceIsValidFile } from '../utils'
import { GetCanonicalFileName, Info } from './types'
import { getDirectoryPath } from './path'
import { StaticSymbol } from '@angular/compiler'

export function createGetCanonicalFileName(
  useCaseSensitiveFileNames: boolean
): GetCanonicalFileName {
  return useCaseSensitiveFileNames ? identity : toLowerCase
}

export function getInfo(
  host: CompilerHost,
  importingSourceFileName: string
): Info {
  const getCanonicalFileName = createGetCanonicalFileName(
    host.useCaseSensitiveFileNames ? host.useCaseSensitiveFileNames() : true
  )
  const sourceDirectory = getDirectoryPath(importingSourceFileName)
  return { getCanonicalFileName, sourceDirectory }
}

export enum SourceType {
  staticSymbol,
  sourceFile
}

interface StaticSymbolSourceType {
  type: SourceType.staticSymbol
  symbol: StaticSymbol
}

interface SourceFileSourceType {
  type: SourceType.sourceFile
  symbol: StaticSymbol
  file: SourceFile
}

export type StaticSymbolOrSourceFileSourceType =
  | StaticSymbolSourceType
  | SourceFileSourceType

export function sourceTypeFromStaticSymbol(
  symbol: StaticSymbol
): StaticSymbolSourceType {
  return {
    type: SourceType.staticSymbol,
    symbol
  }
}

export function sourceTypeFromSourceFile(
  symbol: StaticSymbol,
  file: SourceFile
): SourceFileSourceType {
  return {
    type: SourceType.sourceFile,
    symbol,
    file
  }
}

export function resolveStaticSymbolOrSourceFile(
  tsProgram: Program,
  sourceType: StaticSymbolOrSourceFileSourceType
): [StaticSymbol, SourceFile] {
  if (sourceType.type === SourceType.sourceFile) {
    return [sourceType.symbol, sourceType.file]
  }
  return [
    sourceType.symbol,
    tsProgram.getSourceFile(sourceType.symbol.filePath)!
  ]
}

export function generateImportSpecifier(
  tsProgram: Program,
  host: CompilerHost,
  importSourceType: StaticSymbolOrSourceFileSourceType,
  toFileSourceType: StaticSymbolOrSourceFileSourceType
) {
  const [importPath, importSourceFile] = resolveStaticSymbolOrSourceFile(
    tsProgram,
    importSourceType
  )
  const [toFilePath, toFileSourceFile] = resolveStaticSymbolOrSourceFile(
    tsProgram,
    toFileSourceType
  )
  const info = getInfo(host, importPath.filePath)
  if (referenceIsValidFile(tsProgram, importPath, importSourceFile)) {
    return moduleSpecifiers.getModuleSpecifier(
      tsProgram.getCompilerOptions(),
      toFileSourceFile,
      toFileSourceFile.fileName,
      importPath.filePath,
      host,
      tsProgram.getSourceFiles(),
      {
        importModuleSpecifierPreference: 'non-relative',
        importModuleSpecifierEnding: 'minimal'
      },
      tsProgram.redirectTargetsMap
    )
  } else {
    return (
      moduleSpecifiers.getNodeModulesPackageName(
        tsProgram.getCompilerOptions(),
        info.getCanonicalFileName(importPath.filePath),
        info.getCanonicalFileName(importPath.filePath),
        host,
        tsProgram.getSourceFiles(),
        tsProgram.redirectTargetsMap
      ) || importPath.filePath
    )
  }
}
