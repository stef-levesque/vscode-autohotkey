import { Position, Range } from 'vscode-languageserver';
import { IExpr, IStmt, SyntaxKind, Token } from '../types';
import { NodeBase } from './nodeBase';
import * as Expr from './expr'
import { joinLines } from '../utils/stringUtils';

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

export class Block extends Stmt {

	constructor(
		public readonly open: Token,
		public readonly stmts: Stmt[],
		public readonly close: Token
	) {
		super();
	}

	public toLines(): string[] {
		const lines = this.stmts.flatMap(stmt => stmt.toLines());

		if (lines.length === 0) {
			return [`${this.open.content} ${this.close.content}`];
		}

		if (lines.length === 1) {
			return [`${this.open.content} ${lines[0]} ${this.close.content}`];
		}

		return [`${this.open.content}`].concat(
			...lines.map(line => `    ${line}`),
			`${this.close.content}`,
		);
	}

	public get start(): Position {
		return this.open.start;
	}

	public get end(): Position {
		return this.close.end;
	}

	public get ranges(): Range[] {
		return [this.open, ...this.stmts, this.close];
	}

	// public accept<T extends (...args: any) => any>(
	// 	visitor: IStmtVisitor<T>,
	// 	parameters: Parameters<T>,
	// ): ReturnType<T> {
	// 	return visitor.visitBlock(this, parameters);
	// }
}

export class If extends Stmt {

	constructor(
		public readonly ifToken: Token,
		public readonly condition: IExpr,
		public readonly body: IStmt,
		public readonly elseStmt?: Else
	) {
		super();
	}

	public toLines(): string[] {
		const conditionLines = this.condition.toLines();
		const stmtLines = this.body.toLines();

		conditionLines[0] = `${this.ifToken.content} ${conditionLines[0]}`;
		const lines = conditionLines;

		if (this.elseStmt !== undefined) {
			const elseLines = this.elseStmt.toLines();
			return lines;
		}

		return lines;
	}

	public get start(): Position {
		return this.ifToken.start;
	}

	public get end(): Position {
		return (this.elseStmt === undefined) ? this.body.end : this.elseStmt.end;
	}

	public get ranges(): Range[] {
		const ranges = [this.ifToken, this.condition, this.body];
		if (this.elseStmt !== undefined) {
			ranges.push(this.elseStmt);
		}

		return ranges;
	}

	// public accept<T extends (...args: any) => any>(
	// 	visitor: IStmtVisitor<T>,
	// 	parameters: Parameters<T>,
	// ): ReturnType<T> {
	// 	return visitor.visitIf(this, parameters);
	// }
}

export class Else extends Stmt {

	constructor(
		public readonly elseToken: Token,
		public readonly body: IStmt
	) {
		super();
	}

	public toLines(): string[] {
		const lines = this.body.toLines();
		lines[0] = `${this.elseToken.content} ${lines[0]}`;
		return lines;
	}

	public get start(): Position {
		return this.elseToken.start;
	}

	public get end(): Position {
		return this.body.end;
	}

	public get ranges(): Range[] {
		return [this.elseToken, this.body];
	}

	// public accept<T extends (...args: any) => any>(
	// 	visitor: IStmtVisitor<T>,
	// 	parameters: Parameters<T>,
	// ): ReturnType<T> {
	// 	return visitor.visitElse(this, parameters);
	// }
}

export class Loop extends Stmt {

	constructor(
		public readonly loop: Token,
		public readonly condition: IExpr,
		public readonly body: IStmt
	) {
		super();
	}

	public toLines(): string[] {
		const conditionLines = this.condition.toLines();
		const bodyLines = this.body.toLines();

		conditionLines[0] = `${this.loop.content} ${conditionLines[0]}`;

		return joinLines(' ', conditionLines, bodyLines);
	}

	public get start(): Position {
		return this.loop.start;
	}

	public get end(): Position {
		return this.body.end;
	}

	public get ranges(): Range[] {
		return [this.loop, this.condition, this.body];
	}

