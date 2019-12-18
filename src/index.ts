/// <reference path="types/angular.d.ts"/>

import { performCompilation, readConfiguration, StaticSymbol, createCompilerHost } from '@angular/compiler-cli'
import * as diff from 'diff'
import * as path from 'path'
import * as fs from 'fs'
import { analyzeComponent, analyzeComponentUsage, analyzeServices, analyzeServicesUsage } from './analyze'
import { appendToSetMap, toArray } from './utils'
import { generateModule } from './gen'
import { rewriteComponentDeclaration } from './writer';
import { createPrinter } from 'typescript'

// const filename = path.join(__dirname, '../tests/simple')
const filename = '/Users/kingwl/Desktop/workspace/conan-admin-web'

const config = readConfiguration(filename)
config.options.disableTypeScriptVersionCheck = true

const host = createCompilerHost(config)
const result = performCompilation({ ...config, host })

const serviceInfo = analyzeServices(result);
const info = analyzeComponent(result)
const usage = analyzeComponentUsage(result)
const serviceUsage = analyzeServicesUsage(result)

// Array.from(info.declarationMap.entries()).forEach(([key, v]) => {
//     if (!usage.componentUsageMap.has(key) && !info.bootstrapMap.has(key) && !info.entryMap.has(key)) {
//         v.forEach(value => {
//             console.log(`${key.name} in ${value.name} is unused`)
//         })
//     }
// })

// Array.from(serviceInfo.declarationMap.entries()).forEach(([key, v]) => {
//     if (!serviceUsage.servicesUsageMap.has(key) && !serviceUsage.servicesUsageByModules.has(key)) {
//         v.forEach(value => {
//             console.log(`${key.name} in ${value.name} is unused`)
//         })
//     }
// })

// Array.from(info.pipeDeclarationMap.entries()).forEach(([key, v]) => {
//     if (!usage.pipeUsageMap.has(key)) {
//         v.forEach(value => {
//             console.log(`${key.name} in ${value.name} is unused`)
//         })
//     }
// })

const componentDirectiveDepsMap: Map<StaticSymbol, Set<StaticSymbol>> = new Map()
const componentProvidersDepsMap: Map<StaticSymbol, Set<StaticSymbol>> = new Map()
Array.from(usage.componentUsageMap.entries()).forEach(([key, v]) => {
    v.forEach(value => {
        appendToSetMap(componentDirectiveDepsMap, value, key)
    })
})

Array.from(usage.pipeUsageMap.entries()).forEach(([key, v]) => {
    v.forEach(value => {
        appendToSetMap(componentDirectiveDepsMap, value, key)
    })
})

Array.from(serviceUsage.servicesUsageMap.entries()).forEach(([key, v]) => {
    v.forEach(value => {
        appendToSetMap(componentProvidersDepsMap, value, key)
    })
})

// Array.from(usage.componentUsageMap.entries()).forEach(([comp, used]) => {
//     console.log('+ ='.padEnd(40, '='))
//     console.log(`| - component ${comp.name}`)
//     console.log('+ -'.padEnd(40, '-'))
//     if (info.declarationMap.has(comp)) {
//         info.declarationMap.get(comp).forEach(declaration => {
//             console.log(`| - - declaration on ${declaration.name}`)
//         })
//         console.log('+ -'.padEnd(40, '-'))
//     }

//     if (componentDirectiveDepsMap.has(comp)) {
//         const deps = componentDirectiveDepsMap.get(comp)
//         deps.forEach(dep => {
//             console.log(`| - - depends directive on ${dep.name}`)
//         })
//         console.log('+ -'.padEnd(40, '-'))
//     }

//     if (componentProvidersDepsMap.has(comp)) {
//         componentProvidersDepsMap.get(comp).forEach(dep => {
//             console.log(`| - - depends service on ${dep.name}`)
//         })
//         console.log('+ -'.padEnd(40, '-'))
//     }

//     used.forEach(usage => {
//         console.log(`| - - used in ${usage.name}`)
//     })
// })

// console.log('+ ='.padEnd(40, '='))

const componentNeedRewrite = Array.from(usage.componentUsageMap.entries()).filter(([key, value]) => value.size > 0);

const tsProgram = result.program.getTsProgram()
componentNeedRewrite.forEach(([component]) => {
    const name = component.name
    const modName = name.replace('Component', 'Module')
    const modPath = component.filePath.replace('.component', '.module')
    const generatedModule = generateModule(tsProgram, host, modPath, component, modName, toArray(componentDirectiveDepsMap.get(component)), toArray(componentProvidersDepsMap.get(component)))
    const modulePatch = diff.createPatch(modPath, '', generatedModule)
    console.log(modulePatch)

    // fs.writeFileSync(modPath, generatedModule)

    // console.log(`generatedModule ${generatedModule}`)
    console.log('+ ='.padEnd(40, '='))

    const componentUsages = Array.from(info.declarationMap.entries()).find(([key]) => key.name === name)[1]
    componentUsages.forEach(usage => {
        const printer = createPrinter()
        const before = printer.printFile(tsProgram.getSourceFile(usage.filePath))
        const rewrite = rewriteComponentDeclaration(tsProgram, host, component, modName, modPath, usage)
        const rewritePatch = diff.createPatch(usage.filePath, before, rewrite)
        console.log(rewritePatch)
        // fs.writeFileSync(usage.filePath, rewrite)
    })
    console.log('+ ='.padEnd(40, '='))
})
