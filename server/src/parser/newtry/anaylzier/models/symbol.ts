import { IScoop, ISymbol, ISymType } from '../types';

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
	private symbols: Map<string, AHKSymbol> = new Map();
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

export class MethodSymbol extends ScopedSymbol {
	public readonly parameters: ;

	constructor(name: string, param, enclosingScoop?: IScoop) {
		super(name, enclosingScoop);
		this.parameters = param;
	}


}