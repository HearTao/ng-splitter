import { ElementAst, DirectiveAst, RecursiveTemplateAstVisitor, RecursiveAstVisitor, BindingPipe } from "@angular/compiler"

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

export interface ExpressionContext {
    pipes: string[]
}

export class ExpressionSymbolVisitor extends RecursiveAstVisitor {
    visitPipe(ast: BindingPipe, context: ExpressionContext) {
        context.pipes.push(ast.name)
        super.visitPipe(ast, context)
    }
}
