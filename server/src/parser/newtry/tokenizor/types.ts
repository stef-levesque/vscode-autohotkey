import { Range } from 'vscode-languageserver';
import { Token } from '../types';

/**
 * all result kind of a tokenizor
 */
export enum TokenKind {
	/**
	 * tokenizor got a token
	 */
	Token,
	/**
	 * tokenizor enconter an error
	 */
	Diagnostic,
	/**
	 * got a comment
	 */
	Commnet
}

export interface Result<T, TokenKind> {
	result: T,
	kind: TokenKind
};

/**
 * Infomation of an error
 */
export interface IDiagnosticInfo {
	/**
	 * what is scanned
	 */
	content: string,
	/**
	 * range of error
	 */
	range: Range
}

export type TakeToken = Result<Token, TokenKind.Token>;
export type TakeDiagnostic = Result<IDiagnosticInfo, TokenKind.Diagnostic>;
export type TakeComment = Result<Token, TokenKind.Commnet>;

export type TokenResult = 
	| TakeToken
	| TakeDiagnostic
	| TakeComment;