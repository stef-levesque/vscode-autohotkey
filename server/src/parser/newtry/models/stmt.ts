import { Position, Range } from 'vscode-languageserver';
import { IStmt, SyntaxKind, Token } from '../types';
import { NodeBase } from './nodeBase';
import * as Expr from './expr'

/**
 * Statement base class
 */
export abstract class Stmt extends NodeBase implements IStmt {
	/**
	 * Return the tree node type of statement
	 */
	get tag(): SyntaxKind.stmt {
		return SyntaxKind.stmt;
	}
}

export class Invalid extends Stmt {
	/**
   * Construct a new invalid statement
   * @param pos Provides the start position of this statement
   * @param tokens tokens involved in this invalid statement
   */
	constructor(
		public readonly pos: Position,
		public readonly tokens: Token[]
	) {
		super();
	}

	/**
	 * Convert this invalid statement into a set of line
	 */
	public toLines(): string[] {
		return [this.tokens.map(t => t.content).join(' ')];
	}

	/**
	 * What is the start position of this statement
	 */
	public get start(): Position {
		return this.tokens.length > 0 ? this.tokens[0].start : this.pos;
	}

	/**
	 * What is the end position of this statement
	 */
	public get end(): Position {
		return this.tokens.length > 0
			? this.tokens[this.tokens.length - 1].end
			: this.pos;
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

export class AssignStmt extends Stmt {
	/**
	 * @param identifer Variable to be assigned
	 * @param assign Assign token
	 */
	constructor(
		public readonly identifer: Token,
		public readonly assign: Token,
		public readonly expr: Expr.Expr
	) {
		super();
	}

	public toLines(): string[] {
		const exprLines = this.expr.toLines();
		const idLines = this.identifer.content;
		const assignLines = this.assign.content;
		exprLines[0] = `${idLines} ${assignLines} ${exprLines[0]}`
		return exprLines;
	}

	public get start(): Position {
		return this.identifer.start;
	}

	public get end(): Position {
		return this.expr.end;
	}

	public get ranges(): Range[] {
		return [this.expr];
	}
}
