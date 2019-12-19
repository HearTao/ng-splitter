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
import { appendToSetMap, toArray, appendToListMap } from './utils'
import { generateModule } from './gen'
import { rewriteComponentDeclaration } from './writer'
import { RewriteInfo } from './types/common'

const filename = path.resolve('./tests/simple')
// const filename = '/Users/kingwl/Desktop/workspace/conan-admin-web'

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
const files2Write: Map<StaticSymbol, string> = new Map()
const usage2Rewrite: Map<StaticSymbol, RewriteInfo[]> = new Map()

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

  files2Write.set(newModSymbol, generatedModule)

  const componentUsages = Array.from(info.declarationMap.entries()).find(
    ([key]) => key.name === name
  )![1]
  Array.from(componentUsages)
    .filter(usage => usage.name !== newModSymbol.name)
    .forEach(usage => {
      appendToListMap(usage2Rewrite, usage, {
        component,
        symbol: newModSymbol,
        file: generatedSourceFile
      })
    })
})

Array.from(usage2Rewrite.entries()).forEach(([usage, rewriteInfo]) => {
  const rewrite = rewriteComponentDeclaration(
    tsProgram,
    host,
    rewriteInfo,
    usage
  )
  files2Write.set(usage, rewrite!)
})

Array.from(files2Write.entries()).forEach(([file, content]) => {
  fs.writeFileSync(file.filePath, content)
})
