/// <reference path="types/angular.d.ts"/>

import * as compilerCli from '@angular/compiler-cli'
import * as path from 'path'
import { moduleIsValidFile, isElementAst } from './utils'
import { ElementAst } from '@angular/compiler'

const result = compilerCli.performCompilation(compilerCli.readConfiguration(path.join(__dirname, '../tests/simple')))

const analyzedModules = result.program._analyzedModules
const aotCompiler = result.program._compiler
const templateAstCache = aotCompiler._templateAstCache

const tsProgram = result.program.getTsProgram()
console.log(Array.from(analyzedModules.ngModules.values()).filter(x => moduleIsValidFile(tsProgram, x)).map(x => {
    return [x.type.reference.filePath, x.declaredDirectives.map(x => x.reference.filePath)]
}))

Array.from(templateAstCache.entries()).map(([key, value]) => [key, value.template[0]] as const).filter(([_, value]) => isElementAst(value)).map(([key, value]) => {
    const providers = (value as ElementAst).providers.map(x => x.providers[0].useClass.reference.filePath)
    if (providers.length) {
        console.log(`| - ${key.filePath} deps:`)
        providers.forEach(p => {
            console.log(`| - - ${p}`)
        })
    }
})

