/// <reference path="types/angular.d.ts"/>

import { performCompilation, readConfiguration, StaticSymbol } from '@angular/compiler-cli'
import * as path from 'path'
import { analyzeComponent, analyzeComponentUsage, analyzeServices, analyzeServicesUsage } from './analyze'
import { appendToSetMap } from './utils'

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

const componentDepsMap: Map<StaticSymbol, Set<StaticSymbol>> = new Map()
Array.from(usage.componentUsageMap.entries()).forEach(([key, v]) => {
    v.forEach(value => {
        appendToSetMap(componentDepsMap, value, key)
    })
})

Array.from(usage.pipeUsageMap.entries()).forEach(([key, v]) => {
    v.forEach(value => {
        appendToSetMap(componentDepsMap, value, key)
    })
})

Array.from(serviceUsage.servicesUsageMap.entries()).forEach(([key, v]) => {
    v.forEach(value => {
        appendToSetMap(componentDepsMap, value, key)
    })
})

Array.from(componentDepsMap.entries()).forEach(([comp, deps]) => {
    console.log('+ ='.padEnd(40, '='))
    console.log(`| - component ${comp.name}`)
    console.log('+ -'.padEnd(40, '-'))
    if (info.declarationMap.has(comp)) {
        info.declarationMap.get(comp).forEach(declaration => {
            console.log(`| - - declaration on ${declaration.name}`)
        })
    }
    console.log('+ -'.padEnd(40, '-'))
    deps.forEach(dep => {
        console.log(`| - - depends on ${dep.name}`)
    })

    if (usage.componentUsageMap.has(comp)) {
        console.log('| -'.padEnd(40, '-'))
        usage.componentUsageMap.get(comp).forEach(usage => {
            console.log(`| - - used in ${usage.name}`)
        })
    }
})
