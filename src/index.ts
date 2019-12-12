/// <reference path="types/angular.d.ts"/>

import * as compilerCli from '@angular/compiler-cli'
import * as path from 'path'
import { analyzeComponent, analyzeComponentUsage, analyzeServices, analyzeServicesUsage } from './analyze'

const filename = path.join(__dirname, '../tests/simple')
const result = compilerCli.performCompilation(compilerCli.readConfiguration(filename))

const serviceInfo = analyzeServices(result);
const info = analyzeComponent(result)
const usage = analyzeComponentUsage(result)
const serviceUsage = analyzeServicesUsage(result)

Array.from(info.declarationMap.entries()).forEach(([key, value]) => {
    if (!usage.componentUsageMap.has(key) && !info.bootstrapMap.has(key) && !info.entryMap.has(key)) {
        console.log(`${key.name} in ${value.name} is unused`)
    }
})

Array.from(serviceInfo.declarationMap.entries()).forEach(([key, value]) => {
    if (!serviceUsage.servicesUsageMap.has(key)) {
        console.log(`${key.name} in ${value.name} is unused`)
    }
})
