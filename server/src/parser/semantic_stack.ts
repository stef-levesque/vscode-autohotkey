/**
 * Generate a parse stack of parsing process,
 * not for a real parser.
 * But, for language server providers.
 * Only parse a line.
 */

import { createToken, Token, TokenType } from './types';
import { Tokenizer } from './tokenizer'
import { 
    IAssign,
    IASTNode,
    IBinOp,
    IFunctionCall,
    IMethodCall,
    INodeResult,
    IOffRange,
    IPropertCall,
    IVariable,
    INoOpt,
    Offrange,
    FunctionCall,
    PropertCall,
    MethodCall,
    IUnaryOperator,
    ILiteral,
    Expr,
    NoOption,
    IAssociativeArray,
    IAPair,
    IArray,
    ICommandCall,
    CommandCall
 } from "./asttypes";

export function isExpr(node: IASTNode): node is IBinOp {
    if ((node as IBinOp)['right'] === undefined) {
        return false;
    }
    return true;
}

export class SemanticStack {
    private tokenizer: Tokenizer;
    private currentToken: Token;

    constructor(document: string) {
        this.tokenizer = new Tokenizer(document);
        this.currentToken = this.tokenizer.GetNextToken();
    }

    public reset(document: string) {
        this.tokenizer.Reset(document);
        return this;
    }

    private inType(actualt: TokenType, expectts: TokenType[]) {
        for (const t of expectts) {
            if (actualt === t) {
                return true;
            }
        }
        return false;
    }

    private eat(type: TokenType) {
        if (type === this.currentToken.type) {
            this.currentToken = this.tokenizer.GetNextToken();
        } 
        else {
            throw new Error("Unexpect Token");
        }
    }

    private variable(): INodeResult<IVariable> {
        let token = this.currentToken;
        this.eat(TokenType.id);
        return {
            errors: false,
            value: {
                name: token.content,
                token: token,
                offrange: new Offrange(token.start, token.end)
            }
        };
    }

    private literal(): INodeResult<ILiteral> {
        let token = this.currentToken;
        if (this.currentToken.type === TokenType.string) {
            this.eat(TokenType.string);
        } 
        else if (this.currentToken.type === TokenType.number) {
            this.eat(TokenType.number);
        }
        return {
            errors: false,
            value: {
                token: token,
                value: token.content,
                offrange: new Offrange(token.start, token.end)
            }
        };
    }

    private associativeArray(): INodeResult<IAssociativeArray> {
        const start = this.currentToken.start;
        let error: boolean = false;
        let pairs: IAPair[] = [];
        this.eat(TokenType.openBrace);
        try {
            let key: Expr = this.expr();
            this.eat(TokenType.colon);
            let value: Expr = this.expr();
            pairs.push({
                key: key,
                value: value
            });
            while (this.currentToken.type === TokenType.comma) {
                this.eat(TokenType.comma);
                let key: Expr = this.expr();
                this.eat(TokenType.colon);
                let value: Expr = this.expr();
                pairs.push({
                    key: key,
                    value: value
                });
            
            }
            this.eat(TokenType.closeBrace);
        } 
        catch (err) {
            error = true;
        }
        // FIXME: correct end range
        // 出错就随便设个末尾范围
        const end = error ? this.currentToken.start : this.currentToken.end;
        return {
            errors: error,
            value: {
                Pairs: pairs,
                offrange: new Offrange(start, end)
            }
        };
    }

    private array(): INodeResult<IArray> {
        const start = this.currentToken.start;
        let error: boolean = false;
        let items: Expr[] = [];
        this.eat(TokenType.openBracket);
        try {
            let item = this.expr();
            items.push(item);
            while (this.currentToken.type === TokenType.comma) {
                this.eat(TokenType.comma);
                item = this.expr();
                items.push(item);
            }
            this.eat(TokenType.closeBracket);
        }
        catch (err) {
            error = true;
        }
        // FIXME: correct end range
        // 出错就随便设个末尾范围
        const end = error ? this.currentToken.start : this.currentToken.end;
        return {
            errors: error,
            value: {
                items: items,
                offrange: new Offrange(start, end)
            }
        };
    }

