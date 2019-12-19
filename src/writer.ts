import { StaticSymbol } from '@angular/compiler'
import { isDef, concatenate } from './utils'
import {
  Node,
  Program,
  Transformer,
  transform,
  SyntaxKind,
  ObjectLiteralExpression,
  visitEachChild,
  createPropertyAssignment,
  createIdentifier,
  createArrayLiteral,
  updateObjectLiteral,
  PropertyAssignment,
  Identifier,
  ArrayLiteralExpression,
  updatePropertyAssignment,
  updateArrayLiteral,
  createPrinter,
  EmitHint,
  isCallExpression,
  isIdentifier,
  isArrayLiteralExpression,
  isNamedImports,
  isStringLiteral,
  createImportDeclaration,
  createImportClause,
  updateImportClause,
  updateImportDeclaration,
  createNamedImports,
  createImportSpecifier,
  createStringLiteral,
  SourceFile,
  isImportDeclaration,
  updateSourceFileNode,
  CompilerHost
} from 'typescript'
import {
  generateImportSpecifier,
  sourceTypeFromStaticSymbol,
  sourceTypeFromSourceFile
} from './typescript/moduleSpecifier'
import { getResolvedModule } from './typescript/utils'
import { RewriteInfo } from './types/common'

export function rewriteComponentDeclaration(
  tsProgram: Program,
  host: CompilerHost,
  infos: RewriteInfo[],
  oldMod: StaticSymbol
) {
  const sourceFile = tsProgram.getSourceFile(oldMod.filePath)
  if (!sourceFile) {
    return undefined
  }

  const components = infos.map(x => x.component)
  const generatedMods = infos.map(x => x.symbol)
  const componentNameSet = new Set(components.map(x => x.name))
  const componentFilePathSet = new Set(components.map(x => x.filePath))

  const result = transform(sourceFile, [
    context => {
      const visitor: Transformer<Node> = node => {
        switch (node.kind) {
          case SyntaxKind.SourceFile: {
            const file = node as SourceFile
            const newFile = visitEachChild(file, visitor, context)
            const importDeclarationStatements = newFile.statements.filter(
              isImportDeclaration
            )
            const statementsOmitImport = newFile.statements.filter(
              x => !isImportDeclaration(x)
            )

            const mappedImportDeclarationStatements = importDeclarationStatements
              .map(importDeclaration => {
                if (
                  importDeclaration.importClause &&
                  isNamedImports(
                    importDeclaration.importClause.namedBindings!
                  ) &&
                  isStringLiteral(importDeclaration.moduleSpecifier)
                ) {
                  const importedSourceFile = getResolvedModule(
                    sourceFile,
                    importDeclaration.moduleSpecifier.text
                  )
                  if (
                    importedSourceFile &&
                    componentFilePathSet.has(
                      importedSourceFile.resolvedFileName
                    )
                  ) {
                    const componentElements = importDeclaration.importClause.namedBindings.elements.filter(
                      x => componentNameSet.has(x.name.text)
                    )
                    if (componentElements.length) {
                      const componentElementSet = new Set(componentElements)
                      const importElementOmitComponent = importDeclaration.importClause.namedBindings.elements.filter(
                        x => !componentElementSet.has(x)
                      )

                      return importElementOmitComponent.length
                        ? updateImportDeclaration(
                            importDeclaration,
                            undefined,
                            undefined,
                            updateImportClause(
                              importDeclaration.importClause,
                              importDeclaration.importClause.name,
                              createNamedImports(importElementOmitComponent)
                            ),
                            importDeclaration.moduleSpecifier
                          )
                        : undefined
                    }
                  }
                }
                return importDeclaration
              })
              .filter(isDef)
              .flat()

            const results = infos.map(info => {
              const localPath = generateImportSpecifier(
                tsProgram,
                host,
                sourceTypeFromSourceFile(info.symbol, info.file),
                sourceTypeFromStaticSymbol(oldMod)
              )

              return createImportDeclaration(
                undefined,
                undefined,
                createImportClause(
                  undefined,
                  createNamedImports([
                    createImportSpecifier(
                      undefined,
                      createIdentifier(info.symbol.name)
                    )
                  ])
                ),
                createStringLiteral(localPath)
              )
            })

            return updateSourceFileNode(
              newFile,
              concatenate(
                concatenate(mappedImportDeclarationStatements, results),
                statementsOmitImport
              )
            )
          }

          case SyntaxKind.ObjectLiteralExpression: {
            const objectLiteral = node as ObjectLiteralExpression
            if (isNgModuleMetadata(objectLiteral)) {
              const newObjectLiteral = visitEachChild(
                objectLiteral,
                visitor,
                context
              )
              const imports =
                newObjectLiteral.properties.find(
                  x =>
                    x.name && isIdentifier(x.name) && x.name.text === 'imports'
                ) ||
                createPropertyAssignment(
                  createIdentifier('imports'),
                  createArrayLiteral(
                    generatedMods.map(x => createIdentifier(x.name))
                  )
                )
              const declarations = newObjectLiteral.properties.find(
                x =>
                  x.name &&
                  isIdentifier(x.name) &&
                  x.name.text === 'declarations'
              )
              const others = newObjectLiteral.properties.filter(
                x => x !== imports && x !== declarations
              )
              return updateObjectLiteral(
                newObjectLiteral,
                [imports, declarations, ...others].filter(isDef)
              )
            }
            break
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
                    updateArrayLiteral(initializer, [
                      ...initializer.elements,
                      ...generatedMods.map(x => createIdentifier(x.name))
                    ])
                  )
                }
                case 'exports':
                case 'declarations': {
                  const elementsOmitComponent = initializer.elements.filter(
                    x => !(isIdentifier(x) && componentNameSet.has(x.text))
                  )
                  return updatePropertyAssignment(
                    propertyAssignment,
                    propertyAssignment.name,
                    updateArrayLiteral(initializer, elementsOmitComponent)
                  )
                }
              }
            }
            break
          }
        }

        return visitEachChild(node, visitor, context)
      }
      return visitor
    }
  ])

  const printer = createPrinter()
  return printer.printNode(
    EmitHint.Unspecified,
    result.transformed[0],
    sourceFile
  )
}

function isNgModuleMetadata(objectLiteral: ObjectLiteralExpression) {
  return (
    isCallExpression(objectLiteral.parent) &&
    isIdentifier(objectLiteral.parent.expression) &&
    objectLiteral.parent.expression.text === 'NgModule' &&
    objectLiteral.parent.arguments.some(x => x === objectLiteral)
  )
}

function isNgModulePropertyMetadata(propertyAssignment: PropertyAssignment) {
  return (
    isIdentifier(propertyAssignment.name) &&
    isArrayLiteralExpression(propertyAssignment.initializer) &&
    isNgModuleMetadata(propertyAssignment.parent)
  )
}
