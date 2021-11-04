import { SymbolInformation } from 'vscode-languageserver-types';

export interface IScoop {
	readonly name: string;
	/**
	 * Find its parent scoop
	 */
	readonly enclosingScoop: Maybe<IScoop>;

	/**
	 * Scoops belongs to this scoop
	 */
	readonly dependcyScoop: Set<IScoop>;
	/**
	 * Define a symbol
	 */
	define(sym: ISymbol): void;
	/**
	 * Find a symbol
	 */
	resolve(name: string): Maybe<ISymbol>;
	/**
	 * Add a scoop belongs to this scoop
	 * @param scoop Scoop tabel to be added
	 */
	addScoop(scoop: IScoop): void;
	/**
	 * convert symbol to lsp SymbolInfomation
	 */
	symbolInformations(): SymbolInformation[];
}

export interface ISymbol {
	readonly name: string;
	readonly type: Maybe<ISymType>;
}

// Just marking object is a type
export interface ISymType {
	readonly name: string;
}

export enum VarKind {
	variable,
	parameter,
	property
}

export enum ScoopKind {
	SupperGlobal,
	Global,
	Local
}