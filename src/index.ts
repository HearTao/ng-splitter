/// <reference path="types/angular.d.ts"/>

import * as compilerCli from '@angular/compiler-cli'
import * as path from 'path'
import { moduleIsValidFile, isElementAst } from './utils'

const result = compilerCli.performCompilation(compilerCli.readConfiguration(path.join(__dirname, '../tests/simple')))

const analyzedModules = result.program._analyzedModules
const aotCompiler = result.program._compiler
const templateAstCache = aotCompiler._templateAstCache

const tsProgram = result.program.getTsProgram()
console.log(Array.from(analyzedModules.ngModules.values()).filter(x => moduleIsValidFile(tsProgram, x)).map(x => x.declaredDirectives.map(x => x.reference)))

console.log(Array.from(templateAstCache.values()).map(x => x.template[0]).filter(isElementAst).map(x => x.providers[0]).filter(Boolean).map(x => x.token.identifier.reference))

