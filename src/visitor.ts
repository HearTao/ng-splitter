import { ElementAst, DirectiveAst, RecursiveTemplateAstVisitor } from "@angular/compiler"

export interface Context {
    elements: ElementAst[]
    directives: DirectiveAst[]
}

export class ElementSymbolTemplateVisitor extends RecursiveTemplateAstVisitor {
    visitElement(ast: ElementAst, context: Context) {
        context.elements.push(ast)
        return super.visitElement(ast, context)
    }

    visitDirective(ast: DirectiveAst, context: Context) {
        context.directives.push(ast)
        return super.visitDirective(ast, context)
    }
}
