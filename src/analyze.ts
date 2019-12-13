import { StaticSymbol } from "@angular/compiler";
import { PerformCompilationResult } from "@angular/compiler-cli";
import { moduleIsValidFile, referenceIsValidFile } from "./utils";
import { ElementSymbolTemplateVisitor, Context } from "./visitor";

export interface ComponentAnalyzeInfo {
    declarationMap: Map<StaticSymbol, StaticSymbol>
    bootstrapMap: Map<StaticSymbol, StaticSymbol>
    entryMap: Map<StaticSymbol, StaticSymbol>
}

export interface ComponentUsageInfo {
    componentUsageMap: Map<StaticSymbol, Set<StaticSymbol>>
}

export interface ServicesUsageInfo {
    servicesUsageMap: Map<StaticSymbol, Set<StaticSymbol>>
}

export interface ServiceAnalyzeInfo {
    declarationMap: Map<StaticSymbol, StaticSymbol>
}

export function analyzeComponent (result: PerformCompilationResult): ComponentAnalyzeInfo {
    const analyzedModules = result.program._analyzedModules
    const tsProgram = result.program.getTsProgram()

    const declarationMap = new Map<StaticSymbol, StaticSymbol>()
    const bootstrapMap = new Map<StaticSymbol, StaticSymbol>()
    const entryMap = new Map<StaticSymbol, StaticSymbol>()

    Array.from(analyzedModules.ngModules.values()).filter(x => moduleIsValidFile(tsProgram, x)).forEach(x => {
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

export function analyzeServices (result: PerformCompilationResult): ServiceAnalyzeInfo {
    const analyzedModules = result.program._analyzedModules
    const tsProgram = result.program.getTsProgram()

    const declarationMap = new Map<StaticSymbol, StaticSymbol>()
    Array.from(analyzedModules.ngModules.values()).filter(x => moduleIsValidFile(tsProgram, x)).forEach(x => {
        x.providers.filter(provider => referenceIsValidFile(tsProgram, provider.token.identifier.reference)).forEach(provider => {
            declarationMap.set(provider.useClass.reference, x.type.reference)
        })
    })

    return {
        declarationMap
    }
}

export function analyzeServicesUsage(result: PerformCompilationResult): ServicesUsageInfo {
    const analyzedModules = result.program._analyzedModules
    const aotCompiler = result.program._compiler
    const tsProgram = result.program.getTsProgram()
    const reflector = aotCompiler.reflector
    
    const servicesUsageMap = new Map<StaticSymbol, Set<StaticSymbol>>() 
    Array.from(analyzedModules.ngModules.values()).filter(x => moduleIsValidFile(tsProgram, x)).forEach(x => {
        x.declaredDirectives.forEach(x => {
            const parameters: StaticSymbol[][] = reflector.parameters(x.reference)

            parameters.flat().filter(parameter => {
                if (parameter instanceof StaticSymbol) {
                    return referenceIsValidFile(tsProgram, parameter)
                }
                if ('ngMetadataName' in parameter) {
                    if ((parameter as any).ngMetadataName === 'Inject') {
                        return referenceIsValidFile(tsProgram, (parameter as any).token)
                    }
                }
                return false
            }).forEach(parameter => {
                const set = servicesUsageMap.get(parameter) || new Set<StaticSymbol>()
                set.add(x.reference)
                servicesUsageMap.set(parameter, set)
            })
        })

        x.providers.forEach(provider => {
            const set = servicesUsageMap.get(provider.token.identifier.reference) || new Set<StaticSymbol>()
            set.add(x.type.reference)
            servicesUsageMap.set(provider.token.identifier.reference, set)

            const parameters: StaticSymbol[][] = reflector.parameters(provider.token.identifier.reference)

            parameters.flat().filter(parameter => {
                if (parameter instanceof StaticSymbol) {
                    return referenceIsValidFile(tsProgram, parameter)
                }
                if ('ngMetadataName' in parameter) {
                    if ((parameter as any).ngMetadataName === 'Inject') {
                        return referenceIsValidFile(tsProgram, (parameter as any).token)
                    }
                }
                return false
            }).forEach(parameter => {
                const set = servicesUsageMap.get(parameter) || new Set<StaticSymbol>()
                set.add(provider.token.identifier.reference)
                servicesUsageMap.set(parameter, set)
            })
        })
    })

    return {
        servicesUsageMap
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