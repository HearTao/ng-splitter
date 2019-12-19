import { TemplateAst, CompilePipeSummary, StaticSymbol } from '@angular/compiler'
import { SourceFile } from 'typescript';

export interface TemplateAstCacheValue {
  template: TemplateAst[]
  pipes: CompilePipeSummary[]
}

export interface RewriteInfo {
  component: StaticSymbol
  symbol: StaticSymbol
  file: SourceFile
}


export enum SourceType {
  staticSymbol,
  sourceFile
}

export interface StaticSymbolSourceType {
  type: SourceType.staticSymbol
  symbol: StaticSymbol
}

export interface SourceFileSourceType {
  type: SourceType.sourceFile
  symbol: StaticSymbol
  file: SourceFile
}

export type StaticSymbolOrSourceFileSourceType =
  | StaticSymbolSourceType
  | SourceFileSourceType