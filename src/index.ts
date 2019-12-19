/// <reference path="./types/angular.d.ts"/>

import {
  performCompilation,
  readConfiguration,
  StaticSymbol,
  createCompilerHost
} from '@angular/compiler-cli'
import * as diff from 'diff'
import * as path from 'path'
import * as fs from 'fs'
import {
  analyzeComponent,
  analyzeComponentUsage,
  analyzeServices,
  analyzeServicesUsage
} from './analyze'
import { appendToSetMap, toArray } from './utils'
import { generateModule } from './gen'
import { rewriteComponentDeclaration } from './writer'
import { createPrinter } from 'typescript'

// const filename = path.resolve('./tests/simple')
const filename = '/Users/kingwl/Desktop/workspace/conan-admin-web'

const config = readConfiguration(filename)
config.options.disableTypeScriptVersionCheck = true

const host = createCompilerHost(config)
const result = performCompilation({ ...config, host })

const serviceInfo = analyzeServices(result)
const info = analyzeComponent(result)
const usage = analyzeComponentUsage(result)
const serviceUsage = analyzeServicesUsage(result)

const componentDirectiveDepsMap: Map<
  StaticSymbol,
  Set<StaticSymbol>
> = new Map()
const componentProvidersDepsMap: Map<
  StaticSymbol,
  Set<StaticSymbol>
> = new Map()
Array.from(usage.componentUsageMap.entries()).forEach(([key, v]) => {
  v.forEach(value => {
    appendToSetMap(componentDirectiveDepsMap, value, key)
  })
})

// Array.from(usage.pipeUsageMap.entries()).forEach(([key, v]) => {
//   v.forEach(value => {
//     appendToSetMap(componentDirectiveDepsMap, value, key)
//   })
// })

Array.from(serviceUsage.servicesUsageMap.entries()).forEach(([key, v]) => {
  v.forEach(value => {
    appendToSetMap(componentProvidersDepsMap, value, key)
  })
})

const componentNeedRewrite = Array.from(
  usage.componentUsageMap.entries()
).filter(([key, value]) => value.size > 0)

const tsProgram = result.program!.getTsProgram()
const patchMap: Map<StaticSymbol, string[]> = new Map()
const generatedSourceMap: Map<StaticSymbol, string> = new Map()

componentNeedRewrite.forEach(([component]) => {
  const name = component.name
  const modName = name.replace('Component', 'Module')
  const modPath = component.filePath.replace('.component', '.module')
  const newModSymbol = result.program!._compiler.reflector.getStaticSymbol(
    modPath,
    modName
  )

  if (host.fileExists(newModSymbol.filePath)) {
    return
  }

  const [generatedModule, generatedSourceFile] = generateModule(
    tsProgram,
    host,
    newModSymbol,
    component,
    toArray(componentDirectiveDepsMap.get(component)),
    toArray(componentProvidersDepsMap.get(component))
  )

  generatedSourceMap.set(newModSymbol, generatedModule)
  appendToPatchMap(patchMap, newModSymbol, '', generatedModule);

  // fs.writeFileSync(newModSymbol.filePath, generatedModule)

  // console.log(`generatedModule ${generatedModule}`)
  //   console.log('+ ='.padEnd(40, '='))

  const componentUsages = Array.from(info.declarationMap.entries()).find(
    ([key]) => key.name === name
  )![1]
  Array.from(componentUsages)
    .filter(usage => usage.name !== newModSymbol.name)
    .forEach(usage => {
      const printer = createPrinter()
      const before = printer.printFile(tsProgram.getSourceFile(usage.filePath)!)
      const rewrite = rewriteComponentDeclaration(
        tsProgram,
        host,
        component,
        newModSymbol,
        generatedSourceFile,
        usage
      )
      appendToPatchMap(patchMap, usage, before, rewrite!);
      // fs.writeFileSync(usage.filePath, rewrite)
    })
})

const printer = createPrinter()
Array.from(patchMap.entries()).forEach(([file, patches]) => {
  const source = generatedSourceMap.get(file) || printer.printFile(tsProgram.getSourceFile(file.filePath)!)

  let curr = source
  patches.forEach(patch => {
    curr = diff.applyPatch(curr, patch)
  })

  console.log(curr)
})

function appendToPatchMap (map: Map<StaticSymbol, string[]>, file: StaticSymbol, before: string, rewrite: string) {
  const patch = diff.createPatch(file.filePath, before, rewrite)
  const list = map.get(file) || []
  list.push(patch)
  map.set(file, list)
  return map
}
