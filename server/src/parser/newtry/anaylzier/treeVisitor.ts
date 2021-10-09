import { IStmtVisitor } from '../types';
import * as Expr from '../parser/models/expr';
import * as Stmt from '../parser/models/stmt';
import * as SuffixTerm from '../parser/models/suffixterm';
import * as Decl from '../parser/models/declaration';

export abstract class TreeVisitor<T> implements IStmtVisitor<() => T> {
	constructor() {
	}

	visitDeclVariable(decl: Decl.VarDecl): T {
		throw new Error('Need Implentment');
	}
	visitDeclClass(decl: Decl.ClassDef): T {
		throw new Error('Need Implentment');
	}
	visitDeclHotkey(decl: Decl.Hotkey): T {
		throw new Error('Need Implentment');
	}
	visitDeclHotString(decl: Decl.HotString): T {
		throw new Error('Need Implentment');
	}
	visitDeclFunction(decl: Decl.FuncDef): T {
		throw new Error('Need Implentment');
	}
	visitDeclParameter(decl: Decl.Param): T {
		throw new Error('Need Implentment');
	}
	visitDeclLabel(decl: Decl.Label): T {
		throw new Error('Need Implentment');
	}

	visitStmtInvalid(
		stmt: Stmt.Invalid,
	): T {
		throw new Error('Need Implentment');
	}
	visitDrective(stmt: Stmt.Drective): T {
		throw new Error('Need Implentment');
	}
	visitBlock(stmt: Stmt.Block): T {
		throw new Error('Need Implentment');
	}
	visitExpr(stmt: Stmt.ExprStmt): T {
		throw new Error('Need Implentment');
	}
	visitAssign(stmt: Stmt.AssignStmt): T {
		throw new Error('Need Implentment');
	}
	// visitCommand(stmt: Stmt.Command): T {
	// throw new Error('Need Implentment');
	// }
	// visitCommandExpr(
	//   stmt: Stmt.CommandExpr,
	//   parameters: [],
	// ): T {
	// throw new Error('Need Implentment');
	// }
	visitIf(stmt: Stmt.If): T {
		throw new Error('Need Implentment');
	}
	visitElse(stmt: Stmt.Else): T {
		throw new Error('Need Implentment');
	}
	visitReturn(stmt: Stmt.Return): T {
		throw new Error('Need Implentment');
	}
	visitBreak(stmt: Stmt.Break): T {
		throw new Error('Need Implentment');
	}
	visitSwitch(stmt: Stmt.SwitchStmt): T {
		throw new Error('Need Implentment');
	}
	visitCase(stmt: Stmt.CaseStmt): T {
		throw new Error('Need Implentment');
	}
	visitLoop(stmt: Stmt.LoopStmt): T {
		throw new Error('Need Implentment');
	}
	visitWhile(stmt: Stmt.WhileStmt): T {
		throw new Error('Need Implentment');
	}
	visitFor(stmt: Stmt.ForStmt): T {
		throw new Error('Need Implentment');
	}
	visitTry(stmt: Stmt.TryStmt): T {
		throw new Error('Need Implentment');
	}
	visitCatch(stmt: Stmt.CatchStmt): T {
		throw new Error('Need Implentment');
	}
	visitFinally(stmt: Stmt.FinallyStmt): T {
		throw new Error('Need Implentment');
	}
}