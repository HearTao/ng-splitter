/// <reference path="types/angular.d.ts"/>

import * as compilerCli from '@angular/compiler-cli'
import * as path from 'path'
import { moduleIsValidFile, referenceIsValidFile, isDef } from './utils'
import { ElementAst, RecursiveTemplateAstVisitor, DirectiveAst } from '@angular/compiler'

const filename = path.join(__dirname, '../tests/simple')
const result = compilerCli.performCompilation(compilerCli.readConfiguration(filename))

const analyzedModules = result.program._analyzedModules
const aotCompiler = result.program._compiler
const templateAstCache = aotCompiler._templateAstCache

const tsProgram = result.program.getTsProgram()
console.log("+ ".padEnd(40, "-"))

const declareMap = new Map<compilerCli.StaticSymbol, compilerCli.StaticSymbol>()
const bootstrapMap = new Map<compilerCli.StaticSymbol, compilerCli.StaticSymbol>()
const entryMap = new Map<compilerCli.StaticSymbol, compilerCli.StaticSymbol>()

Array.from(analyzedModules.ngModules.values()).filter(x => moduleIsValidFile(tsProgram, x)).map(x => {
    console.log(`| - module ${x.type.reference.name}`)
    x.bootstrapComponents.forEach(component => {
        bootstrapMap.set(component.reference, x.type.reference)
        console.log(`| - - bootstrap ${component.reference.name}`)
    })
    x.entryComponents.forEach(component => {
        entryMap.set(component.componentType, x.type.reference)
        console.log(`| - - entry ${component.componentType.name}`)
    })
    x.declaredDirectives.forEach(directive => {
        declareMap.set(directive.reference, x.type.reference)
        console.log(`| - - declared ${directive.reference.name}`)
    })
})

interface Context {
    elements: ElementAst[]
    directives: DirectiveAst[]
}

export class ElementSymbolTemplateVisitor extends RecursiveTemplateAstVisitor {
    visitElement(ast: ElementAst, context: Context) {
        context.elements.push(ast)
        return super.visitElement(ast, context)
    }

    visitDirective(ast: DirectiveAst, context: Context) {
        context.directives.push(ast)
        return super.visitDirective(ast, context)
    }
}

console.log("| ".padEnd(40, "-"))

const usageMap = new Map<compilerCli.StaticSymbol, Set<compilerCli.StaticSymbol>>()
Array.from(templateAstCache.entries()).map(([key, value]) => {
    return value.template.map(temp => [key, temp] as const)
}).flat().filter(([key, value]) => value && !key.name.endsWith('_Host') && referenceIsValidFile(tsProgram, key)).map(([key, value]) => {
    const visitor = new ElementSymbolTemplateVisitor()
    const context: Context = { elements: [], directives: [] }
    const r = value.visit(visitor, context)

    console.log("| - component " + key.name)
    context.elements.forEach(x => {
        if (x.providers.length && referenceIsValidFile(tsProgram, x.providers[0].token.identifier.reference)) {
            console.log(`| - - used comp ${x.providers[0].token.identifier.reference.name}`)

            const set = usageMap.get(x.providers[0].token.identifier.reference) || new Set<compilerCli.StaticSymbol>()
            set.add(key)
            usageMap.set(x.providers[0].token.identifier.reference, set) 
        }
    })

    context.directives.forEach(x => {
        if (referenceIsValidFile(tsProgram, x.directive.type.reference)) {
            console.log(`| - - used directive ${x.directive.type.reference.name}`)

            const set = usageMap.get(x.directive.type.reference) || new Set<compilerCli.StaticSymbol>()
            set.add(key)
            usageMap.set(x.directive.type.reference, set)
        }
    })
})

console.log("+ ".padEnd(40, "-"))

// console.log(declareMap)

// console.log(usageMap)

Array.from(declareMap.entries()).forEach(([key, value]) => {
    if (!usageMap.has(key) && !bootstrapMap.has(key) && !entryMap.has(key)) {
        console.log(`${key.name} is unused`)
    }
})