    private classNew(): INodeResult<IMethodCall> {
        this.eat(TokenType.new);
        const token = this.currentToken;
        // new a class like a function call
        if (this.tokenizer.currChar === '(') {
            let node = this.funcCall();
            return {
                errors: node.errors,
                value: new MethodCall(
                    '__New',
                    node.value.actualParams,
                    node.value.token,
                    [node.value.token],
                    node.value.offrange
                )   
            };
        }
        // new a class like a class call
        else if (this.tokenizer.currChar === '.') {
            let node = this.classCall();
            let vnode = node.value;
            vnode.ref.push(vnode.token);
            if (vnode instanceof MethodCall) {
                return {
                    errors: node.errors,
                    value: new MethodCall(
                        '__New',
                        vnode.actualParams,
                        vnode.token,
                        vnode.ref,
                        vnode.offrange
                    )
                };  
            }
            else {
                return {
                    errors: node.errors,
                    value: new MethodCall(
                        '__New',
                        [],             // new like property call does not have parameters
                        vnode.token,
                        vnode.ref,
                        vnode.offrange
                    )
                };  
            }
        }
        // new a class just by it name
        else {
            if (token.type === TokenType.id) {
                this.eat(TokenType.id);
                return {
                    errors: false,
                    value: new MethodCall(
                        '__New',
                        [],             // new like property call does not have parameters
                        token,
                        [token],
                        new Offrange(token.start, token.end)
                    )
                };
            }
            else {
                // got wrong in new class
                return {
                    errors: true,
                    value: new MethodCall(
                        '__New',
                        [],             // new like property call does not have parameters
                        createToken(TokenType.unknown, '', token.start, token.end),
                        [],
                        new Offrange(token.start, token.end)
                    )
                };
            }
                
        }
    }

    // For this is simple parser, we don't care about operator level
    private factor(): Expr{
        let token = this.currentToken
        let node: Expr;
        switch (this.currentToken.type) {
            case TokenType.string:
            case TokenType.number:
                return this.literal();
            case TokenType.plus:
            case TokenType.minus:
                this.eat(this.currentToken.type);
                let exp = this.expr();
                return {
                    errors: false, 
                    value: {
                        operator: token, 
                        expr: exp, 
                        offrange: new Offrange(token.start, exp.value.offrange.end)
                    }
                };
            case TokenType.new:
                return this.classNew();
            case TokenType.openParen:
                this.eat(TokenType.openParen);
                node = this.expr();
                this.eat(TokenType.closeParen);
                return node;
            case TokenType.openBracket:
                return this.array();
            case TokenType.openBrace:
                return this.associativeArray();
            default:
                switch (this.tokenizer.currChar) {
                    case '(':
                        node = this.funcCall();
                        break;
                    case '.':
                        node = this.classCall();
                        break;
                    default:
                        node = this.variable();
                        break;
                }
                return node;
        }
    }

    private expr(): Expr {
        // while (this.currentToken.type !== TokenType.id && this.currentToken.type !== TokenType.comma) {
        //     this.eat(this.currentToken.type);
        // }
        try {
            let left = this.factor();
            let node: Expr = {
                errors: left.errors,
                value: left.value
            };
            
            while ((this.currentToken.type >= TokenType.number  && // all allowed operator
                    this.currentToken.type <= TokenType.less)   ||
                   (this.currentToken.type === TokenType.dot)   || 
                   (this.currentToken.type === TokenType.unknown)) {
                let token = this.currentToken;
                // Implicit connection expression
                if (this.currentToken.type >= TokenType.number && this.currentToken.type <= TokenType.id) {
                    token = {
                        content: '',
                        type: TokenType.unknown,
                        start: this.currentToken.start,
                        end: this.currentToken.start
                    }
                }
                // temporary solution for "? :" experssion
                if (this.currentToken.type === TokenType.question) {
                    this.eat(TokenType.question);
                    const right: Expr = this.expr();
                    try {
                        this.eat(TokenType.colon);
                    }
                    finally {
                        node = {
                            errors: right.errors,
                            value: {
                                left: left,
                                operator: token,
                                right: right,
                                offrange: new Offrange(token.start, right.value.offrange.end)
                            }
                        }
                    }
                }
                this.eat(this.currentToken.type);
                const right: Expr = this.expr()
                node = {
                    errors: right.errors,
                    value: {
                        left: left,
                        operator: token,
                        right: right,
                        offrange: new Offrange(token.start, right.value.offrange.end)
                    }
                }
            }
            return node;
        } 
        catch (err) {
            return {
                errors: true,
                value: new NoOption(new Offrange(this.currentToken.start, this.currentToken.end))
            };
        }
    }

