import { StaticSymbol, ProviderAstType } from "@angular/compiler";
import { PerformCompilationResult } from "@angular/compiler-cli";
import { moduleIsValidFile, referenceIsValidFile, appendToSetMap } from "./utils";
import { ElementSymbolTemplateVisitor, TemplateContext } from "./visitor";

export interface ComponentAnalyzeInfo {
    declarationMap: Map<StaticSymbol, Set<StaticSymbol>>
    bootstrapMap: Map<StaticSymbol, Set<StaticSymbol>>
    entryMap: Map<StaticSymbol, Set<StaticSymbol>>
    pipeDeclarationMap: Map<StaticSymbol, Set<StaticSymbol>>
}

export interface ComponentUsageInfo {
    componentUsageMap: Map<StaticSymbol, Set<StaticSymbol>>
    pipeUsageMap: Map<StaticSymbol, Set<StaticSymbol>>
}

export interface ServicesUsageInfo {
    servicesUsageMap: Map<StaticSymbol, Set<StaticSymbol>>
    servicesUsageByModules: Map<StaticSymbol, Set<StaticSymbol>>
}

export interface ServiceAnalyzeInfo {
    declarationMap: Map<StaticSymbol, Set<StaticSymbol>>
}

export function analyzeComponent (result: PerformCompilationResult): ComponentAnalyzeInfo {
    const analyzedModules = result.program._analyzedModules
    const tsProgram = result.program.getTsProgram()

    const declarationMap = new Map<StaticSymbol, Set<StaticSymbol>>()
    const bootstrapMap = new Map<StaticSymbol, Set<StaticSymbol>>()
    const entryMap = new Map<StaticSymbol, Set<StaticSymbol>>()
    const pipeDeclarationMap = new Map<StaticSymbol, Set<StaticSymbol>>()

    Array.from(analyzedModules.ngModules.values()).filter(x => moduleIsValidFile(tsProgram, x)).forEach(x => {
        x.bootstrapComponents.forEach(component => {
            appendToSetMap(bootstrapMap, component.reference, x.type.reference)
        })
        x.entryComponents.forEach(component => {
            appendToSetMap(entryMap, component.componentType, x.type.reference)
        })
        x.declaredDirectives.forEach(directive => {
            appendToSetMap(declarationMap, directive.reference, x.type.reference)
        })
        x.declaredPipes.forEach(pipe => {
            appendToSetMap(pipeDeclarationMap, pipe.reference, x.type.reference)
        })
    })

    return {
        pipeDeclarationMap,
        declarationMap,
        bootstrapMap,
        entryMap
    }
}

export function analyzeServices (result: PerformCompilationResult): ServiceAnalyzeInfo {
    const analyzedModules = result.program._analyzedModules
    const tsProgram = result.program.getTsProgram()

    const declarationMap = new Map<StaticSymbol, Set<StaticSymbol>>()
    Array.from(analyzedModules.ngModules.values()).filter(x => moduleIsValidFile(tsProgram, x)).forEach(x => {
        x.providers.filter(provider => referenceIsValidFile(tsProgram, provider.token.identifier.reference)).forEach(provider => {
            appendToSetMap(declarationMap, provider.useClass.reference, x.type.reference)
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
    const servicesUsageByModules = new Map<StaticSymbol, Set<StaticSymbol>>()
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
                appendToSetMap(servicesUsageMap, parameter, x.reference)
            })
        })

        x.providers.forEach(provider => {
            appendToSetMap(servicesUsageByModules, provider.token.identifier.reference, x.type.reference)

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
                appendToSetMap(servicesUsageMap, parameter, provider.token.identifier.reference)
            })
        })
    })

    return {
        servicesUsageMap,
        servicesUsageByModules
    }
}

export function analyzeComponentUsage(result: PerformCompilationResult): ComponentUsageInfo {
    const tsProgram = result.program.getTsProgram()

    const aotCompiler = result.program._compiler
    const templateAstCache = aotCompiler._templateAstCache

    const componentUsageMap = new Map<StaticSymbol, Set<StaticSymbol>>()
    const pipeUsageMap = new Map<StaticSymbol, Set<StaticSymbol>>()
    Array.from(templateAstCache.entries()).map(([key, value]) => value.template.map(temp => [key, temp] as const)).flat().filter(([key, value]) => value && !key.name.endsWith('_Host') && referenceIsValidFile(tsProgram, key)).map(([key, value]) => {
        const visitor = new ElementSymbolTemplateVisitor()
        const context: TemplateContext = { elements: [], directives: [] }

        value.visit(visitor, context)
    
        context.elements.forEach(x => {
            x.providers.filter(x => x.providerType === ProviderAstType.Component || x.providerType === ProviderAstType.Directive).filter(x => referenceIsValidFile(tsProgram, x.token.identifier.reference)).forEach(componentOrDirective => {
                appendToSetMap(componentUsageMap, componentOrDirective.token.identifier.reference, key)

            })
        })
    
        context.directives.forEach(x => {
            if (referenceIsValidFile(tsProgram, x.directive.type.reference)) {
                appendToSetMap(componentUsageMap, x.directive.type.reference, key)
            }
        })
    })
    Array.from(templateAstCache.entries()).map(([key, value]) => value.pipes.map(pipe => [key, pipe] as const)).flat().filter(([key]) => referenceIsValidFile(tsProgram, key)).map(([key, value]) => {
        appendToSetMap(pipeUsageMap, value.type.reference, key)
    })

    return {
        componentUsageMap,
        pipeUsageMap
    }
}