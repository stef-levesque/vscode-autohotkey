import { IStmt, IScript, SyntaxKind, Token } from '../types';
import { Range, Position, Location } from 'vscode-languageserver';
import { NodeBase } from '../parser/models/nodeBase';

export class Script extends NodeBase implements IScript {
    constructor(
        public readonly uri: string,
        public readonly stmts: IStmt[],
        public readonly tokens: Token[],
        public readonly comments: Token[],
	    public readonly include?: Set<string>) {
        super();
    }

    public toLines(): string[] {
        return this.stmts.flatMap(stmt => stmt.toLines());
    }

    public get start(): Position {
        if (this.stmts.length === 0) {
            return Position.create(0, 0);
        }

        return this.stmts[0].start;
    }

    public get end(): Position {
        if (this.stmts.length === 0) {
            return Position.create(0, 0);
        }

        return this.stmts[this.stmts.length - 1].end;
    }

    public get ranges(): Range[] {
        return [...this.stmts];
    }

    toLocation(): Location {
        return { uri: this.uri, range: { start: this.start, end: this.end } };
    }

    public get tag(): SyntaxKind.script {
        return SyntaxKind.script;
    }
}