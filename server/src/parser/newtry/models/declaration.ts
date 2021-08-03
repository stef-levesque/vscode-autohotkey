import { Position, Range } from 'vscode-languageserver';
import { TokenType } from '../tokenTypes';
import { IExpr, IStmt, Token } from '../types';
import { NodeBase } from './nodeBase';
import { Block, Stmt } from "./stmt";

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
        return this.assigns[this.assigns.length - 1].end;
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
        else {
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

export class Label extends Decl {
    /**
     * @param name name of Label
     */
    constructor(
        public readonly name: Token
    ) {
        super();
    }

    public toLines(): string[] {
        const idLines = this.name.content;
        return [`${idLines}:`];
    }

    public get start(): Position {
        return this.name.start;
    }

    public get end(): Position {
        return this.name.end;
    }

    public get ranges(): Range[] {
        return [this.name];
    }
}

export class Hotkey extends Decl {
    /**
     * 
     * @param key1 First hotkey
     * @param and '&' token
     * @param key2 Second hotkey
     */
    constructor(
        public readonly key1: Key,
        public readonly and?: Token,
        public readonly key2?: Key
    ) {
        super();
    }

    public toLines(): string[] {
        const k1 = this.key1.toLines();
        if (this.and !== undefined &&
            this.key2 !== undefined) {
            const k2 = this.key2.toLines();
            return [`${k1[0]} & ${k2[0]}`]
        }
        return k1;
    }

    public get start(): Position {
        return this.key1.start;
    }

    public get end(): Position {
        return (this.and !== undefined &&
               this.key2 !== undefined) ? 
               this.key2.end :
               this.key1.end;
    }

    public get ranges(): Range[] {
        if (this.and !== undefined &&
            this.key2 !== undefined) {
            return [...this.key1.ranges, this.and, ...this.key2.ranges];
        }
        return this.key1.ranges;
    }
}

export class Key extends NodeBase {
    /**
     * 
     * @param key Key token
     * @param modifiers modifiers of a hotkey
     */
    constructor(
        public readonly key: Token, 
        public readonly modifiers?: Token[]
    ) {
        super();
    }

    public toLines(): string[] {
        if (this.modifiers !== undefined) {
            let modifiersLine = '';
            for (const t of this.modifiers) {
                modifiersLine += t.content;
            }
            return [`${modifiersLine}${this.key.content}`]
        }
        return [`${this.key.content}`];
    }

    public get start(): Position {
        return this.modifiers !== undefined ?
               this.modifiers[0].start:
               this.key.start;
    }

    public get end(): Position {
        return this.key.end;
    }

    public get ranges(): Range[] {
        return this.modifiers !== undefined ?
               this.modifiers.concat(this.key) :
               [this.key];
    }
}

// TODO: need finish
export class FuncDef extends Decl {
    /**
     * @param nameToken name of function
     * @param colon colon token
     */
    constructor(
        public readonly nameToken: Token,
        public readonly params: Param,
        public readonly block: Block
    ) {
        super();
    }

    public toLines(): string[] {
        const idLines = this.nameToken.content;
        const params = this.params.toLines();
        const block = this.block.toLines();    
        params[0] = idLines + params[0];

        return params.concat(block);
    }

    public get start(): Position {
        return this.nameToken.start;
    }

    public get end(): Position {
        return this.block.end;;
    }

    public get ranges(): Range[] {
        return [this.nameToken];
    }
}

export class Param extends Decl {

    constructor(
        public readonly open: Token,
        public readonly requiredParameters: Parameter[],
        public readonly optionalParameters: DefaultParam[],
        public readonly close: Token
    ) {
        super();
    }

    public toLines(): string[] {
        const paramLines = this.requiredParameters
                           .flatMap(param => param.toLines())
                           .join(', ');
        const defaultParamLines = this.optionalParameters
                           .flatMap(param => param.toLines())
                           .join(', ');
        

        let lines: string[] = [];
        // if (
        //     this.requiredParameters.length > 0 &&
        //     this.optionalParameters.length > 0
        // ) {
        //     lines = joinLines(', ', paramLines, defaultParamLines);
        // } else if (this.requiredParameters.length > 0) {
        //     lines = paramLines;
        // } else {
        //     lines = defaultParamLines;
        // }
        lines[lines.length - 1] = `${lines[lines.length - 1]}.`;
        return lines;
    }

    public get start(): Position {
        return this.open.start;
    }

    public get end(): Position {
        return this.close.end;
    }

    public get ranges(): Range[] {
        return [this.open as Range]
               .concat(this.requiredParameters)
               .concat(this.optionalParameters);
            //    .concat([this.end as Range])
    }

    // public accept<T extends (...args: any) => any>(
    //     visitor: IStmtVisitor<T>,
    //     parameters: Parameters<T>,
    // ): ReturnType<T> {
    //     return visitor.visitDeclParameter(this, parameters);
    // }
}

export class Parameter extends NodeBase {
    constructor(public readonly identifier: Token) {
        super();
    }

    public toLines(): string[] {
        return [this.identifier.content];
    }

    public get start(): Position {
        return this.identifier.start;
    }

    public get end(): Position {
        return this.identifier.end;
    }

    public get ranges(): Range[] {
        return [this.identifier];
    }

    public get isKeyword(): boolean {
        return this.identifier.type !== TokenType.id;
    }
}

export class DefaultParam extends Parameter {
    constructor(
        identifier: Token,
        public readonly assign: Token,
        public readonly value: IExpr,
    ) {
        super(identifier);
    }

    public toLines(): string[] {
        const lines = this.value.toLines();
        lines[0] = `${this.identifier.content} ${this.assign.content} ${lines[0]}`;
        return lines;
    }

    public get start(): Position {
        return this.identifier.start;
    }

    public get end(): Position {
        return this.value.end;
    }

    public get ranges(): Range[] {
        return [this.identifier, this.assign, this.value];
    }

    public get isKeyword(): boolean {
        return this.identifier.type !== TokenType.id;
    }
}