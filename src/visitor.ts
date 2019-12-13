import { ElementAst, DirectiveAst, RecursiveTemplateAstVisitor } from "@angular/compiler"

export interface TemplateContext {
    elements: ElementAst[]
    directives: DirectiveAst[]
}

export class ElementSymbolTemplateVisitor extends RecursiveTemplateAstVisitor {
    visitElement(ast: ElementAst, context: TemplateContext) {
        context.elements.push(ast)
        return super.visitElement(ast, context)
    }

    visitDirective(ast: DirectiveAst, context: TemplateContext) {
        context.directives.push(ast)
        return super.visitDirective(ast, context)
    }
}
