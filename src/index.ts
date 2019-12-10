import * as compiler from '@angular/compiler'
import * as compilerCli from '@angular/compiler-cli'
import * as path from 'path'

const result = compilerCli.performCompilation(compilerCli.readConfiguration(path.join(__dirname, '../tests/simple')))

const modules: compiler.NgAnalyzedModules = (result.program as any)._analyzedModules
const comp: compiler.AotCompiler = (result.program as any)._compiler
// console.log(modules.files.filter(x => !x.fileName.includes('node_modules')))

// const modulesMeta: CompileNgModuleMetadata[][] = Array.from((comp as any)._analyzedFiles.values()).filter((x: any) => x.ngModules.length && !x.fileName.includes('node_modules')).map((x: any) => x.ngModules)
// console.log(modulesMeta[0][0].entryComponents)

const providers = 
    Array.from((comp as any)._templateAstCache.values())
        .map((x: any) => x.template)
        .map(x => x[0]).map(x => x.providers[0])
        .filter(Boolean).map(x => x.providers[0])

console.log(providers.map(x => x.token).map(x => x.identifier))
console.log(providers.map(x => x.useClass))
