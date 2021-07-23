import { Tokenizer } from "./tokenizer";
import { Atom, IExpr, IStmt, SuffixTermTrailer, Token } from "./types";
import { TokenType } from "./tokenTypes";
import {
    INodeResult,
    IParseError,
} from "./types";
import { ParseError } from './models/parseError';
import * as Stmt from './models/stmt';
import * as Expr from './models/expr';
import * as SuffixTerm from './models/suffixterm';
import { Precedences, UnaryPrecedence } from './models/precedences';
import { nodeResult } from './utils/parseResult';
import * as Decl from './models/declaration';

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
            // AHK connect next line to current line
            // when next line start with operators and ','
            if (this.currentToken.type === TokenType.EOL) {
                const saveToken = this.currentToken;
                this.currentToken = this.tokenizer.GetNextToken();
                // 下一行是运算符或者','时丢弃EOL
                // discard EOL
                if (this.currentToken.type >= TokenType.pplus &&
                    this.currentToken.type <= TokenType.comma) {
                    this.tokens.push(this.currentToken);
                }
                else {
                    this.tokens.push(saveToken);
                    this.tokens.push(this.currentToken);
                    this.currentToken = saveToken;
                }
            }
            else 
                this.tokens.push(this.currentToken);
        }
        return this
    }

    private previous() {
        return this.tokens[this.pos-1];
    }

    /**
     * look ahead one token
     */
    private peek(): Token {
        if (this.pos+1 <=  this.tokens.length-1) 
            return this.tokens[this.pos+1];
        
        let token = this.tokenizer.GetNextToken();

        if (token.type === TokenType.EOL) {
            const saveToken = token;
            token = this.tokenizer.GetNextToken();
            
            if (token.type >= TokenType.pplus &&
                token.type <= TokenType.comma) {
                this.tokens.push(token);
                return token;
            }
            this.tokens.push(saveToken);
            this.tokens.push(token);
            return saveToken;
        }
        return token;
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
            // case TokenType.else:
            //     return this.elseStmt();
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
                    return this.varDecl();
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

    private varDecl(): INodeResult<Decl.VarDecl> {
        const scope = this.currentToken;
        const assign: Decl.OptionalAssginStmt[] = [];
        const errors: ParseError[] = [];
        this.advance();
        // check if there are varible,
        // if any parse them all
        do {
            // TODO: Deal with errors 
            // when second declaration contains no identifer
            if (this.currentToken.type === TokenType.id) {
                let id = this.currentToken;
                this.advance();
                const saveToken = this.currentToken;

                // check if there is an assignment
                if (saveToken.type === TokenType.aassign ||
                    saveToken.type === TokenType.equal) {
                    this.advance();
                    const expr = this.expression();
                    errors.push(...expr.errors);
                    assign.push(new Decl.OptionalAssginStmt(
                        id, saveToken, expr.value
                    ))
                }
                else
                    assign.push(new Decl.OptionalAssginStmt(id));
                
            }
            else {
                // Generate error when no varible is found
                errors.push(this.error(
                    this.currentToken,
                    'Expect an identifer in varible declaration'
                ));
                // Generate Invalid Mark
                assign.push(new Decl.OptionalAssginStmt(
                    this.currentToken,
                    undefined,
                    new Expr.Invalid(
                        this.currentToken.start,
                        [this.currentToken]
                    ))
                );
            }
        } while (this.eatDiscardCR(TokenType.comma))

        return nodeResult(
            new Decl.VarDecl(scope, assign),
            errors
        );
    }

    // assignment statemnet
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

    // for test expresion
    public testExpr(): INodeResult<Expr.Expr> {
        return this.expression();
    }

    private expression(p: number = 0): INodeResult<Expr.Expr> {
        let start = this.pos;
        let result: INodeResult<Expr.Expr>;
                    
        try {
            switch (this.currentToken.type) {
                // all Unary operator
                case TokenType.plus:
                case TokenType.minus:
                case TokenType.and:
                case TokenType.multi:
                case TokenType.not:
                case TokenType.bnot:
                case TokenType.pplus:
                case TokenType.mminus:
                    const saveToken = this.currentToken;
                    this.advance();
                    const q = (saveToken.type >= TokenType.pplus && 
                               saveToken.type <= TokenType.mminus) ?
                              Precedences[TokenType.pplus] :
                              UnaryPrecedence;
                    const expr = this.expression(q);
                    result = nodeResult(
                        new Expr.Unary(saveToken, expr.value),
                            expr.errors);
                    break;
                case TokenType.openParen:
                    // TODO: Process paren expression
                    let OPar = this.currentToken;
                    this.advance();
                    result = this.expression();
                    let CPar = this.currentToken;
                    this.advance();
                    break;
                case TokenType.number:
                case TokenType.string:
                case TokenType.openBrace:
                case TokenType.openBracket:
                case TokenType.id:
                case TokenType.precent:
                    // TODO: process array, dict, and precent expression
                    result = this.factor();
                    break;
                default:
                    throw this.error(
                        this.currentToken,
                        'Expect an experssion'
                    );
            }

            // pratt parse
            while (true) {

                // infix left-associative 
                if ((this.currentToken.type >= TokenType.power &&
                     this.currentToken.type <= TokenType.logicor) && 
                     Precedences[this.currentToken.type] >= p) {
                    const saveToken = this.currentToken;
                    this.advance();
                    const q = Precedences[saveToken.type];
                    const right = this.expression(q + 1);
                    result = nodeResult(
                        new Expr.Binary(
                            result.value,
                            saveToken,
                            right.value
                        ),
                        result.errors.concat(right.errors)
                    );
                    continue;
                }

                // postfix
                if ((this.currentToken.type >= TokenType.pplus &&
                     this.currentToken.type <= TokenType.mminus) && 
                     Precedences[this.currentToken.type] >= p) {
                    const saveToken = this.currentToken;
                    this.advance();
                    const q = Precedences[saveToken.type];
                    result = nodeResult(
                        new Expr.Unary(
                            saveToken,
                            result.value
                        ),
                        result.errors
                    );
                    continue;
                }

                // infix and ternary, right-associative 
                if ((this.currentToken.type >= TokenType.question &&
                     this.currentToken.type <= TokenType.lshifteq) &&
                     Precedences[this.currentToken.type] >= p) {
                    const saveToken = this.currentToken;
                    this.advance();
                    const q = Precedences[saveToken.type];

                    // ternary expression
                    if (saveToken.type === TokenType.question) {
                        // This expression has no relation 
                        // with next expressions. Thus, 0 precedence
                        const trueExpr = this.expression();
                        const colon = this.eatAndThrow(
                            TokenType.colon,
                            'Expect a ":" in ternary expression'
                        );
                        // right-associative 
                        const falseExpr = this.expression(q);
                        result = nodeResult(
                            new Expr.Ternary(
                                result.value,
                                saveToken,
                                trueExpr.value,
                                colon,
                                falseExpr.value
                            ),
                            result.errors
                            .concat(trueExpr.errors)
                            .concat(falseExpr.errors)
                        );
                    }
                    // other assignments
                    else {
                        // right-associative 
                        const right = this.expression(q);
                        result = nodeResult(
                            new Expr.Binary(
                                result.value,
                                saveToken,
                                right.value
                            ),
                            result.errors.concat(right.errors)
                        );
                    }
                    continue;
                }

                // Implicit connect
                if ((this.currentToken.type >= TokenType.number &&
                     this.currentToken.type <= TokenType.precent) &&
                     Precedences[TokenType.sconnect] >= p) {
                    const right = this.expression(Precedences[TokenType.sconnect]+1);
                    result = nodeResult(
                        new Expr.Binary(
                            result.value,
                            new Token(TokenType.implconn, ' ', 
                                result.value.end,
                                right.value.start),
                            right.value
                        ),
                        result.errors.concat(right.errors)
                    );
                    continue;
                }

                break;
            }
               
            return result;
        }
        catch (error) {
            if (error instanceof ParseError) {
                // this.logger.verbose(JSON.stringify(error.partial));
                // this.synchronize(error.failed);

                // TODO: Correct error token list
                const tokens = this.tokens[start];

                return {
                    errors: [error],
                    value: new Expr.Invalid(
                        tokens.start,
                        [tokens]
                    ),
                };
            }

            throw error;
        }
    }

    private factor(): INodeResult<Expr.Factor> {
        const suffixTerm = this.suffixTerm();
        const factor = new Expr.Factor(suffixTerm.value);
        const errors = suffixTerm.errors;

        // check is if factor has a suffix
        if (this.currentToken.type === TokenType.dot) {
            // create first suffix for connecting all suffix togther
            // TODO: Why use linked list here?
            // Is linked list more efficient than Array?
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
        const atom = this.atom(isTailor);
        const trailers: SuffixTermTrailer[] = [];
        const errors: ParseError[] = [...atom.errors];

        const isValid = !(atom.value instanceof SuffixTerm.Invalid);

        // parse all exist trailor  
        while (isValid) {
            if (this.currentToken.type === TokenType.openBracket) {
                const bracket = this.arrayBracket();
                errors.push(...bracket.errors);
                trailers.push(bracket.value);
            }
            else if (this.currentToken.type === TokenType.openParen) {
                const callTrailer = this.funcCallTrailer();
                errors.push(...callTrailer.errors);
                trailers.push(callTrailer.value);
            }
            else 
                break;
        }
        
        return nodeResult(
            new SuffixTerm.SuffixTerm(atom.value, trailers),
            errors
        );
    }

    private atom(isTailor: boolean = false): INodeResult<Atom> {
        switch (this.currentToken.type) {
            // TODO: All keywords is allowed in suffix.
            // But not allowed at first atom
            case TokenType.id:
                this.advance();
                return nodeResult(new SuffixTerm.Identifier(this.previous()), []);
            case TokenType.number:
            case TokenType.string:
                let t = this.currentToken;
                this.advance();
                return nodeResult(new SuffixTerm.Literal(t), []);
            case TokenType.precent:
                // TODO: Finish precent deference expresion
                let open = this.currentToken;
                this.advance();
                let derefAtom = this.atom();
                const errors = derefAtom.errors;
                if (this.currentToken.type === TokenType.precent) {
                    this.advance();
                    return nodeResult(derefAtom.value, errors);
                }
                else 
                    throw this.error(
                        this.currentToken,
                        'Expect "%" in precent expression'
                    );
            case TokenType.openBracket:
                return this.arrayTerm();
            case TokenType.openBrace:
                return this.associativeArray();
            default:
                if (isTailor) {
                    const previous = this.previous();

                    return nodeResult(new SuffixTerm.Invalid(previous.end), [
                        this.error(previous, 'Expected suffix')
                    ]);
                }

                throw this.error(this.currentToken, 'Expected an expression');
        }
    }

    private arrayTerm(): INodeResult<SuffixTerm.ArrayTerm> {
        const open = this.currentToken;
        this.advance();
        const items: IExpr[] = [];
        const errors: ParseError[] = [];

        // if there are items parse them all
        if (this.currentToken.type !== TokenType.closeBracket && 
            this.currentToken.type !== TokenType.EOF) {
            let a = this.expression();
            items.push(a.value);
            errors.push(...a.errors);
            while (this.eatDiscardCR(TokenType.comma)) {
                a = this.expression();
                items.push(a.value);
                errors.push(...a.errors);
            }
        }

        const close = this.eatAndThrow(
            TokenType.closeBracket,
            'Expect a "]" to end array'
        );

        return nodeResult(
            new SuffixTerm.ArrayTerm(open, close, items),
            errors
        );
    }

    private associativeArray(): INodeResult<SuffixTerm.AssociativeArray> {
        const open = this.currentToken;
        this.advance();
        const pairs: SuffixTerm.Pair[] = [];
        const errors: ParseError[] = [];

        // if there are pairs parse them all
        if (this.currentToken.type !== TokenType.closeBracket && 
            this.currentToken.type !== TokenType.EOF) {
            do {
                let a = this.pair();
                pairs.push(a.value);
                errors.push(...a.errors);
            } while (this.eatDiscardCR(TokenType.comma))
        }

        const close = this.eatAndThrow(
            TokenType.closeBrace,
            'Expect a "}" at the end of associative array'
        )

        return nodeResult(
            new SuffixTerm.AssociativeArray(open, close, pairs),
            errors
        );
    }

    private pair(): INodeResult<SuffixTerm.Pair> {
        const key = this.expression();
        const errors = key.errors;
        if (this.eatDiscardCR(TokenType.colon)) {
            const colon = this.previous();
            const value = this.expression();
            errors.push(...value.errors);
            return nodeResult(
                new SuffixTerm.Pair(key.value, colon, value.value),
                errors
            );
        }

        // if no colon, generate an error
        // and contiune parsing rest of dict
        errors.push(this.error(
            this.currentToken,
            'Expect a ":" on key-value pairs in associative array'
        ));
        return nodeResult(
            new SuffixTerm.Pair(
                key.value,
                this.currentToken,
                new Expr.Invalid(this.currentToken.start, [this.currentToken])
            ),
            errors
        );
    }

    private arrayBracket(): INodeResult<SuffixTerm.BracketIndex> {
        const open = this.currentToken;
        this.advance();
        const index = this.expression();
        const close = this.eatAndThrow(
            TokenType.closeBracket,
            'Expected a "]" at end of array index '); 
        
        return nodeResult(
            new SuffixTerm.BracketIndex(open, index.value, close),
            index.errors
        );
    }

    private funcCallTrailer(): INodeResult<SuffixTerm.Call> {
        const open = this.currentToken;
        this.advance();
        const args: IExpr[] = [];
        const errors: ParseError[] = [];

        // if there are arguments parse them all
        if (this.currentToken.type !== TokenType.closeParen && 
            this.currentToken.type !== TokenType.EOF) {
            let a = this.expression();
            args.push(a.value);
            errors.push(...a.errors);
            while (this.eatDiscardCR(TokenType.comma)) {
                a = this.expression();
                args.push(a.value);
                errors.push(...a.errors);
            }
        }
        const close = this.eatAndThrow(
            TokenType.closeParen,
            'Expected a ")" at end of call'
        );
        return nodeResult(
            new SuffixTerm.Call(open, args, close),
            errors
        ); 
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

    /**
     * check if token match type,
     * and when token is return 
     * check next token 
     */
    private eatDiscardCR(t: TokenType): boolean {
        if (this.currentToken.type === TokenType.return) {
            if (this.check(this.peek().type)) {
                this.advance().advance();
                return true;
            }
        }
        else if (this.check(t)) {
            this.advance();
            return true;
        }
        return false;
    }

    private check(t: TokenType): boolean {
        return t === this.currentToken.type;
    }

    private eatAndThrow(t: TokenType, message: string) {
        if (this.currentToken.type === t) {
            this.advance();
            return this.previous();
        }
        else 
            throw this.error(this.currentToken, message);
    }

    // private matchToken(t: TokenType): 


}