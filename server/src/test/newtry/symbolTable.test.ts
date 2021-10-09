import * as assert from 'assert';
import { VaribaleSymbol } from '../../parser/newtry/anaylzier/models/symbol';
import { SymbolTable } from '../../parser/newtry/anaylzier/models/symbolTable';
import { ISymType } from '../../parser/newtry/anaylzier/types';
import { Label } from '../../parser/newtry/parser/models/declaration';
import { Factor } from '../../parser/newtry/parser/models/expr';
import * as Stmt from '../../parser/newtry/parser/models/stmt';
import { Literal } from '../../parser/newtry/parser/models/suffixterm';
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
            const sym = new VaribaleSymbol(
                stmt.identifer.content,
                symType
            );
            table.define(sym);
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