    private assignment(): INodeResult<IAssign> {
        let left: INodeResult<IVariable|IPropertCall>;
        if (this.tokenizer.currChar === '.') {
            left = this.classCall();
        }
        left = this.variable();
        let isWrong = false;

        let token: Token = this.currentToken;
        if (this.currentToken.type === TokenType.aassign) {
            this.eat(TokenType.aassign);
        }
        try{
            this.eat(TokenType.equal);
            // FIXME: tokenizor should only generate string token here
        }
        catch (err) {
            isWrong = true;
        }
        let exprNode = this.expr();
        return {
            errors: isWrong,
            value: {
                left: left,
                operator: token,
                right: exprNode,
                offrange: new Offrange(token.start, exprNode.value.offrange.end)
            }
        };

    }

    private commandCall(): INodeResult<ICommandCall> {
        let token = this.currentToken;
        let cmdName = token.content;
        let iserror = false;

        this.eat(TokenType.command);
        let actualParams: INodeResult<IBinOp | INoOpt>[] = [];
        while (this.currentToken.type === TokenType.comma) {
            // '% ' deref maybe not a regular syntax
            // set flag by syntax parser maybe the only way
            // to parse without wrong, said T_T 
            this.tokenizer.setLiteralDeref(false);
            this.eat(TokenType.comma);
            actualParams.push(this.expr());
        }
        const end: number = this.currentToken.end;
        return {
            errors: iserror,
            value: new CommandCall(cmdName, actualParams, token, new Offrange(token.start, end))
        };
    }

    private funcCall(): INodeResult<IFunctionCall> {
        let token = this.currentToken;
        let funcName = token.content;
        let iserror = false;

        this.eat(TokenType.id);
        this.eat(TokenType.openParen);
        let actualParams: INodeResult<IBinOp | INoOpt>[] = [];
        if (this.currentToken.type !== TokenType.closeParen) {
            actualParams.push(this.expr());
        }

        while (this.currentToken.type === TokenType.comma) {
            this.eat(TokenType.comma);
            actualParams.push(this.expr());
        }

        const end: number = this.currentToken.end;
        try {
            this.eat(TokenType.closeParen);
        }
        catch (err) {
            iserror = true;
        }
        
        return {
            errors: iserror,
            value: new FunctionCall(funcName, actualParams, token, new Offrange(token.start, end))
        };
    }

    private classCall(): INodeResult<IMethodCall|IPropertCall> {
        let classref: Token[] = [this.currentToken];

        this.eat(TokenType.id);
        this.eat(TokenType.dot);
        while (this.currentToken.type === TokenType.id && this.tokenizer.currChar === '.') {
            classref.push(this.currentToken);
            this.eat(TokenType.id);
            this.eat(TokenType.dot);
        }

        let token = this.currentToken;
        if (this.currentToken.type === TokenType.id) {
            if (this.tokenizer.currChar === '(') {
                let callNode = this.funcCall();
                callNode.value.offrange.start = classref[0].start;
                return {
                    errors: callNode.errors,
                    value: new MethodCall(callNode.value.name, 
                                callNode.value.actualParams, 
                                callNode.value.token, 
                                classref, 
                                callNode.value.offrange)
                };
            } 
            this.eat(TokenType.id);
            return {
                errors: false,
                value: new PropertCall(token.content, 
                                       token, 
                                       classref, 
                                       new Offrange(classref[0].start, token.end))
            };
        }
        return {
            errors: true,
            value: new PropertCall(this.currentToken.content, 
                                   this.currentToken, 
                                   classref, 
                                   new Offrange(classref[0].start, token.end))
        };

    }

    public statement() {
        // let node: any;
        // Start at first id
        while (this.currentToken.type !== TokenType.id
               && this.currentToken.type !== TokenType.command) {
            if (this.currentToken.type === TokenType.EOF) {
                return undefined;
            }
            this.eat(this.currentToken.type);
        }
        switch (this.currentToken.type) {
            case TokenType.id:
                if (this.tokenizer.currChar === '(') {
                    return this.funcCall();
                } 
                else if (this.tokenizer.currChar === '.') {
                    let left = this.classCall();
                    if (left.value instanceof PropertCall && 
                        this.inType(this.currentToken.type, 
                        [
                            TokenType.equal,
                            TokenType.aassign
                        ])) {

                        let token = this.currentToken;
                        this.eat(this.currentToken.type);
                        let exprNode = this.expr();
                        return {
                            errors: false,
                            value: {
                                left: left,
                                operator: token,
                                right: exprNode,
                                offrange: new Offrange(left.value.offrange.start, exprNode.value.offrange.end)
                            }
                        };
                    }
                    return left;
                }
                else {
                    return this.assignment();
                }
            case TokenType.command:
                return this.commandCall();
            // default:
            //     return []
            //     break;
        }
    }
}