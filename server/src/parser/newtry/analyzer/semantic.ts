import { Diagnostic } from 'vscode-languageserver-types';
import { Range } from 'vscode-languageserver';
import { TreeVisitor } from './treeVisitor';
import * as Stmt from '../parser/models/stmt';
import * as Decl from '../parser/models/declaration';
import { SymbolTable } from './models/symbolTable';
import { IScript } from '../types';
import { AHKMethodSymbol, AHKObjectSymbol, HotkeySymbol, HotStringSymbol, LabelSymbol, VaribaleSymbol } from './models/symbol';
import { IScoop, VarKind } from './types';
import { TokenType } from '../tokenizor/tokenTypes';

type Diagnostics = Diagnostic[];
interface ProcessResult {
	table: SymbolTable;
	diagnostics: Diagnostics;
}

export class PreProcesser extends TreeVisitor<Diagnostics> {
	private table: SymbolTable;
	private supperGlobal: SymbolTable;
	private stack: IScoop[];
	private currentScoop: IScoop;

	constructor(
		public readonly script: IScript,
		
	) {
		super();
		this.supperGlobal = new SymbolTable('supperGlobal', 0);
		this.table = new SymbolTable('global', 1, this.supperGlobal);
		this.supperGlobal.addScoop(this.table);
		this.stack = [this.table];
		this.currentScoop = this.stack[-1];
	}

	public process(): ProcessResult {
		const stmts = this.script.stmts;
		const errors: Diagnostic[] = [];
		for (const stmt of stmts) {
			const error = stmt.accept(this, []);
			errors.push(error);
		}
		return {
			table: this.table,
			diagnostics: errors
		};
	}

	public visitDeclVariable(decl: Decl.VarDecl): Diagnostics {
		const errors: Diagnostics = [];
		const [e, vs] = this.createVarSym(decl.assigns);
		errors.push(...e);
		if (decl.scope.type === TokenType.static ) {
			if (!(this.currentScoop instanceof AHKObjectSymbol)) {
				errors.push(
					this.error(
						Range.create(decl.start, decl.end),
						'Static declaration can only be used in class'
					)
				);
			}
			// Define static property of class
			vs.forEach(v => this.currentScoop.define(v));
		}

		// global and local declaration is not allowed in class
		// report errors and return
		if (this.currentScoop instanceof AHKObjectSymbol) 
			return errors;

		// TODO: 变量在local和global上重复定义的问题
		// Define global and local variable
		if (decl.scope.type === TokenType.local) 
			vs.forEach(v => this.currentScoop.define(v));
		else {
			for (const sym of vs) {
				// global declaration in global
				if (this.currentScoop.name === 'global')
					this.supperGlobal.define(sym);
				const globalSym = this.table.resolve(sym.name);
				// if variable exists in global
				// add it to local, make it visible in local
				if (globalSym)
					this.currentScoop.define(sym);
				// if not add to both
				else {
					this.currentScoop.define(sym);
					this.table.define(sym);
				}
			}
		}
		return errors;
	}

	public visitDeclFunction(decl: Decl.FuncDef): Diagnostics {
		const params = decl.params;
		const reqParams = this.paramAction(params.requiredParameters);
		const dfltParams = this.paramAction(params.optionalParameters);
		const sym = new AHKMethodSymbol(
			decl.nameToken.content,
			copyRange(decl),
			reqParams,
			dfltParams,
			this.supperGlobal
		);
		this.supperGlobal.define(sym);
		this.supperGlobal.addScoop(sym);
		const errors = decl.body.accept(this, []);
		return errors;
	}

	private paramAction(params: Decl.Parameter[]): VaribaleSymbol[] {
		const syms: VaribaleSymbol[] = [];
		for(const param of params) {
			syms.push(new VaribaleSymbol(
				param.identifier.content,
				copyRange(param),
				VarKind.parameter,
				undefined
			));
		}
		return syms;
	}

	public visitDeclClass(decl: Decl.ClassDef): Diagnostics {
		// TODO: parent scoop of class
		const parentScoop = undefined;
		const objTable = new AHKObjectSymbol(
			decl.name.content,
			copyRange(decl),
			parentScoop,
			this.currentScoop
		);
		const errors: Diagnostics = [];
		errors.push(... decl.body.accept(this, []));
		return errors;
	}

	public visitDeclHotkey(decl: Decl.Hotkey): Diagnostics {
		const name: string = decl.key2 ? 
			decl.key1.key.content + ' & ' + decl.key2.key.content :
			decl.key1.key.content;
		this.table.define(
			new HotkeySymbol(
				name,
				copyRange(decl)
			)
		);
		return [];
	}

	public visitDeclHotString(decl: Decl.HotString): Diagnostics {
		this.table.define(
			new HotStringSymbol(
				decl.str.content,
				copyRange(decl)
			)
		);
		return [];
	}

	public visitDeclLabel(decl: Decl.Label): Diagnostics {
		this.table.define(
			new LabelSymbol(
				decl.name.content,
				copyRange(decl)
			)
		);
		return [];
	}

	private createVarSym(assigns: Decl.OptionalAssginStmt[]): [Diagnostics, VaribaleSymbol[]] {
		const errors: Diagnostics = [];
		const varSym: VaribaleSymbol[] = [];
		for (const assign of assigns) {
			errors.push(assign.accept(this, []));
			const sym = new VaribaleSymbol(
				assign.identifer.content,
				Range.create(assign.start, assign.end),
				VarKind.variable,
				undefined
			);
		}
		return [errors, varSym];
	}

	private error(range: Range, message: string): Diagnostic {
		return Diagnostic.create(
			range,
			message
		);
	}
} 

function copyRange(r: Range) {
	return Range.create(r.start, r.end);
}