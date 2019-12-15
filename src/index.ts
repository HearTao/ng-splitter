/// <reference path="types/angular.d.ts"/>

import { performCompilation, readConfiguration, StaticSymbol } from '@angular/compiler-cli'
import * as path from 'path'
import { analyzeComponent, analyzeComponentUsage, analyzeServices, analyzeServicesUsage } from './analyze'
import { appendToSetMap, toArray } from './utils'
import { generateModule } from './gen'
import { rewriteComponentDeclaration } from './writer';

const filename = path.join(__dirname, '../tests/simple')
// const filename = '/Users/kingwl/Desktop/workspace/conan-admin-web'
const result = performCompilation(readConfiguration(filename))

const serviceInfo = analyzeServices(result);
const info = analyzeComponent(result)
const usage = analyzeComponentUsage(result)
const serviceUsage = analyzeServicesUsage(result)

Array.from(info.declarationMap.entries()).forEach(([key, v]) => {
    if (!usage.componentUsageMap.has(key) && !info.bootstrapMap.has(key) && !info.entryMap.has(key)) {
        v.forEach(value => {
            console.log(`${key.name} in ${value.name} is unused`)
        })
    }
})

Array.from(serviceInfo.declarationMap.entries()).forEach(([key, v]) => {
    if (!serviceUsage.servicesUsageMap.has(key) && !serviceUsage.servicesUsageByModules.has(key)) {
        v.forEach(value => {
            console.log(`${key.name} in ${value.name} is unused`)
        })
    }
})

Array.from(info.pipeDeclarationMap.entries()).forEach(([key, v]) => {
    if (!usage.pipeUsageMap.has(key)) {
        v.forEach(value => {
            console.log(`${key.name} in ${value.name} is unused`)
        })
    }
})

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

Array.from(usage.componentUsageMap.entries()).forEach(([comp, used]) => {
    console.log('+ ='.padEnd(40, '='))
    console.log(`| - component ${comp.name}`)
    console.log('+ -'.padEnd(40, '-'))
    if (info.declarationMap.has(comp)) {
        info.declarationMap.get(comp).forEach(declaration => {
            console.log(`| - - declaration on ${declaration.name}`)
        })
        console.log('+ -'.padEnd(40, '-'))
    }
    
    if (componentDirectiveDepsMap.has(comp)) {
        const deps = componentDirectiveDepsMap.get(comp)
        deps.forEach(dep => {
            console.log(`| - - depends directive on ${dep.name}`)
        })
        console.log('+ -'.padEnd(40, '-'))
    }

    if (componentProvidersDepsMap.has(comp)) {
        componentProvidersDepsMap.get(comp).forEach(dep => {
            console.log(`| - - depends service on ${dep.name}`)
        })
        console.log('+ -'.padEnd(40, '-'))
    }

    used.forEach(usage => {
        console.log(`| - - used in ${usage.name}`)
    })
})

console.log('+ ='.padEnd(40, '='))

const name = 'BarComponent'
const modName = 'BarModule'
const component = Array.from(usage.componentUsageMap.keys()).find(x => x.name === name)

const generatedModule = generateModule(result.program.getTsProgram(), component, modName, toArray(componentDirectiveDepsMap.get(component)), toArray(componentProvidersDepsMap.get(component)))

console.log(`generatedModule ${generatedModule}`)

console.log('+ ='.padEnd(40, '='))

const componentUsages = Array.from(info.declarationMap.entries()).find(([key]) => key.name === name)[1]
componentUsages.forEach(usage => {
    const rewrite = rewriteComponentDeclaration(result.program.getTsProgram(), component, modName, usage)
    console.log(`rewrite: ${rewrite}`)
})

