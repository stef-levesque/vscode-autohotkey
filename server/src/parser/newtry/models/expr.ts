import { Position, Range } from 'vscode-languageserver';
import { TokenType } from '../tokenTypes';
import {
    IExpr,
    SyntaxKind,
    Token,
    SyntaxNode
} from '../types';
import { NodeBase } from './nodeBase';
import * as SuffixTerm from './suffixterm'

/**
 * Expression base class
 */
export abstract class Expr extends NodeBase implements IExpr {
    /**
     * Return the tree node type of expression
     */
    get tag(): SyntaxKind.expr {
        return SyntaxKind.expr;
    }
}

/**
 * Container for tokens constituting an invalid expression
 */
export class Invalid extends Expr {
    /**
     * Invalid expression constructor
     * @param pos start position of the invalid expression
     * @param tokens all tokens in the invalid range
     */
    constructor(
        public readonly pos: Position,
        public readonly tokens: Token[]
    ) {
        super();
    }

    public get start(): Position {
        return this.tokens.length > 0 ? this.tokens[0].start : this.pos;
    }

    public get end(): Position {
        return this.tokens.length > 0
            ? this.tokens[this.tokens.length - 1].end
            : this.pos;
    }

    public toLines(): string[] {
        return [this.tokens.map(t => t.content).join(' ')];
    }

    /**
     * Ranges of this statement
     */
    public get ranges(): Range[] {
        let ranges: Range[] = [];
        for (const token of this.tokens) {
            ranges.push(Range.create(token.start, token.end));
        }
        return ranges;
    }
}

/**
 * Class holding all valid unary expressions in KOS
 */
export class Unary extends Expr {
    /**
     * Unary expression constructor
     * @param operator unary operator
     * @param factor factor
     */
    constructor(public readonly operator: Token, public readonly factor: IExpr) {
        super();
    }

    public get start(): Position {
        return this.operator.start;
    }

    public get end(): Position {
        return this.factor.end;
    }

    public get ranges(): Range[] {
        return [this.operator, this.factor];
    }

    public toLines(): string[] {
        const lines = this.factor.toLines();

        switch (this.operator.type) {
            case TokenType.plus:
            case TokenType.minus:
                lines[0] = `${this.operator.content}${lines[0]}`;
                return lines;
            default:
                lines[0] = `${this.operator.content} ${lines[0]}`;
                return lines;
        }
    }
}

/**
 * Class repersenting all valid binary expressions in AHK
 */
export class Binary extends Expr {
    /**
     * Constructor for all binary expressions
     * @param left left expression of the operator
     * @param operator The operator
     * @param right right expression of the operator
     */
    constructor(
        public readonly left: IExpr,
        public readonly operator: Token,
        public readonly right: IExpr) {
        super();
    }

    public get start(): Position {
        return this.left.start;
    }

    public get end(): Position {
        return this.right.end;
    }

    public get ranges(): Range[] {
        return [this.left, this.operator, this.right];
    }

    public toLines(): string[] {
        const leftLines = this.left.toLines();
        const rightLines = this.right.toLines();

        return rightLines.length === 0 ? 
            [`${leftLines[0]} ${this.operator.content}`] :
            [`${leftLines[0]} ${this.operator.content} ${rightLines[0]}`];
    }
}

/**
 * Class for all factor to be calcuated
 */
export class factor extends Expr {
    /**
     * Factor constructor
     * @param suffixTerm base suffix term
     * @param dot optional suffix color
     * @param trailer optional suffix trailer
     */
    constructor(
        public readonly suffixTerm: SuffixTerm.SuffixTerm,
        public dot?: Token,
        public trailer?: SuffixTerm.SuffixTrailer,
    ) {
        super();
    }

    public get start(): Position {
        return this.suffixTerm.start;
    }

    public get end(): Position {
        return this.trailer === undefined ? this.suffixTerm.end : this.trailer.end;
    }

    public get ranges(): Range[] {
        if (!(this.dot === undefined) && !(this.trailer === undefined)) {
            return [this.suffixTerm, this.dot, this.trailer];
        }

        return [this.suffixTerm];
    }

    public toLines(): string[] {
        const suffixTermLines = this.suffixTerm.toLines();

        if (!(this.dot === undefined) && !(this.trailer === undefined)) {
            const trailerLines = this.trailer.toLines();
            return [suffixTermLines + this.dot.content + trailerLines];
        }

        return suffixTermLines;
    }
}