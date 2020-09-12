/**
 * Generate a parse stack of parsing process,
 * not for a real parser.
 * But, for language server providers.
 * Only parse a line.
 */

import { 
    Tokenizer,
    TokenType,
    Token
} from "./tokenizer";
import { throws } from 'assert';
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
    Expr
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

    reset(document: string) {
        this.tokenizer.Reset(document);
        return this;
    }

    eat(type: TokenType) {
        if (type === this.currentToken.type) {
            this.currentToken = this.tokenizer.GetNextToken();
        } 
        else {
            throw new Error("Unexpect Token");
        }
    }

    variable(): INodeResult<IVariable> {
        let token = this.currentToken;
        this.eat(TokenType.id);
        return {
            errors: false,
            value: {
                name: token.content,
                token: token,
                offrange: new Offrange(token.offset, token.offset)
            }
        };
    }

    literal(): INodeResult<ILiteral> {
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
                offrange: new Offrange(token.offset, token.offset)
            }
        };
    }

    // For this is simple parser, we don't care about operator level
    factor() {
        let token = this.currentToken
        let node: Expr;
        if (this.currentToken.type === TokenType.string ||
                 this.currentToken.type === TokenType.number) {
            node = this.literal();
        }
        else if (this.currentToken.type === TokenType.unknown) {
            this.eat(TokenType.unknown);
            node = {errors: false, value: {operator: token, left: this.expr(), offrange: new Offrange(token.offset, token.offset)}};
        }
        else if (this.currentToken.type === TokenType.openParen) {
            this.eat(TokenType.openParen);
            node = this.expr();
            this.eat(TokenType.closeParen);
        }
        else {
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
        }
        return node;
    }

    expr(): Expr {
        // while (this.currentToken.type !== TokenType.id && this.currentToken.type !== TokenType.comma) {
        //     this.eat(this.currentToken.type);
        // }
        try {
            let node = this.factor();
            
            while (this.currentToken.type === TokenType.unknown || 
                   this.currentToken.type === TokenType.dot || 
                   this.currentToken.type === TokenType.id) {
                let token = this.currentToken;
                if (this.currentToken.type === TokenType.unknown) {
                    this.eat(TokenType.unknown);
                } 
                else if (this.currentToken.type === TokenType.dot) {
                    this.eat(TokenType.dot);
                }
                // Implicit connection expression
                else {
                    token = {
                        content: '',
                        type: TokenType.unknown,
                        offset: this.currentToken.offset
                    }
                }
                return {
                    errors: false,
                    value: {
                        left: node,
                        operator: token,
                        right: this.factor(),
                        offrange: new Offrange(token.offset, token.offset)
                    }
                }
            }
            return {
                errors: node.errors,
                value: node.value
            };
        } 
        catch (err) {
            return {
                errors: true,
                value: {
                    offrange: new Offrange(this.currentToken.offset, this.currentToken.offset)
                }
            };
        }
    }

    assignment(): INodeResult<IAssign> {
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
        if (this.currentToken.type === TokenType.newkeyword) {
            this.eat(TokenType.newkeyword);
            // TODO: process class new statement
            // let classNewNode: INodeResult<IFunctionCall|IMethodCall|IPropertCall>
            // if (this.tokenizer.currChar === '(') {
            //     classNewNode = this.funcCall();
            // } 
            // else if (this.tokenizer.currChar === '.') {
            //     classNewNode = this.classCall();
            // }
            // else {
            //     isWrong = true;
            // }
        }
        let exprNode = this.expr();
        return {
            errors: isWrong,
            value: {
                left: left,
                operator: token,
                right: exprNode,
                offrange: new Offrange(token.offset, token.offset)
            }
        };

    }

    funcCall(): INodeResult<IFunctionCall> {
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

        try {
            this.eat(TokenType.closeParen);
        }
        catch (err) {
            iserror = true;
        }
        
        return {
            errors: iserror,
            value: new FunctionCall(funcName, actualParams, token, new Offrange(token.offset, token.offset))
        };
    }

    classCall(): INodeResult<IMethodCall|IPropertCall> {
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
                return {
                    errors: callNode.errors,
                    value: new MethodCall(callNode.value.name, 
                                callNode.value.actualParams, 
                                callNode.value.token, 
                                classref, 
                                callNode.value.offrange)
                };
            } 
            return {
                errors: false,
                value: new PropertCall(this.currentToken.content, 
                                       this.currentToken, 
                                       classref, 
                                       new Offrange(token.offset, token.offset))
            };
        }
        return {
            errors: true,
            value: new PropertCall(this.currentToken.content, 
                                   this.currentToken, 
                                   classref, 
                                   new Offrange(token.offset, token.offset))
        };

    }

    statement() {
        // let node: any;
        // Start at first id
        while (this.currentToken.type !== TokenType.id) {
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
                    return this.classCall();
                }
                else {
                    return this.assignment();
                }
                break;
        
            // default:
            //     return []
            //     break;
        }
    }
}