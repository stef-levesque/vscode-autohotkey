import { join } from 'path';
import { Position, Range } from 'vscode-languageserver';
import { TokenType } from '../tokenTypes';
import {
	Atom,
	IExpr,
	ISuffixTerm,
	SuffixTermTrailer,
	SyntaxKind,
	Token
} from '../types';
import { NodeBase } from './nodeBase';

/**
 * Base class for all suffix terms
 */
export abstract class SuffixTermBase extends NodeBase implements ISuffixTerm {
	/**
	 * Tag used to denote syntax node of the instance
	 */
	get tag(): SyntaxKind.suffixTerm {
		return SyntaxKind.suffixTerm;
	}
}

/**
 * Container for tokens constituting an invalid suffix term
 */
export class Invalid extends SuffixTermBase {
	/**
	 * Invalid suffix term constructor
	 * @param tokens tokens in the invalid range
	 */
	constructor(public readonly position: Position) {
		super();
	}

	public get start(): Position {
		return this.position;
	}

	public get end(): Position {
		return this.position;
	}

	public get ranges(): Range[] {
		return [];
	}

	public toLines(): string[] {
		return [''];
	}
}

/**
 * Class holding all suffix trailers
 */
export class SuffixTrailer extends SuffixTermBase {
	/**
	 * Constructor for the suffix trailer
	 * @param suffixTerm base suffix term
	 * @param dot colon separating the base from the trailer
	 * @param trailer the suffix trailer
	 */
	constructor(
		public readonly suffixTerm: SuffixTerm,
		public dot?: Token,
		public trailer?: SuffixTrailer,
	) {
		super();
	}

	public get start(): Position {
		return this.suffixTerm.start;
	}

	public get end(): Position {
		return (this.trailer === undefined) ? this.suffixTerm.end : this.trailer.end;
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
			const [joinLine, ...restLines] = this.trailer.toLines();

			if (suffixTermLines.length === 1) {
				return [`${suffixTermLines[0]}${this.dot.content}${joinLine}`].concat(
					restLines,
				);
			}

			return suffixTermLines
				.slice(0, suffixTermLines.length - 2)
				.concat(
					`${suffixTermLines[0]}${this.dot.content}${joinLine}`,
					restLines,
				);
		}

		return suffixTermLines;
	}
}

/**
 * Class holding all valid suffix terms
 */
export class SuffixTerm extends SuffixTermBase {
	/**
	 * Constructor for suffix terms
	 * @param atom base item of the suffix term
	 * @param trailers trailers present in the suffixterm
	 */
	constructor(
		public readonly atom: Atom,
		public readonly trailers: SuffixTermTrailer[],
	) {
		super();
	}
	public get ranges(): Range[] {
		return [this.atom as Range, ...(this.trailers as Range[])];
	}

	public get start(): Position {
		return this.atom.start;
	}

	public get end(): Position {
		if (this.trailers.length > 0) {
			return this.trailers[this.trailers.length - 1].end;
		}

		return this.atom.end;
	}
	
	public toLines(): string[] {
		const atomLines = this.atom.toLines();
		const trailersLines = this.trailers.map(t => t.toLines());
		const flatLines = trailersLines.flat();
		flatLines[0] = atomLines + flatLines[0];

		return flatLines;
	}
}

/**
 * Class containing all valid call suffixterm trailers
 */
export class Call extends SuffixTermBase {
	/**
	 * Constructor for the suffix term trailers
	 * @param open open paren of the call
	 * @param args arguments for the call
	 * @param close close paren of the call
	 */
	constructor(
		public readonly open: Token,
		public readonly args: IExpr[],
		public readonly close: Token,
	) {
		super();
	}

	public get start(): Position {
		return this.open.start;
	}

	public get end(): Position {
		return this.close.end;
	}

	public get ranges(): Range[] {
		return [this.open, ...this.args, this.close];
	}

