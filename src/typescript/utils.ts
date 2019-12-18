/// <reference path="../types/typescript.d.ts"/>
import { SourceFile, ResolvedModuleFull } from 'typescript'

export function getResolvedModule(
  sourceFile: SourceFile | undefined,
  moduleNameText: string
): ResolvedModuleFull | undefined {
  return (
    sourceFile &&
    sourceFile.resolvedModules &&
    sourceFile.resolvedModules.get(moduleNameText)
  )
}
