import { Tokenizer } from "./tokenizer";
import { IExpr, IStmt, Token } from "./types";
import { TokenType } from "./tokenTypes"
import {
    INodeResult,
    IParseError,
} from "./types"
import {
    IAssign,
    IBinOp,
    IFunctionCall,
    IMethodCall,
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
    NoOption,
    IAssociativeArray,
    IAPair,
    IArray,
    ICommandCall,
    CommandCall,
    IClassDecl,
    InvalidNode,
    IFunctionDecl,
    IParameter,
    FunctionDeclaration
} from "../asttypes";
import { ParseError } from './models/parseError';
import * as Stmt from './models/stmt';
import * as Expr from './models/expr';
import * as SuffixTerm from './models/suffixterm';
import { Precedences, UnaryPrecedence } from './models/precedences';
import { nodeResult } from './utils/parseResult';

export class AHKParser {
    private tokenizer: Tokenizer;
    private currentToken: Token;
    /**
     * list for storaging all tokens
     */
    private tokens: Token[] = [];
    private pos: number = 0;

    constructor(document: string) {
        this.tokenizer = new Tokenizer(document);
        this.currentToken = this.tokenizer.GetNextToken();
        this.tokens.push(this.currentToken);
    }

    private advance() {
        this.pos++;
        if (this.pos >= this.tokens.length) {
            this.currentToken = this.tokenizer.GetNextToken();
            this.tokens.push(this.currentToken)
        }
        return this
    }

    /**
     * return newest token of tokenizer
     */
    private peek(): Token {
        let token = this.tokenizer.GetNextToken();
        this.tokens.push(token);
        return token
    }

    private error(token: Token, message: string): ParseError {
        return new ParseError(
            token,
            message
        );
    }

    private statement(): INodeResult<IStmt> {
        switch (this.currentToken.type) {
            case TokenType.id:
                return this.idLeadStatement();
            // case TokenType.openBrace:
            //     return this.block();
            // case TokenType.command:
            //     return this.command();
            // case TokenType.if:
            //     return this.ifStmt();
            // case TokenType.break:
            //     return this.breakStmt();
            // case TokenType.return:
            //     return this.returnStmt();
            // case TokenType.switch:
            //     return this.switchStmt();
            // case TokenType.loop:
            //     return this.loopStmt();
            // case TokenType.while:
            //     return this.whileStmt();
            // case TokenType.try:
            //     return this.tryStmt();
            // case TokenType.drective:
            //     return this.drective();
            default:
                throw this.error(
                    this.currentToken,
                    'UnKnown statment found');
        }
    }

    // private block(): INodeResult<IASTNode> {

    // }

    // private ifStmt(): INodeResult<IASTNode> {

    // }

    // private breakStmt(): INodeResult<IASTNode> {

    // }

    // private returnStmt(): INodeResult<IASTNode> {

    // }

    // private switchStmt(): INodeResult<IASTNode> {

    // }

    // private loopStmt(): INodeResult<IASTNode> {

    // }

    // private whileStmt(): INodeResult<IASTNode> {

    // }

    // private tryStmt(): INodeResult<IASTNode> {

    // }

    // private drective(): INodeResult<IASTNode> {

    // }

    private idLeadStatement(): INodeResult<IStmt> {
        const p = this.peek()
        switch (p.type) {
            // case TokenType.openParen:
            //     return this.func();
            case TokenType.equal:
            case TokenType.aassign:
                // expression is only allowed in assignment in AHK
                return this.assign();
            // case TokenType.and:
            // case TokenType.hotkey:
            //     return this.hotkey();
            // case TokenType.colon:
            //     return this.label();
            // 其他是语法错误，统一当作有错误的赋值语句
            default:
                throw this.error(p,
                    'Invalid follower(s) of identifer')
        }
    }

    declaration(): INodeResult<IStmt> {
        try {
            switch (this.currentToken.type) {
                case TokenType.id:
                    return this.idLeadStatement();
                // case TokenType.class:
                //     return this.classDecl();
                case TokenType.global:
                case TokenType.local:
                case TokenType.static:
                    return this.assign();
                // !|^|# 开始的热键
                // case TokenType.not:
                // case TokenType.xor:
                // case TokenType.sharp:
                //     return this.hotkey();
                default:
                    return this.statement();
            }
        }
        catch (error) {
            if (error instanceof ParseError) {

                return {
                    errors: [error],
                    value: new Stmt.Invalid(
                        this.currentToken.end,
                        [this.currentToken]
                    )
                };
            }
            throw error;
        }
    }

    private assign(): INodeResult<Stmt.AssignStmt> {
        let id = this.currentToken;
        this.advance();
        let assign = this.currentToken;
        this.advance();
        let expr = this.expression();
        return {
            errors: expr.errors,
            value: new Stmt.AssignStmt(id, assign, expr.value)
        };

    }

