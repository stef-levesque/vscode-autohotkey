import { Position, Range } from 'vscode-languageserver';
import { ParseError } from './parser/models/parseError';
import { TokenType } from './tokenizor/tokenTypes';
import * as Expr from './parser/models/expr';
import * as Stmt from './parser/models/stmt';
import * as SuffixTerm from './parser/models/suffixterm'

export enum SyntaxKind {
	script,
	stmt,
	expr,
	suffixTerm,
}

export interface IToken {
	type: TokenType;
	content: string;
	start: Position;
	end: Position;
}

export type ITokenMap = Map<string, TokenType>;

export class Token implements IToken {
	public readonly type: TokenType;
	public readonly content: string;
	public readonly start: Position;
	public readonly end: Position;
	constructor(type: TokenType, content: string, start: Position, end: Position) {
		this.type = type;
		this.content = content;
		this.start = start;
		this.end = end;
	}
}

export interface IParseError extends Range {
	token: Token;
	message: string;
}

export interface IScript {
	stmts: IStmt[];
	include: Set<string>;
	uri: string;
	tag: SyntaxKind.script;
}

export interface INodeResult<T> {
	errors: ParseError[];
	value: T;
}

export interface RangeSequence extends Range {
	ranges: Range[];
}

export interface ISuffixTerm extends RangeSequence {
	toString(): string;
	tag: SyntaxKind.suffixTerm;
}

export interface IExpr extends RangeSequence {
	toLines(): string[];
	toString(): string;
	tag: SyntaxKind.expr;
}

export interface IStmt extends RangeSequence {
	toLines(): string[];
	toString(): string;
	tag: SyntaxKind.stmt;
}

/**
 * Type repersents all valid syntax node
 */
export type SyntaxNode =
	| IExprClass
	| IStmtClass;

export type SuffixTermTrailer =
	| SuffixTerm.Call
	| SuffixTerm.BracketIndex;

export type Atom =
	| SuffixTerm.Invalid
	| SuffixTerm.Literal
	| SuffixTerm.Grouping
	| SuffixTerm.PercentDereference
	| SuffixTerm.ArrayTerm
	| SuffixTerm.AssociativeArray
	| SuffixTerm.Identifier;

export interface IStmtClass<T = Stmt.Stmt>
	extends Constructor<T> {
	grammar: SyntaxNode[];
}

export interface IExprClass<T = Expr.Expr>
	extends Constructor<T> {
	grammar: SyntaxNode[];
}

