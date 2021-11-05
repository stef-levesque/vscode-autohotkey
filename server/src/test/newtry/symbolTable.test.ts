import * as assert from 'assert';
import { Range } from 'vscode-languageserver-types';
import { VaribaleSymbol } from '../../parser/newtry/analyzer/models/symbol';
import { SymbolTable } from '../../parser/newtry/analyzer/models/symbolTable';
import { ISymType, VarKind } from '../../parser/newtry/analyzer/types';
import { Label } from '../../parser/newtry/parser/models/declaration';
import { Expr, Factor } from '../../parser/newtry/parser/models/expr';
import * as Stmt from '../../parser/newtry/parser/models/stmt';
import { Identifier, Literal } from '../../parser/newtry/parser/models/suffixterm';
import { AHKParser } from "../../parser/newtry/parser/parser";
import { TokenType } from '../../parser/newtry/tokenizor/tokenTypes';
import { IExpr, IStmt, Token } from '../../parser/newtry/types';

function getAST(s: string) {
    let parser = new AHKParser(s, 'testFile');
    const AST = parser.parse();
    return AST;
}

function builtTable(AST: IStmt[]): SymbolTable {
    let table = new SymbolTable('global', 1, undefined);
    for (const stmt of AST) {
        if (stmt instanceof Stmt.AssignStmt) {
            const atom = unpackExpr(stmt.expr);
            if (atom === undefined) continue;
            let symType: Maybe<ISymType> = undefined;
            if (atom.type === TokenType.string) {
                symType = table.resolve('string');
            }
            else if (atom.type === TokenType.number) {
                symType = table.resolve('number');
            }
            if (symType === undefined) continue;
            const latom = stmt.left.suffixTerm.atom;
            if (latom instanceof Identifier) {
                const sym = new VaribaleSymbol(
                    latom.token.content,
                    Range.create(stmt.start, stmt.end),
                    VarKind.variable,
                    symType
                );
                table.define(sym);
            }
        }
    }
    return table;
}

function unpackExpr(expr: IExpr): Maybe<Token> {
    if (expr instanceof Factor) {
        const atom = expr.suffixTerm.atom
        if (atom instanceof Literal) {
            return atom.token;
        }
    }
}

suite('Symbol Table Test', () => {
    test('one scoop table', () => {
        const file = `
        a := 1234
        b := "AHK"
        `;
        const AST = getAST(file);
        assert.strictEqual(AST.sytanxErrors.length, 0, 'Syntax error');
        assert.strictEqual(AST.tokenErrors.length, 0, 'token error');
        const stmts = AST.script.stmts;
        const table = builtTable(stmts);
        console.log(table.toString());
    })
})