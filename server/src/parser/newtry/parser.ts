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
        this.currentToken = this.tokenizer.GetNextToken(TokenType.EOL);
        this.tokens.push(this.currentToken);
    }

    private advance() {
        this.pos++;
        if (this.pos >= this.tokens.length) {
            this.currentToken = this.tokenizer.GetNextToken(this.previous().type);
            // AHK connect next line to current line
            // when next line start with operators and ','
            if (this.currentToken.type === TokenType.EOL) {
                const saveToken = this.currentToken;
                this.currentToken = this.tokenizer.GetNextToken(saveToken.type);
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
        return this.tokens[this.pos - 1];
    }

    /**
     * look ahead one token
     */
    private peek(): Token {
        if (this.pos + 1 <= this.tokens.length - 1)
            return this.tokens[this.pos + 1];

        let token = this.tokenizer.GetNextToken(this.previous().type);

        if (token.type === TokenType.EOL) {
            const saveToken = token;
            token = this.tokenizer.GetNextToken(saveToken.type);

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

    public testDeclaration(): INodeResult<Stmt.Stmt> {
        return this.declaration();
    }

    private declaration(): INodeResult<Stmt.Stmt> {
        const start = this.pos;
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
                case TokenType.label:
                    return this.label();
                case TokenType.key:
                // 所有热键的修饰符
                // case TokenType.sharp:
                // case TokenType.not:
                // case TokenType.xor:
                // case TokenType.plus:
                // case TokenType.less:
                // case TokenType.greater:
                // case TokenType.multi:
                // case TokenType.bnot:
                // case TokenType.dollar:
                    return this.hotkey();
                default:
                    return this.statement();
            }
        }
        catch (error) {
            if (error instanceof ParseError) {
                this.synchronize();
                const tokens = this.tokens.slice(start, this.pos);
                tokens.push(this.currentToken);

                return nodeResult(
                    new Stmt.Invalid(
                        tokens[0].start,
                        tokens
                    ),
                    [error]
                );
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

        this.terminal();

        return nodeResult(
            new Decl.VarDecl(scope, assign),
            errors
        );
    }

    private label(): INodeResult<Decl.Label> {
        const name = this.currentToken;
        this.advance();
        return nodeResult(new Decl.Label(name), []);
    }

    private hotkey(): INodeResult<Decl.Hotkey> {
        const k1 = this.getKey();
        if (this.currentToken.type === TokenType.hotkeyand) {
            const and = this.currentToken;
            this.advance();
            const k2 = this.getKey();
            return nodeResult(new Decl.Hotkey(k1.value, and, k2.value), 
                              k1.errors.concat(k2.errors));
        }
        return nodeResult(new Decl.Hotkey(k1.value), k1.errors);
    }

    // get hotkey and its modifiers
    private getKey(): INodeResult<Decl.Key> {
        const prefix: Token[] = [this.currentToken];
        this.advance();
        // get all prefix modifiers
        while(this.currentToken.type !== TokenType.hotkey &&
              this.currentToken.type !== TokenType.hotkeyand &&
              this.currentToken.type !== TokenType.EOF) {
            prefix.push(this.currentToken);
            this.advance();
        }

        if (prefix.length === 0) {
            // TODO: 更好地处理热键不正确的情况
            return nodeResult(
                new Decl.Key(this.currentToken),
                [this.error(
                    this.currentToken,
                    'Expect a valid hotkey'
                )]
            )
        }

        return nodeResult(
            new Decl.Key(
                prefix[prefix.length-1], 
                prefix.slice(0, -1)
            ), []
        );
    }

    private statement(): INodeResult<Stmt.Stmt> {
        switch (this.currentToken.type) {
            case TokenType.id:
                return this.idLeadStatement();
            case TokenType.openBrace:
                return this.block();
            // case TokenType.command:
            //     return this.command();
            case TokenType.if:
                return this.ifStmt();
            case TokenType.break:
                return this.breakStmt();
            case TokenType.return:
                return this.returnStmt();
            // case TokenType.switch:
            //     return this.switchStmt();
            case TokenType.loop:
                return this.loopStmt();
            case TokenType.while:
                return this.whileStmt();
            case TokenType.try:
                return this.tryStmt();
            // case TokenType.drective:
            //     return this.drective();
            default:
                throw this.error(
                    this.currentToken,
                    'UnKnown statment found');
        }
    }

    private idLeadStatement(): INodeResult<Stmt.Stmt> {
        const p = this.peek()
        switch (p.type) {
            // case TokenType.openParen:
            //     return this.func();
            case TokenType.equal:
            case TokenType.aassign:
                // expression is only allowed in assignment in AHK
                return this.assign();
            case TokenType.hotkeyand:
            case TokenType.hotkey:
                return this.hotkey();
            // 其他是语法错误，统一当作有错误的赋值语句
            default:
                throw this.error(p,
                    'Invalid follower(s) of identifer')
        }
    }

    private block(): INodeResult<Stmt.Block> {
        const open = this.currentToken;
        const errors: ParseError[] = [];
        this.advance();
        const block: Stmt.Stmt[] = [];
        while (this.currentToken.type !== TokenType.closeBrace &&
            this.currentToken.type !== TokenType.EOF) {
            const stmt = this.declaration();
            errors.push(...stmt.errors);
            block.push(stmt.value);
        }
        const close = this.eatAndThrow(
            TokenType.closeBrace,
            'Expect a "}" at block end'
        );

        return nodeResult(
            new Stmt.Block(open, block, close),
            errors
        );
    }

    private ifStmt(): INodeResult<Stmt.If> {
        const iftoken = this.currentToken;
        this.advance();
        const errors: ParseError[] = [];
        const condition = this.expression();
        errors.push(...condition.errors);
        // skip all EOL
        this.jumpWhiteSpace();
        const body = this.declaration();
        errors.push(...body.errors);

        // parse else branch if found else
        if (this.currentToken.type === TokenType.else) {
            const elsetoken = this.currentToken;
            this.advance()
            const body = this.block();
            errors.push(...body.errors);
            return nodeResult(
                new Stmt.If(
                    iftoken,
                    condition.value,
                    body.value,
                    new Stmt.Else(
                        elsetoken,
                        body.value
                    )
                ),
                errors
            );
        }

        return nodeResult(
            new Stmt.If(
                iftoken,
                condition.value,
                body.value
            ),
            errors
        );
    }

    private breakStmt(): INodeResult<Stmt.Break> {
        const breakToken = this.currentToken;
        this.advance();

        // If there are break label, parse it
        if (!this.atLineEnd()) {
            
            // ',' is negotiable
            this.eatDiscardCR(TokenType.comma);
            const label = this.eatAndThrow(
                TokenType.id,
                'Expect a label name'
            );
            this.terminal();
            return nodeResult(
                new Stmt.Break(breakToken, label),
                []
            );
        }

        this.terminal();
        return nodeResult(new Stmt.Break(breakToken), []);
    }

    private returnStmt(): INodeResult<Stmt.Return> {
        const returnToken = this.currentToken;
        
        // If expersions parse all
        if (!this.atLineEnd()) {
            // ',' is negotiable
            this.eatDiscardCR(TokenType.comma);
            const expr = this.expression();
            this.terminal()
            return nodeResult(
                new Stmt.Return(returnToken, expr.value),
                expr.errors
            );
        }
        this.terminal();
        return nodeResult(new Stmt.Return(returnToken), []);
    }

    // private switchStmt(): INodeResult<IASTNode> {

    // }

    private loopStmt(): INodeResult<Stmt.LoopStmt> {
        const loop = this.currentToken;
        this.advance();

        // if no expression follows is a until loop
        if (this.matchTokens([
            TokenType.EOL,
            TokenType.openBrace
        ])) {
            this.jumpWhiteSpace();
            const body = this.declaration();
            const until = this.eatAndThrow(
                TokenType.until,
                'Expect a until in loop-until'
            );
            const cond = this.expression();
            this.terminal();
            return nodeResult(
                new Stmt.UntilLoop(loop, body.value, 
                    until, cond.value),
                body.errors.concat(cond.errors)
            );
        }

        const cond = this.expression();
        this.jumpWhiteSpace();
        const body = this.declaration();
        return nodeResult(
            new Stmt.Loop(loop, cond.value, body.value),
            cond.errors.concat(body.errors)
        );
    }

    private whileStmt(): INodeResult<Stmt.WhileStmt> {
        const whileToken = this.currentToken;
        this.advance();
        const cond = this.expression();
        // skip all EOL
        this.jumpWhiteSpace();
        const body = this.declaration();

        return nodeResult(
            new Stmt.WhileStmt(whileToken, cond.value, body.value),
            cond.errors.concat(body.errors)
        );
    }

    private tryStmt(): INodeResult<Stmt.TryStmt> {
        const tryToken = this.currentToken;
        this.advance();
        this.jumpWhiteSpace();
        const body = this.declaration();
        const errors = body.errors;
        let catchStmt: Maybe<Stmt.CatchStmt>;
        let finallyStmt: Maybe<Stmt.FinallyStmt>;

        if (this.currentToken.type === TokenType.catch) {
            const catchToken = this.currentToken;
            this.advance();
            const errorExpr = this.expression();
            this.jumpWhiteSpace();
            const body = this.declaration();
            errors.push(...errorExpr.errors);
            errors.push(...body.errors);
            catchStmt = new Stmt.CatchStmt(
                catchToken, errorExpr.value, body.value
            );
        }

        if (this.currentToken.type === TokenType.finally) {
            const finallyToken = this.currentToken;
            this.advance();
            this.jumpWhiteSpace();
            const body = this.declaration();
            errors.push(...body.errors);
            finallyStmt = new Stmt.FinallyStmt(finallyToken, body.value);
        }

        return nodeResult(
            new Stmt.TryStmt(tryToken, body.value, catchStmt, finallyStmt),
            errors
        );
    }

    // private drective(): INodeResult<IASTNode> {

    // }

    // assignment statemnet
    private assign(): INodeResult<Stmt.AssignStmt> {
        const id = this.currentToken;
        this.advance();
        const assign = this.currentToken;
        this.advance();
        const expr = this.expression();
        this.terminal();
        return {
            errors: expr.errors,
            value: new Stmt.AssignStmt(id, assign, expr.value)
        };

    }

    // for test expresion
    public testExpr(): INodeResult<Expr.Expr> {
        this.tokens.pop();
        this.tokenizer.Reset();
        this.tokenizer.isParseHotkey = false;
        this.currentToken = this.tokenizer.GetNextToken(TokenType.EOL);
        this.tokens.push(this.currentToken);
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
                    const right = this.expression(Precedences[TokenType.sconnect] + 1);
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
                this.synchronize();

                // TODO: Correct error token list
                const tokens = this.tokens.slice(start, this.pos);
                tokens.push(this.currentToken);

                return nodeResult(
                    new Expr.Invalid(
                        tokens[0].start,
                        tokens
                    ),
                    [error]
                );
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

    // private command(): INodeResult<ICommandCall> {

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
     * Check the the statement is terminated
     */
    private terminal() {
        if (this.currentToken.type !== TokenType.EOF)
            this.eatAndThrow(
                TokenType.EOL,
                'Expect "`n" to terminate statement'
            );
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

    /**
     * check if current token matches a set of tokens
     * @param ts match types array 
     */
    private matchTokens(ts: TokenType[]): boolean {
        if (this.currentToken.type === TokenType.EOF) return false;
        for (const t of ts) {
            if (t === this.currentToken.type)
                return true;
        }
        return false;
    }

    private jumpWhiteSpace() {
        while (this.currentToken.type === TokenType.EOL)
            this.advance();
    }

    private atLineEnd(): boolean {
        return this.currentToken.type === TokenType.EOL ||
               this.currentToken.type === TokenType.EOF;
    }

    // attempt to synchronize parser
    private synchronize(): void {
        // need to confirm this is the only case
        // if (empty(failed.stmt)) {
        //   this.advance();
        // }

        while (this.currentToken.type !== TokenType.EOF) {
            switch (this.peek().type) {
                // declarations
                case TokenType.local:
                case TokenType.global:
                case TokenType.static:
                case TokenType.class:

                // commands
                case TokenType.command:

                // control flow
                case TokenType.if:
                case TokenType.loop:
                case TokenType.while:
                case TokenType.until:
                case TokenType.return:
                case TokenType.break:
                case TokenType.switch:
                case TokenType.for:
                case TokenType.try:
                case TokenType.throw:
                
                // drective
                case TokenType.drective:

                // close scope
                case TokenType.closeBrace:
                    return;
                
                // end of line
                // 开始解析下一句
                case TokenType.EOL:
                    this.advance();
                    return;
                default:
                    break;
            }

            this.advance();
        }
    }

}