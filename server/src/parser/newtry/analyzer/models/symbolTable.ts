import { SymbolInformation, SymbolKind } from 'vscode-languageserver-types';
import { IScoop, ISymbol } from '../types';
import { BuiltinTypeSymbol, AHKSymbol, VaribaleSymbol, AHKMethodSymbol, AHKObjectSymbol, HotkeySymbol, HotStringSymbol } from './symbol';

/**
 * Symbol Table for the entire AHK file
 * Used for global scoop and super global scoop
 */
export class SymbolTable implements IScoop {
	private symbols: Map<string, AHKSymbol> = new Map();
	public readonly name: string;
	public readonly enclosingScoop: Maybe<IScoop>;
	private includeTable: Set<IScoop>;
	public readonly dependcyScoop: Set<IScoop>;
	public readonly scoopLevel: number;

	constructor(name: string, scoopLevel: number, enclosingScoop?: Maybe<IScoop>) {
		this.name = name;
		this.scoopLevel = scoopLevel;
		this.enclosingScoop = enclosingScoop;
		this.dependcyScoop = new Set();
		this.includeTable = new Set();
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
		let result = this.symbols.get(name);
		if (result) return result;
		// then check parent scoop
		result = this.enclosingScoop?.resolve(name);
		if (result) return result;
		// finally check include symbol table
		for (const table of this.includeTable) {
			result = table.resolve(name);
			if (result) return result;
		}
		return undefined;
	}

	public addScoop(scoop: IScoop) {
		this.dependcyScoop.add(scoop);
	}

	public addInclude(table: IScoop) {
		this.includeTable.add(table);
	}

	public allSymbols(): ISymbol[] {
		const syms: ISymbol[] = [];
		for (const [name, sym] of this.symbols) 
			syms.push(sym);
		return syms
	}

	public symbolInformations(): SymbolInformation[] {
		let info: SymbolInformation[] = [];
		for (const [name, sym] of this.symbols) {
			if (sym instanceof VaribaleSymbol) {
				info.push(SymbolInformation.create(
					name,
					SymbolKind.Variable,
					sym.range
				));
			}
			else if (sym instanceof AHKMethodSymbol) {
				info.push(SymbolInformation.create(
					name,
					SymbolKind.Method,
					sym.range
				));
				info.push(...sym.symbolInformations());
			}
			else if (sym instanceof AHKObjectSymbol) {
				info.push(SymbolInformation.create(
					name,
					SymbolKind.Class,
					sym.range
				));
				info.push(...sym.symbolInformations());
			}
			else if (sym instanceof HotkeySymbol || sym instanceof HotStringSymbol) {
				info.push(SymbolInformation.create(
					name,
					SymbolKind.Event,
					sym.range
				));
			}
			else
				continue;
		}
		return info;
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