	// public accept<T extends (...args: any) => any>(
	//   visitor: IStmtVisitor<T>,
	//   parameters: Parameters<T>,
	// ): ReturnType<T> {
	//   return visitor.visitWhen(this, parameters);
	// }
}

export class UntilLoop extends Stmt {

	constructor(
		public readonly loop: Token,
		public readonly body: IStmt,
		public readonly until: Token,
		public readonly condition: IExpr,
	) {
		super();
	}

	public toLines(): string[] {
		const conditionLines = this.condition.toLines();
		const bodyLines = this.body.toLines();

		bodyLines[0] = `${this.loop.content} ${bodyLines[0]}`;
		conditionLines[0] = `${this.until.content} ${conditionLines[0]}`;

		return joinLines(' ', bodyLines, conditionLines);
	}

	public get start(): Position {
		return this.loop.start;
	}

	public get end(): Position {
		return this.body.end;
	}

	public get ranges(): Range[] {
		return [this.loop, this.condition, this.body];
	}

	// public accept<T extends (...args: any) => any>(
	//   visitor: IStmtVisitor<T>,
	//   parameters: Parameters<T>,
	// ): ReturnType<T> {
	//   return visitor.visitWhen(this, parameters);
	// }
}

export class WhileStmt extends Stmt {

	constructor(
		public readonly whileToken: Token,
		public readonly condition: IExpr,
		public readonly body: IStmt
	) {
		super();
	}

	public toLines(): string[] {
		const conditionLines = this.condition.toLines();
		const bodyLines = this.body.toLines();

		conditionLines[0] = `${this.whileToken.content} ${conditionLines[0]}`;

		return joinLines(' ', conditionLines, bodyLines);
	}

	public get start(): Position {
		return this.whileToken.start;
	}

	public get end(): Position {
		return this.body.end;
	}

	public get ranges(): Range[] {
		return [this.whileToken, this.condition, this.body];
	}

	// public accept<T extends (...args: any) => any>(
	//   visitor: IStmtVisitor<T>,
	//   parameters: Parameters<T>,
	// ): ReturnType<T> {
	//   return visitor.visitWhen(this, parameters);
	// }
}

export class Break extends Stmt {
	/**
	 * 
	 * @param breakToken break token
	 * @param label label jumping to
	 */
	constructor(
		public readonly breakToken: Token,
		public readonly label?: Token
	) {
		super();
	}

	public toLines(): string[] {
		return this.label !== undefined ?
			[`${this.breakToken.content} ${this.label.content}`] :
			[`${this.breakToken.content}`];
	}

	public get start(): Position {
		return this.breakToken.start;
	}

	public get end(): Position {
		return this.breakToken.end;
	}

	public get ranges(): Range[] {
		return [this.breakToken];
	}

	// public accept<T extends (...args: any) => any>(
	//   visitor: IStmtVisitor<T>,
	//   parameters: Parameters<T>,
	// ): ReturnType<T> {
	//   return visitor.visitBreak(this, parameters);
	// }
}

export class Return extends Stmt {

	constructor(
		public readonly returnToken: Token,
		public readonly value?: IExpr
	) {
		super();
	}

	public toLines(): string[] {
		if (this.value !== undefined) {
			const exprLines = this.value.toLines();

			exprLines[0] = `${this.returnToken.content} ${exprLines[0]}`;
			exprLines[exprLines.length - 1] = `${exprLines[exprLines.length - 1]}.`;
			return exprLines;
		}

		return [`${this.returnToken.content}`];
	}

	public get start(): Position {
		return this.returnToken.start;
	}

	public get end(): Position {
		return this.value === undefined ? this.returnToken.end : this.value.end;
	}

	public get ranges(): Range[] {
		let ranges: Range[] = [this.returnToken];
		if (this.value !== undefined) {
			ranges = ranges.concat(this.value.ranges);
		}

		return ranges;
	}

	// public accept<T extends (...args: any) => any>(
	//   visitor: IStmtVisitor<T>,
	//   parameters: Parameters<T>,
	// ): ReturnType<T> {
	//   return visitor.visitReturn(this, parameters);
	// }
}

export type LoopStmt = Loop | UntilLoop;