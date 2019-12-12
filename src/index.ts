/// <reference path="types/angular.d.ts"/>

import * as compilerCli from '@angular/compiler-cli'
import * as path from 'path'
import { moduleIsValidFile, referenceIsValidFile } from './utils'
import { ElementAst, RecursiveTemplateAstVisitor } from '@angular/compiler'

const result = compilerCli.performCompilation(compilerCli.readConfiguration(path.join(__dirname, '../tests/simple')))

const analyzedModules = result.program._analyzedModules
const aotCompiler = result.program._compiler
const templateAstCache = aotCompiler._templateAstCache

const tsProgram = result.program.getTsProgram()
console.log("+ ".padEnd(40, "-"))

Array.from(analyzedModules.ngModules.values()).filter(x => moduleIsValidFile(tsProgram, x)).map(x => {
    console.log(`| - module ${x.type.reference.name}`)
    x.declaredDirectives.forEach(x => {
        console.log(`| - - declared ${x.reference.name}`)
    })
})

export class ElementSymbolTemplateVisitor extends RecursiveTemplateAstVisitor {
    visitElement(ast: ElementAst, context: ElementAst[]) {
        context.push(ast)
        return super.visitElement(ast, context)
    }
}

console.log("| ".padEnd(40, "-"))

Array.from(templateAstCache.entries()).map(([key, value]) => [key, value.template[0]] as const).filter(([key, value]) => value && !key.name.endsWith('_Host')).map(([key, value]) => {
    const visitor = new ElementSymbolTemplateVisitor()
    const elements: ElementAst[] = []
    const r = value.visit(visitor, elements)
    console.log("| - module " + key.name)
    elements.forEach(x => {
        if (x.providers.length && referenceIsValidFile(tsProgram, x.providers[0].token.identifier.reference)) {
            console.log(`| - - used ${x.providers[0].token.identifier.reference.name}`)
        }
    })
})

console.log("+ ".padEnd(40, "-"))
