import { IScoop } from '../types';
import { BuiltinTypeSymbol, AHKSymbol } from './symbol';

export class SymbolTable implements IScoop {
	private symbols: Map<string, AHKSymbol> = new Map();
	public readonly name: string;
	public readonly enclosingScoop: Maybe<IScoop>;
	public readonly scoopLevel: number;

	constructor(name: string, scoopLevel: number, enclosingScoop: Maybe<IScoop>) {
		this.name = name;
		this.scoopLevel = scoopLevel;
		this.enclosingScoop = enclosingScoop;
		this.initTypeSystem();
	}

	private initTypeSystem() {
		this.define(new BuiltinTypeSymbol('number'));
		this.define(new BuiltinTypeSymbol('string'));
	}

	public define(sym: AHKSymbol) {
		this.symbols.set(sym.name, sym);
	}

	public resolve(name: string): Maybe<AHKSymbol> {
		return this.symbols.get(name);
	}

	public toString(): string {
		let scope_header = '作用域符号表：';
		let  lines = ['\n', scope_header, '='.repeat(scope_header.length*2)];
		lines.push(`作用域名称: ${this.name}`);
		let symtab_header = '符号表中的内容：';
		lines.push(...['\n', symtab_header, '-'.repeat(scope_header.length*2)]);
		this.symbols.forEach((v, k) => lines.push(`${k}: ${v}`));
		return lines.join('\n');
	}
}