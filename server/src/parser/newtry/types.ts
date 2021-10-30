import { Position, Range } from 'vscode-languageserver';
import { ParseError } from './parser/models/parseError';
import { TokenType } from './tokenizor/tokenTypes';
import * as Expr from './parser/models/expr';
import * as Stmt from './parser/models/stmt';
import * as SuffixTerm from './parser/models/suffixterm'
import * as Decl from './parser/models/declaration'
import { IDiagnosticInfo } from './tokenizor/types';

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

export interface IAST {
	script: IScript;
	sytanxErrors: IParseError[];
	tokenErrors: IDiagnosticInfo[];
} 

export interface IScript {
	stmts: IStmt[];
	tokens: Token[];
	comments: Token[];
	include?: Set<string>;
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
	accept<T extends (...args: any) => any>(
		visitor: IStmtVisitor<T>,
		parameters: Parameters<T>,
	): ReturnType<T>;
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

export interface IStmtVisitor<T extends (...args: any) => any> {
	visitDeclVariable(decl: Decl.VarDecl, parameters: Parameters<T>): ReturnType<T>; 
	visitDeclClass(decl: Decl.ClassDef, parameters: Parameters<T>): ReturnType<T>; 
	visitDeclHotkey(decl: Decl.Hotkey, parameters: Parameters<T>): ReturnType<T>;
	visitDeclHotString(decl: Decl.HotString, parameters: Parameters<T>): ReturnType<T>;
	visitDeclFunction(decl: Decl.FuncDef, parameters: Parameters<T>): ReturnType<T>;
	visitDeclParameter(decl: Decl.Param, parameters: Parameters<T>): ReturnType<T>;
	visitDeclLabel(decl: Decl.Label, parameters: Parameters<T>): ReturnType<T>;
  
	visitStmtInvalid(
	  stmt: Stmt.Invalid,
	  parameters: Parameters<T>,
	): ReturnType<T>;
	visitDrective(stmt: Stmt.Drective, parameters: Parameters<T>): ReturnType<T>;
	visitBlock(stmt: Stmt.Block, parameters: Parameters<T>): ReturnType<T>;
	visitExpr(stmt: Stmt.ExprStmt, parameters: Parameters<T>): ReturnType<T>;
	visitAssign(stmt: Stmt.AssignStmt, parameters: Parameters<T>): ReturnType<T>;
	// visitCommand(stmt: Stmt.Command, parameters: Parameters<T>): ReturnType<T>;
	// visitCommandExpr(
	//   stmt: Stmt.CommandExpr,
	//   parameters: Parameters<T>,
	// ): ReturnType<T>;
	visitIf(stmt: Stmt.If, parameters: Parameters<T>): ReturnType<T>;
	visitElse(stmt: Stmt.Else, parameters: Parameters<T>): ReturnType<T>;
	visitReturn(stmt: Stmt.Return, parameters: Parameters<T>): ReturnType<T>;
	visitBreak(stmt: Stmt.Break, parameters: Parameters<T>): ReturnType<T>;
	visitSwitch(stmt: Stmt.SwitchStmt, parameters: Parameters<T>): ReturnType<T>;
	visitCase(stmt: Stmt.CaseStmt, parameters: Parameters<T>): ReturnType<T>;
	visitLoop(stmt: Stmt.LoopStmt, parameters: Parameters<T>): ReturnType<T>;
	visitWhile(stmt: Stmt.WhileStmt, parameters: Parameters<T>): ReturnType<T>;
	visitFor(stmt: Stmt.ForStmt, parameters: Parameters<T>): ReturnType<T>;
	visitTry(stmt: Stmt.TryStmt, parameters: Parameters<T>): ReturnType<T>;
	visitCatch(stmt: Stmt.CatchStmt, parameters: Parameters<T>): ReturnType<T>;
	visitFinally(stmt: Stmt.FinallyStmt, parameters: Parameters<T>): ReturnType<T>;

}
