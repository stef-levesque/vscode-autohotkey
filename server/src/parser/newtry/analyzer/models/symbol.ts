import { IScoop, ISymbol, ISymType, VarKind } from '../types';
import { Range } from 'vscode-languageserver';

export abstract class AHKSymbol implements ISymbol {
	public readonly name: string;
	public readonly type: Maybe<ISymType>;
	constructor(name: string, type?: ISymType) {
		this.name = name;
		this.type = type;
	}
}

export class BuiltinVaribelSymbol extends AHKSymbol {
	constructor(
		public readonly name: string,
		public readonly tag: VarKind,
		type: Maybe<ISymType>
	) {
		super(name, type);
	}

	toString(): string {
		return this.type !== undefined ?
			`<${this.name}: ${this.type.name}>` :
			`<Variable ${this.name}>`;
	}
}

export class VaribaleSymbol extends AHKSymbol {
	/**
	 * @param name Name of a variable
	 * @param range Range of its defined area
	 * @param tag Kind of this variable
	 * @param type Type of this variable
	 */
	constructor(
		public readonly name: string,
		public readonly range: Range,
		public readonly tag: VarKind,
		type: Maybe<ISymType>
	) {
		super(name, type);
	}

	toString(): string {
		return this.type !== undefined ?
			`<${this.name}: ${this.type.name}>` :
			`<Variable ${this.name}>`;
	}
}

export class HotkeySymbol extends AHKSymbol {
	constructor(
		name: string,
		public readonly range: Range
	) {
		super(name);
	}

	toString(): string {
		return `<Hotkey ${this.name}>`
	}
}

export class HotStringSymbol extends AHKSymbol {
	constructor(
		name: string,
		public readonly range: Range
	) {
		super(name);
	}

	toString(): string {
		return `<HotString ${this.name}>`
	}
}

export class LabelSymbol extends AHKSymbol {
	constructor(
		name: string,
		public readonly range: Range
	) {
		super(name);
	}

	toString(): string {
		return `<Label ${this.name}>`
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
	public readonly dependcyScoop: Set<IScoop>;

	constructor(name: string, enclosingScoop?: IScoop) {
		super(name);
		this.enclosingScoop = enclosingScoop;
		this.dependcyScoop = new Set();
	}

	public define(sym: ISymbol): void {
		this.symbols.set(sym.name, sym);
	}

	public resolve(name: string): Maybe<ISymbol> {
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

	public addScoop(scoop: IScoop) {
		this.dependcyScoop.add(scoop);
	}
}

export class AHKBuiltinMethodSymbol extends ScopedSymbol {
	constructor(
		name: string,
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

export class AHKBuiltinObjectSymbol extends ScopedSymbol implements ISymType {
	/**
	 * @param name Name of class symbol
	 * @param parentScoop parent class
	 * @param enclosingScoop parent scoop
	 */
	constructor(
		name: string,
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

export class AHKObjectSymbol extends ScopedSymbol implements ISymType {
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