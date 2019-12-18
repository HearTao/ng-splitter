import * as ts from 'typescript'
import { StaticSymbol } from '@angular/compiler'
import { generateImportSpecifier } from './typescript/moduleSpecifier'

export function generateModule(
  tsProgram: ts.Program,
  host: ts.CompilerHost,
  newModule: StaticSymbol,
  component: StaticSymbol,
  directives: StaticSymbol[],
  services: StaticSymbol[]
) {
  const statements = generateNgModule(
    tsProgram,
    host,
    newModule,
    component,
    directives,
    services
  )
  const sourceFile = ts.updateSourceFileNode(
    ts.createSourceFile('', '', ts.ScriptTarget.Latest),
    statements
  )
  const printer = ts.createPrinter()
  return printer.printFile(sourceFile)
}

export function generateNgModule(
  tsProgram: ts.Program,
  host: ts.CompilerHost,
  newModule: StaticSymbol,
  component: StaticSymbol,
  directives: StaticSymbol[],
  services: StaticSymbol[]
): ts.Statement[] {
  return [
    ...generateImportDeclaration(
      tsProgram,
      host,
      newModule,
      component,
      directives.concat(services)
    ),
    ...generateClassDeclaration(
      newModule,
      component,
      [component].concat(directives),
      services
    )
  ]
}

export function generateCommonNgImport() {
  return [
    ts.createImportDeclaration(
      undefined,
      undefined,
      ts.createImportClause(
        undefined,
        ts.createNamedImports([
          ts.createImportSpecifier(undefined, ts.createIdentifier('NgModule'))
        ])
      ),
      ts.createStringLiteral('@angular/core')
    )
  ]
}

export function generateImportCustomDeclaration(
  tsProgram: ts.Program,
  host: ts.CompilerHost,
  newModule: StaticSymbol,
  declarations: StaticSymbol[]
) {
  return declarations.map(declaration => {
    const path = generateImportSpecifier(tsProgram, host, declaration, newModule)
    return ts.createImportDeclaration(
      undefined,
      undefined,
      ts.createImportClause(
        undefined,
        ts.createNamedImports([
          ts.createImportSpecifier(undefined, ts.createIdentifier(declaration.name))
        ])
      ),
      ts.createStringLiteral(path)
    )
  })
}

export function generateImportDeclaration(
  tsProgram: ts.Program,
  host: ts.CompilerHost,
  newModule: StaticSymbol,
  component: StaticSymbol,
  declarations: StaticSymbol[]
) {
  return [
    ...generateCommonNgImport(),
    ...generateImportCustomDeclaration(
      tsProgram,
      host,
      newModule,
      [component].concat(declarations)
    )
  ]
}

export function generateDeclarations(directives: StaticSymbol[]) {
  return directives.map(x => ts.createIdentifier(x.name))
}

export function generateProviders(services: StaticSymbol[]) {
  return services.map(x => ts.createIdentifier(x.name))
}

export function generateExports(directives: StaticSymbol[]) {
  return directives.map(x => ts.createIdentifier(x.name))
}

export function generateDecorator(
  component: StaticSymbol,
  directives: StaticSymbol[],
  services: StaticSymbol[]
) {
  return ts.createDecorator(
    ts.createCall(ts.createIdentifier('NgModule'), undefined, [
      ts.createObjectLiteral(
        [
          ts.createPropertyAssignment(
            ts.createIdentifier('declarations'),
            ts.createArrayLiteral(generateDeclarations(directives), false)
          ),
          ts.createPropertyAssignment(
            ts.createIdentifier('providers'),
            ts.createArrayLiteral(generateProviders(services), false)
          ),
          ts.createPropertyAssignment(
            ts.createIdentifier('exports'),
            ts.createArrayLiteral(generateProviders([component]), false)
          )
        ],
        false
      )
    ])
  )
}

export function generateClassDeclaration(
  newModule: StaticSymbol,
  component: StaticSymbol,
  directives: StaticSymbol[],
  services: StaticSymbol[]
) {
  return [
    ts.createClassDeclaration(
      [generateDecorator(component, directives, services)],
      [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      ts.createIdentifier(newModule.name),
      undefined,
      undefined,
      []
    )
  ]
}