	public toLines(): string[] {
		if (this.args.length === 0) {
			return [`${this.open.content}${this.close.content}`];
		}

		const argsLines = this.args.map(a => a.toLines());
		const argsResult = argsLines.flatMap(l => {
			l.join(',');
			return l;
		});

		argsResult[0] = `${this.open.content}${argsResult[0]}`;
		argsResult[argsResult.length - 1] = `${argsResult[argsResult.length - 1]}${this.close.content
			}`;
		return argsResult;
	}
}

/**
 * Class containing all valid array bracket suffix term trailers
 */
export class BracketIndex extends SuffixTermBase {
	/**
	 * Constructor for the array bracket suffix term trailer
	 * @param open open bracket
	 * @param index index into the collection
	 * @param close close bracket
	 */
	constructor(
		public readonly open: Token,
		public readonly index: IExpr,
		public readonly close: Token,
	) {
		super();
	}

	public get start(): Position {
		return this.open.start;
	}

	public get end(): Position {
		return this.close.end;
	}

	public get ranges(): Range[] {
		return [this.open, this.index, this.close];
	}

	public toLines(): string[] {
		const lines = this.index.toLines();

		lines[0] = `${this.open.content}${lines[0]}`;
		lines[lines.length - 1] = `${lines[lines.length - 1]}${this.close.content}`;
		return lines;
	}
}

/**
 * Class containing percent dereference suffix terms
 */
export class PercentDereference extends SuffixTermBase {
	/**
	 * Constructor of percent dereference
	 * @param precentStart Start precent
	 * @param precentEnd End precent
	 * @param referValue The value to be derefer
	 */
	constructor(
		public readonly precentStart: Token,
		public readonly precentEnd: Token,
		public readonly referValue: Token
		) {
		super();
	}

	public get start(): Position {
		return this.precentStart.start;
	}

	public get end(): Position {
		return this.precentStart.end;
	}

	public get ranges(): Range[] {
		return [this.precentStart, this.referValue, this.precentEnd];
	}

	public toLines(): string[] {
		let v = this.referValue.type === TokenType.string ?
				'"' + this.referValue.content + '"' :
				this.referValue.content;
		return [this.precentStart.content+v+this.precentEnd.content];
	}
}

/**
 * Class containing literal suffix terms
 */
export class Literal extends SuffixTermBase {
	/**
	 * Constructor for literal suffix term
	 * @param token token for the literal
	 */
	constructor(public readonly token: Token) {
		super();
	}

	public get start(): Position {
		return this.token.start;
	}

	public get end(): Position {
		return this.token.end;
	}

	public get ranges(): Range[] {
		return [this.token];
	}

	public toLines(): string[] {
		return [`${this.token.content}`];
	}
}

/**
 * Class containing all valid identifiers
 */
export class Identifier extends SuffixTermBase {
	/**
	 * Constructor for suffix term identifiers
	 * @param token identifier token
	 */
	constructor(public readonly token: Token) {
		super();
	}

	public get start(): Position {
		return this.token.start;
	}

	public get end(): Position {
		return this.token.end;
	}

	public get ranges(): Range[] {
		return [this.token];
	}

	public get isKeyword(): boolean {
		return !(this.token.type === TokenType.id );
	}

	public toLines(): string[] {
		return [`${this.token.content}`];
	}
}

/**
 * Class containing all valid groupings
 */
export class Grouping extends SuffixTermBase {
	/**
	 * Grouping constructor
	 * @param open open paren token
	 * @param expr expression within the grouping
	 * @param close close paren token
	 */
	constructor(
		public readonly open: Token,
		public readonly expr: IExpr,
		public readonly close: Token,
	) {
		super();
	}

	public get start(): Position {
		return this.open.start;
	}

	public get end(): Position {
		return this.close.end;
	}

	public get ranges(): Range[] {
		return [this.open, this.expr, this.close];
	}

	public toString(): string {
		return `${this.open.content}${this.expr.toString()}${this.close.content}`;
	}

	public toLines(): string[] {
		const lines = this.expr.toLines();

		lines[0] = `${this.open.content}${lines[0]}`;
		lines[lines.length - 1] = `${lines[lines.length - 1]}${this.close.content}`;
		return lines;
	}
}