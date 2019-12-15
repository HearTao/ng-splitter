import { StaticSymbol } from "@angular/compiler";
import { isDef } from "./utils";
import { Node, Program, Transformer, transform, SyntaxKind, ObjectLiteralExpression, visitEachChild, createPropertyAssignment, createIdentifier, createArrayLiteral, updateObjectLiteral, PropertyAssignment, Identifier, ArrayLiteralExpression, updatePropertyAssignment, updateArrayLiteral, createPrinter, EmitHint, isCallExpression, isIdentifier, isArrayLiteralExpression } from "typescript"

export function rewriteComponentDeclaration(tsProgram: Program, component: StaticSymbol, name: string, mod: StaticSymbol) {
    const sourceFile = tsProgram.getSourceFile(mod.filePath)

    const result = transform(sourceFile, [
        context => {
            const visitor: Transformer<Node> = node => {
                switch (node.kind) {
                    case SyntaxKind.ObjectLiteralExpression: {
                        const objectLiteral = node as ObjectLiteralExpression
                        if (isNgModuleMetadata(objectLiteral)) {
                            const newObjectLiteral = visitEachChild(objectLiteral, visitor, context)
                            const imports = newObjectLiteral.properties.find(x => isIdentifier(x.name) && x.name.text === 'imports') || createPropertyAssignment(
                                createIdentifier('imports'),
                                createArrayLiteral([
                                    createIdentifier(name)
                                ])
                            )
                            const declarations = newObjectLiteral.properties.find(x => isIdentifier(x.name) && x.name.text === 'declarations')
                            const others = newObjectLiteral.properties.filter(x => x !== imports && x !== declarations)
                            return updateObjectLiteral(
                                newObjectLiteral,
                                [
                                    imports,
                                    declarations,
                                    ...others
                                ].filter(isDef)
                            )
                        }
                    }
                    case SyntaxKind.PropertyAssignment: {
                        const propertyAssignment = node as PropertyAssignment
                        if (isNgModulePropertyMetadata(propertyAssignment)) {
                            const propsName = propertyAssignment.name as Identifier
                            const initializer = propertyAssignment.initializer as ArrayLiteralExpression
                            switch (propsName.text) {
                                case 'imports': {
                                    return updatePropertyAssignment(
                                        propertyAssignment,
                                        propertyAssignment.name,
                                        updateArrayLiteral(
                                            initializer,
                                            [
                                                ...initializer.elements,
                                                createIdentifier(name)
                                            ]
                                        )
                                    )
                                }
                                case 'exports':
                                case 'declarations': {
                                    const elementsOmitComponent = initializer.elements.filter(x => !isIdentifier(x) || x.text !== component.name)
                                    return updatePropertyAssignment(
                                        propertyAssignment,
                                        propertyAssignment.name,
                                        updateArrayLiteral(
                                            initializer,
                                            elementsOmitComponent
                                        )
                                    )
                                }
                            }
                        }
                    }
                }

                return visitEachChild(node, visitor, context)
            }
            return visitor
        }
    ])

    const printer = createPrinter()
    return printer.printNode(EmitHint.Unspecified, result.transformed[0], sourceFile)
}

function isNgModuleMetadata (objectLiteral: ObjectLiteralExpression) {
    return isCallExpression(objectLiteral.parent) && isIdentifier(objectLiteral.parent.expression) &&
                            objectLiteral.parent.expression.text === 'NgModule' && objectLiteral.parent.arguments.some(x => x === objectLiteral)              
}

function isNgModulePropertyMetadata(propertyAssignment: PropertyAssignment) {
    return isIdentifier(propertyAssignment.name) && isArrayLiteralExpression(propertyAssignment.initializer) && isNgModuleMetadata(propertyAssignment.parent)
}