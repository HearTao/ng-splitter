import { TemplateAst, CompilePipeSummary } from '@angular/compiler'

export interface TemplateAstCacheValue {
  template: TemplateAst[]
  pipes: CompilePipeSummary[]
}
