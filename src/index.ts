import * as compiler from '@angular/compiler'
import * as compilerCli from '@angular/compiler-cli'
import * as path from 'path'

const result = compilerCli.performCompilation(compilerCli.readConfiguration(path.join(__dirname, '../tests/simple')))

const modules: compiler.NgAnalyzedModules = (result.program as any)._analyzedModules
const comp: compiler.AotCompiler = (result.program as any)._compiler
// console.log(modules.files.filter(x => !x.fileName.includes('node_modules')))
// console.log(modules.ngModules[5].entryComponents[0])

console.log(Object.keys((comp as any)._metadataResolver._ngModuleResolver))

