/// <reference path="types/angular.d.ts"/>

import * as compilerCli from '@angular/compiler-cli'
import * as path from 'path'
import { analyzeComponent, analyzeComponentUsage } from './analyze'

const filename = path.join(__dirname, '../tests/simple')
const result = compilerCli.performCompilation(compilerCli.readConfiguration(filename))

const info = analyzeComponent(result)
const usage = analyzeComponentUsage(result)

Array.from(info.declarationMap.entries()).forEach(([key, value]) => {
    if (!usage.componentUsageMap.has(key) && !info.bootstrapMap.has(key) && !info.entryMap.has(key)) {
        console.log(`${key.name} in ${value.name} is unused`)
    }
})
