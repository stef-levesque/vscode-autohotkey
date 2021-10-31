import { Diagnostic } from 'vscode-languageserver-types';
import { Range } from 'vscode-languageserver';
import { TreeVisitor } from './treeVisitor';
import * as Stmt from '../parser/models/stmt';
import * as Decl from '../parser/models/declaration';
import * as Expr from '../parser/models/expr';
import * as SuffixTerm from '../parser/models/suffixterm';
import { SymbolTable } from './models/symbolTable';
import { IExpr, IScript } from '../types';
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
		this.enterScoop(sym);
		const errors = decl.body.accept(this, []);
		this.leaveScoop();
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

		if (this.currentScoop === this.supperGlobal) {
			this.supperGlobal.define(objTable);
		} 
		else {
			this.currentScoop.define(objTable);
		}
		this.enterScoop(objTable);
		errors.push(... decl.body.accept(this, []));
		this.leaveScoop();
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

	public visitDrective(stmt: Stmt.Drective): Diagnostics {
		// Nothing to do in first scanning
		return [];
	}

	public visitBlock(stmt: Stmt.Block): Diagnostics {
		const errors: Diagnostics = [];
		for (const singleStmt of stmt.stmts) {
			const e = singleStmt.accept(this, []);
			errors.push(e);
		}
		return errors;
	}

	public visitAssign(stmt: Stmt.AssignStmt): Diagnostics {
		const errors: Diagnostics = [];
		const sym = new VaribaleSymbol(
			stmt.identifer.content,
			copyRange(stmt),
			VarKind.variable,
			undefined
		);
		this.currentScoop.define(sym);
		errors.push(...this.processExpr(stmt.expr));
		return errors;
	}

	public visitExpr(stmt: Stmt.ExprStmt): Diagnostics {
		return this.processExpr(stmt.suffix);
	}

	private processExpr(expr: IExpr): Diagnostics {
		const errors: Diagnostics = [];
		if (expr instanceof Expr.Factor) {
			if (!expr.trailer) {
				const atom = expr.suffixTerm.atom;
				if (atom instanceof SuffixTerm.Identifier) {
					// Only check varible defination in first scanning
					const idName = atom.token.content;
					if (!this.currentScoop.resolve(idName))
						errors.push(this.error(
							copyRange(atom),
							'Variable is used before defination'
						))
				}
			}
		}
		else if (expr instanceof Expr.Unary) {
			errors.push(...this.processExpr(expr.factor));
		}
		else if (expr instanceof Expr.Binary) {
			errors.push(...this.processExpr(expr.left));
			errors.push(...this.processExpr(expr.right));
		}
		else if (expr instanceof Expr.Ternary) {
			errors.push(...this.processExpr(expr.condition));
			errors.push(...this.processExpr(expr.trueExpr));
			errors.push(...this.processExpr(expr.falseExpr));
		}
		
		return errors;
	}

	public visitIf(stmt: Stmt.If): Diagnostics {
		const condExpr = stmt.condition;
		const errors: Diagnostics = [...this.processExpr(condExpr)];
		errors.push(...stmt.body.accept(this, []));
		if (stmt.elseStmt) {
			const elseStmt = stmt.elseStmt;
			errors.push(...elseStmt.accept(this, []));
		}
		return errors;
	}

	public visitElse(stmt: Stmt.Else): Diagnostics {
		const erorrs: Diagnostics = [];
		// TODO: else if
		erorrs.push(...stmt.body.accept(this, []));
		return erorrs;
	}

	public visitReturn(stmt: Stmt.Return): Diagnostics {
		// If any value returns process them
		if (stmt.value) {
			return this.processExpr(stmt.value)
		}
		return [];
	}

	public visitBreak(stmt: Stmt.Break): Diagnostics {
		// Nothing need to do with break in propcesss
		// Since label can be defined after break
		return [];
	}

	public visitSwitch(stmt: Stmt.SwitchStmt): Diagnostics {
		const errors: Diagnostics = [...this.processExpr(stmt.condition)];
		// process every case
		for (const caseStmt of stmt.cases) {
			errors.push(...caseStmt.accept(this, []));
		}

		return errors;
	}

	public visitCase(stmt: Stmt.CaseStmt): Diagnostics {
		const errors: Diagnostics = [];
		// if is case <experssion>, process every expressions
		if (stmt.CaseNode instanceof Stmt.CaseExpr) {
			for (const cond of stmt.CaseNode.conditions) {
				errors.push(...this.processExpr(cond));
			}
		}
		// process every single statement under this case
		for (const s of stmt.body) {
			errors.push(...s.accept(this, []));
		}

		return errors;
	}

	public visitLoop(stmt: Stmt.LoopStmt): Diagnostics {
		const errors: Diagnostics = [];
		// loop <expression> body
		if (stmt instanceof Stmt.Loop) {
			// if any expression
			if (stmt.condition)
				errors.push(...this.processExpr(stmt.condition));
			errors.push(...stmt.body.accept(this, []));
			return errors;
		}

		// loop body until <expression>
		errors.push(...stmt.body.accept(this, []));
		errors.push(...this.processExpr(stmt.condition));
		return errors;
	}

	public visitWhile(stmt: Stmt.WhileStmt): Diagnostics {
		const errors: Diagnostics = [...this.processExpr(stmt.condition)];
		errors.push(...stmt.body.accept(this, []));
		return errors;
	}

	public visitFor(stmt: Stmt.ForStmt): Diagnostics {
		// check if iter varible is defined, if not define them
		if (!this.currentScoop.resolve(stmt.iter1id.content)) {
			const sym = new VaribaleSymbol(
				stmt.iter1id.content,
				copyRange(stmt.iter1id),
				VarKind.variable,
				undefined
			)
			this.currentScoop.define(sym);
		}
		if (stmt.iter2id) {
			const sym = new VaribaleSymbol(
				stmt.iter1id.content,
				copyRange(stmt.iter2id),
				VarKind.variable,
				undefined
			)
			this.currentScoop.define(sym);
		}
		return stmt.body.accept(this, []);
	}

	public visitTry(stmt: Stmt.TryStmt): Diagnostics {
		const errors: Diagnostics = [];
		errors.push(...stmt.body.accept(this, []));
		if (stmt.catchStmt) {
			errors.push(...stmt.catchStmt.accept(this, []));
		}
		if (stmt.finallyStmt) {
			errors.push(...stmt.finallyStmt.accept(this, []));
		}
		return errors;
	}

	public visitCatch(stmt: Stmt.CatchStmt): Diagnostics {
		// check if output varible is defined, if not define it
		if (!this.currentScoop.resolve(stmt.errors.content)) {
			const sym = new VaribaleSymbol(
				stmt.errors.content,
				copyRange(stmt.errors),
				VarKind.variable,
				undefined
			);
			this.currentScoop.define(sym);
		}
		return stmt.body.accept(this, []);
	}

	public visitFinally(stmt: Stmt.FinallyStmt): Diagnostics {
		return stmt.body.accept(this, []);
	}

	private enterScoop(scoop: IScoop) {
		this.stack.push(scoop);
		this.currentScoop = scoop;
	}

	private leaveScoop() {
		this.stack.pop();
		this.currentScoop = this.stack[-1];
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