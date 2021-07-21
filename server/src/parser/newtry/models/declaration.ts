import { Position, Range } from 'vscode-languageserver';
import { IExpr, Token } from '../types';
import { Stmt } from "./stmt";

export abstract class Decl extends Stmt {
    constructor() {
        super();
    }
}

/**
 * Class contains all varible declaration
 */
export class VarDecl extends Decl {
    /**
     * varible declaration
     * @param scope varibles' scope
     * @param assigns varibles or assignment related to variables
     */
    constructor(
        public readonly scope: Token,
        public readonly assigns: OptionalAssginStmt[]
    ) {
        super();
    }

    public toLines(): string[] {
        const scopeLine = this.scope.content;
        const assignsLines = this.assigns.flatMap(assign => assign.toLines());
        assignsLines[0] = scopeLine + assignsLines[0];
        return assignsLines;
    }

    public get start(): Position {
        return this.scope.start;
    }

    public get end(): Position {
        return this.assigns[this.assigns.length-1].end;
    }

    public get ranges(): Range[] {
        return [this.scope as Range]
            .concat(this.assigns.flatMap(assign => assign.ranges));
    }
}

/**
 * Assignment statement for declarations,
 * part of assignment is optional
 */
export class OptionalAssginStmt extends Stmt {
    /**
     * 
     * @param identifer varible identifer
     * @param assign assign token
     * @param expr expresions
     */
    constructor(
        public readonly identifer: Token,
        public readonly assign?: Token,
        public readonly expr?: IExpr
    ) {
        super();
    }

    public toLines(): string[] {
		const idLines = this.identifer.content;
        if (this.assign !== undefined && this.expr !== undefined) {
            const exprLines = this.expr.toLines();
            const assignLines = this.assign.content;
            exprLines[0] = `${idLines} ${assignLines} ${exprLines[0]}`
            return exprLines;
        }
        else{
            return [idLines];   
        }
	}

	public get start(): Position {
		return this.identifer.start;
	}

	public get end(): Position {
		return this.expr !== undefined ?
               this.expr.end :
               this.identifer.end;
	}

	public get ranges(): Range[] {
		return (this.expr !== undefined && this.assign !== undefined) ?
               [this.identifer, this.assign, this.expr] :
               [this.identifer];
	}
}