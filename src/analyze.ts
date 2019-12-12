import { StaticSymbol } from "@angular/compiler";
import { PerformCompilationResult } from "@angular/compiler-cli";
import { moduleIsValidFile, referenceIsValidFile } from "./utils";
import { ElementSymbolTemplateVisitor, Context } from "./visitor";

export interface AnalyzeInfo {
    declarationMap: Map<StaticSymbol, StaticSymbol>
    bootstrapMap: Map<StaticSymbol, StaticSymbol>
    entryMap: Map<StaticSymbol, StaticSymbol>
}

export interface ComponentUsageInfo {
    componentUsageMap: Map<StaticSymbol, Set<StaticSymbol>>
}

export function analyzeComponent (result: PerformCompilationResult): AnalyzeInfo {
    const analyzedModules = result.program._analyzedModules
    const tsProgram = result.program.getTsProgram()

    const declarationMap = new Map<StaticSymbol, StaticSymbol>()
    const bootstrapMap = new Map<StaticSymbol, StaticSymbol>()
    const entryMap = new Map<StaticSymbol, StaticSymbol>()

    Array.from(analyzedModules.ngModules.values()).filter(x => moduleIsValidFile(tsProgram, x)).map(x => {
        x.bootstrapComponents.forEach(component => {
            bootstrapMap.set(component.reference, x.type.reference)
        })
        x.entryComponents.forEach(component => {
            entryMap.set(component.componentType, x.type.reference)
        })
        x.declaredDirectives.forEach(directive => {
            declarationMap.set(directive.reference, x.type.reference)
        })
    })

    return {
        declarationMap,
        bootstrapMap,
        entryMap
    }
}

export function analyzeComponentUsage(result: PerformCompilationResult): ComponentUsageInfo {
    const tsProgram = result.program.getTsProgram()

    const aotCompiler = result.program._compiler
    const templateAstCache = aotCompiler._templateAstCache

    const componentUsageMap = new Map<StaticSymbol, Set<StaticSymbol>>()
    Array.from(templateAstCache.entries()).map(([key, value]) => value.template.map(temp => [key, temp] as const)).flat().filter(([key, value]) => value && !key.name.endsWith('_Host') && referenceIsValidFile(tsProgram, key)).map(([key, value]) => {
        const visitor = new ElementSymbolTemplateVisitor()
        const context: Context = { elements: [], directives: [] }

        value.visit(visitor, context)
    
        context.elements.forEach(x => {
            if (x.providers.length && referenceIsValidFile(tsProgram, x.providers[0].token.identifier.reference)) {
                const set = componentUsageMap.get(x.providers[0].token.identifier.reference) || new Set<StaticSymbol>()
                set.add(key)
                componentUsageMap.set(x.providers[0].token.identifier.reference, set) 
            }
        })
    
        context.directives.forEach(x => {
            if (referenceIsValidFile(tsProgram, x.directive.type.reference)) {
                const set = componentUsageMap.get(x.directive.type.reference) || new Set<StaticSymbol>()
                set.add(key)
                componentUsageMap.set(x.directive.type.reference, set)
            }
        })
    })

    return {
        componentUsageMap
    }
}