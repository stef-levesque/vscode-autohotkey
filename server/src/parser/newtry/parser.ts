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

    // private nextToken(): Token {
    //     try {
    //         return this.tokenizer.GetNextToken();
    //     }
    //     catch (error) {

    //     }
    // }

    private advance() {
        this.pos++;
        if (this.pos >= this.tokens.length) {
            this.currentToken = this.tokenizer.GetNextToken();
            this.tokens.push(this.currentToken)
        }
        return this
    }

    private previous() {
        return this.tokens[this.pos-1];
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
                    const saveToken = this.currentToken;
                    this.advance();
                    const expr = this.expression(UnaryPrecedence);
                    result = nodeResult(
                        new Expr.Unary(saveToken, expr.value),
                            expr.errors);
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
            while ((this.currentToken.type >= TokenType.pplus &&
                    this.currentToken.type <= TokenType.lshifteq) && 
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

    private factor(): INodeResult<Expr.factor> {
        const suffixTerm = this.suffixTerm();
        const factor = new Expr.factor(suffixTerm.value);
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
        const errors: ParseError[] = [];

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
            case TokenType.number:
            // TODO: All keywords is allowed in suffix.
            // But not allowed at first atom
            case TokenType.id:
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
            let a = this.pair();
            pairs.push(a.value);
            errors.push(...a.errors);
            while (this.eatDiscardCR(TokenType.comma)) {
                a = this.pair();
                pairs.push(a.value);
                errors.push(...a.errors);
            }
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

        throw this.error(
            this.previous(),
            'Expect a ":" on key-value pairs in associative array'
        )
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
            'Expected a "(" at end of call'
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