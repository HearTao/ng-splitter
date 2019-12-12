import { Program } from '@angular/compiler-cli/src/transformers/api'
import { AotCompiler, NgAnalyzedModules, StaticSymbol, StaticSymbolResolver, StaticReflector } from '@angular/compiler'
import { TemplateAstCacheValue } from './common'


declare module "@angular/compiler-cli/src/transformers/api" {
    interface Program {
        _analyzedModules: NgAnalyzedModules
        _compiler: AotCompiler
    }

    interface AotCompiler {
        _templateAstCache: Map<StaticSymbol, TemplateAstCacheValue>
        _symbolResolver: StaticSymbolResolver
        reflector: StaticReflector
    }
}
