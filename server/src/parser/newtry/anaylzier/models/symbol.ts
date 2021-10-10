import { IScoop, ISymbol, ISymType } from '../types';
import { Range } from 'vscode-languageserver';

export abstract class AHKSymbol implements ISymbol {
	public readonly name: string;
	public readonly type: Maybe<ISymType>;
	constructor(name: string, type?: ISymType) {
		this.name = name;
		this.type = type;
	}
}

export class VaribaleSymbol extends AHKSymbol {
	constructor(
		public readonly name: string,
		public readonly range: Range,
		public readonly type: ISymType
	) {
		super(name, type);
	}

	toString(): string {
		return `<${this.name}: ${this.type.name}>`
	}
}

export class BuiltinTypeSymbol extends AHKSymbol implements ISymType {
	constructor(name: string) {
		super(name)
	}

	toString(): string {
		return `<BuiltinType ${this.name}>`
	}
}

export abstract class ScopedSymbol extends AHKSymbol implements IScoop {
	protected symbols: Map<string, AHKSymbol> = new Map();
	public readonly enclosingScoop: Maybe<IScoop>;

	constructor(name: string, enclosingScoop?: IScoop) {
		super(name);
		this.enclosingScoop = enclosingScoop;
	}

	define(sym: ISymbol): void {
		this.symbols.set(sym.name, sym);
	}

	resolve(name: string): Maybe<ISymbol> {
		if (this.symbols.has(name)) 
			return this.symbols.get(name);
		let searchScoop = this.enclosingScoop;
		while (searchScoop) {
			const sym = searchScoop.resolve(name);
			if (sym) return sym;
			searchScoop = searchScoop.enclosingScoop;
		}
		return undefined;
	}
}

export class AHKMethodSymbol extends ScopedSymbol {
	constructor(
		name: string,
		public readonly range: Range,
		public readonly requiredParameters: VaribaleSymbol[],
		public readonly optionalParameters: VaribaleSymbol[],
		enclosingScoop?: IScoop
	) {
		super(name, enclosingScoop);
		this.initParameters();
	}

	private initParameters() {
		this.requiredParameters.forEach(v => this.define(v));
		this.optionalParameters.forEach(v => this.define(v));
	}
}

export class AHKObjectSymbol extends ScopedSymbol {
	/**
	 * @param name Name of class symbol
	 * @param range range of symbol
	 * @param parentScoop parent class
	 * @param enclosingScoop parent scoop
	 */
	constructor(
		name: string,
		public readonly range: Range,
		public readonly parentScoop: Maybe<AHKObjectSymbol>,
		enclosingScoop?: IScoop
	) {
		super(name, enclosingScoop);
	}

	/**
	 * Lookup property symbol of a class
	 * @param name Property symbol name
	 */
	resolveProp(name: string): Maybe<ISymbol> {
		if (this.symbols.has(name))
			return this.symbols.get(name);
		let searchScoop = this.parentScoop;
		while (searchScoop) {
			const sym = searchScoop.resolve(name);
			if (sym) return sym;
			searchScoop = searchScoop.parentScoop;
		}
		return undefined;
	}
}