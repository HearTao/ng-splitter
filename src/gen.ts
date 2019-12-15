import * as ts from 'typescript'
import { StaticSymbol } from "@angular/compiler";

export function generateModule(tsProgram: ts.Program, component: StaticSymbol, name: string, directives: StaticSymbol[], services: StaticSymbol[]) {
    const statements = generateNgModule(tsProgram, name, [component].concat(directives), services)
    const sourceFile = ts.updateSourceFileNode(
        ts.createSourceFile('', '', ts.ScriptTarget.Latest),
        statements
    )
    const printer = ts.createPrinter()
    return printer.printFile(sourceFile)
}

export function generateNgModule(tsProgram: ts.Program, name: string, directives: StaticSymbol[], services: StaticSymbol[]): ts.Statement[] {
    return [
        ...generateImportDeclaration(tsProgram, directives.concat(services)),
        ...generateClassDeclaration(name, directives, services)
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

export function generateImportCustomDeclaration(tsProgram: ts.Program, declarations: StaticSymbol[]) {
    return declarations.map(x => ts.createImportDeclaration(
        undefined,
        undefined,
        ts.createImportClause(
            undefined,
            ts.createNamedImports([
                ts.createImportSpecifier(undefined, ts.createIdentifier(x.name))
            ])
        ),
        ts.createStringLiteral(tsProgram.getSourceFile(x.filePath).fileName)
    ))
}

export function generateImportDeclaration(tsProgram: ts.Program, declarations: StaticSymbol[]) {
    return [
        ...generateCommonNgImport(),
        ...generateImportCustomDeclaration(tsProgram, declarations),
    ]
}

export function generateDeclarations(directives: StaticSymbol[]) {
    return directives.map(x => ts.createIdentifier(x.name))
}

export function generateProviders(services: StaticSymbol[]) {
    return services.map(x => ts.createIdentifier(x.name))
}

export function generateDecorator(directives: StaticSymbol[], services: StaticSymbol[]) {
    return ts.createDecorator(
        ts.createCall(ts.createIdentifier('NgModule'), undefined, [
            ts.createObjectLiteral(
                [
                    ts.createPropertyAssignment(
                        ts.createIdentifier('declarations'),
                        ts.createArrayLiteral(
                            generateDeclarations(directives),
                            false
                        )
                    ),
                    ts.createPropertyAssignment(
                        ts.createIdentifier('providers'),
                        ts.createArrayLiteral(
                            generateProviders(services),
                            false
                        )
                    )
                ],
                false
            )
        ])
    )
}

export function generateClassDeclaration(name: string, directives: StaticSymbol[], services: StaticSymbol[]) {
    return [
        ts.createClassDeclaration(
            [
                generateDecorator(directives, services)
            ],
            [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
            ts.createIdentifier(name),
            undefined,
            undefined,
            []
        )
    ]
}