    private expression(p: number = 0): INodeResult<Expr.Expr> {
        let start = this.pos;
        let expr: INodeResult<Expr.Expr>;
        let left: INodeResult<Expr.Expr>;
        let right: Maybe<INodeResult<Expr.Expr>>;
        let saveToken1: Token;
        try {
            switch (this.currentToken.type) {
                // all Unary operator
                case TokenType.plus:
                case TokenType.minus:
                case TokenType.and:
                case TokenType.multi:
                case TokenType.not:
                case TokenType.bnot:
                    let saveToken = this.currentToken;
                    this.advance();
                    expr = this.expression(UnaryPrecedence);
                    return {
                        errors: expr.errors,
                        value: new Expr.Unary(saveToken, expr.value)
                    };
                case TokenType.openParen:
                    // TODO: Process paren expression
                    let OPar = this.currentToken;
                    this.advance();
                    left = this.expression();
                    let CPar = this.currentToken;
                    this.advance();
                    break;
                case TokenType.number:
                case TokenType.openBrace:
                case TokenType.openBracket:
                case TokenType.id:
                case TokenType.precent:
                    left = this.factor();
                    break;
                default:
                    throw this.error(
                        this.currentToken,
                        'Expect an experssion'
                    );
            }

            // pratt parse
            saveToken1 = this.currentToken;
            while ((this.currentToken.type >= TokenType.pplus &&
                    this.currentToken.type <= TokenType.lshifteq) && 
                    Precedences[this.currentToken.type] >= p) {
                this.advance();
                let q = Precedences[saveToken1.type];
                right = this.expression(q + 1);
            }

            if (right === undefined) 
                return {
                    errors: left.errors,
                    value: left.value
                };
                
            return {
            errors: left.errors.concat(right.errors),
            value: new Expr.Binary(
                left.value, 
                saveToken1, 
                right.value)
            };
        }
        catch (error) {
            if (error instanceof ParseError) {
                // this.logger.verbose(JSON.stringify(error.partial));
                // this.synchronize(error.failed);

                const tokens = this.tokens.slice(start, this.pos);

                return {
                    errors: [error],
                    value: new Expr.Invalid(
                        tokens[0].start,
                        tokens
                    ),
                };
            }

            throw error;
        }
    }

    private factor(): INodeResult<Expr.factor> {
        const suffixTerm = this.suffixTerm();
        const factor = new Expr.factor(suffixTerm.value);
        const errors = suffixTerm.errors;

        // check is if factor has a suffix
        if (this.currentToken.type === TokenType.dot) {
            // create first suffix for connecting all suffix togther
            // TODO: Why use linked list here?
            // Is linked list is more efficient than Array?
            let dot = this.currentToken;
            this.advance();
            let suffixTerm = this.suffixTerm(true);
            errors.push(...suffixTerm.errors);

            // link suffix to factor with trailer
            let trailer = new SuffixTerm.SuffixTrailer(suffixTerm.value);
            factor.dot = dot;
            factor.trailer = trailer;
            let current = trailer;

            // parse down and link all while is suffix
            while (this.currentToken.type === TokenType.dot) {
                let dot = this.currentToken;
                this.advance();
                let suffixTerm = this.suffixTerm(true);
                errors.push(...suffixTerm.errors);

                let trailer = new SuffixTerm.SuffixTrailer(suffixTerm.value);
                current.dot = dot;
                current.trailer = trailer;
            }
        }
        return nodeResult(factor, errors);
    }

    private suffixTerm(isTailor: boolean = false): INodeResult<SuffixTerm.SuffixTerm> {

    }

    

    // private func(): INodeResult<IFunctionCall|FunctionDeclaration> {
    //     let token = this.currentToken
    //     this.advance();
    //     let unclosed: number = 1;
    //     while (unclosed <= 0) {
    //         let t = this.peek().type
    //         if (t === TokenType.closeParen)
    //             unclosed--;
    //         if (t === TokenType.openParen) 
    //             unclosed++;
    //     }

    //     if (this.peek().type === TokenType.openBrace) {
    //         let parameters = this.parameters();
    //         let block = this.block();
    //         let errors = parameters.errors.concat(block.errors);
    //         return {
    //             errors: errors,
    //             value: new FunctionDeclaration(
    //                 token.content,
    //                 parameters.value,
    //                 block.value,
    //                 token
    //             )
    //         };
    //     }
    //     let actualParams = this.actualParams();
    //     return {
    //         errors: actualParams.errors,
    //         value: new FunctionCall(
    //             token.content,
    //             actualParams.value,
    //             token,
    //             {
    //                 start: token.start,
    //                 end: token.end
    //             }
    //         )
    //     };
    // }

    // private parameters(): INodeResult<IParameter[]> {

    // }

    // private actualParams(): INodeResult<Expr[]> {

    // }

    // private command(): INodeResult<ICommandCall> {

    // }

    // private assign(): INodeResult<IAssign> {

    // }

    // private hotkey(): INodeResult<IASTNode> {

    // }

    // private label(): INodeResult<IASTNode> {

    // }

    // private classDecl(): INodeResult<IClassDecl> {

    // }

    program() {
        const statment: IStmt[] = [];
        const diagnostics: IParseError[] = [];
        try {
            while (this.currentToken.type !== TokenType.EOF) {
                let { errors, value } = this.declaration();
                statment.push(value);
                diagnostics.push(...errors);
            }
        }
        catch (error) {
            console.error(error);
        }
    }

    private check(t: TokenType): boolean {
        return t === this.currentToken.type;
    }

    // private matchToken(t: TokenType): 


}