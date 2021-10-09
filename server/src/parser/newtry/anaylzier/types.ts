export interface IScoop {
	readonly name: string;
	/**
	 * Find its parent scoop
	 */
	readonly enclosingScoop: Maybe<IScoop>;
	/**
	 * Define a symbol
	 */
	define(sym: ISymbol): void;
	/**
	 * Find a symbol
	 */
	resolve(name: string): Maybe<ISymbol>;
}

export interface ISymbol {
	readonly name: string;
	readonly type: Maybe<ISymType>;
}

// Just marking object is a type
export interface ISymType {
	readonly name: string;
}