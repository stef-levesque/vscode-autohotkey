import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument'
import { SymbolKind } from 'vscode-languageserver-types';
import { Lexer } from "../parser/ahkparser";
import { NodeMatcher, ScriptFinder } from '../parser/scriptFinder';
import { FuncNode, IFindResult } from '../parser/types';

suite('Script Finder Test', () => {
    const ahkFile = `Supper(self, params*)
    {
        upper := new self.base.base(params*)
        for k, v in upper
            if !IsObject(v) 
                self[k] := upper[k]
    }
    
    class A 
    {
        __New(a, b)
        {
            this.a := a
            this.b := b
            return this
        }
    
        mdzz()
        {
            return "mdzz"
        }
    
        x[]
        {
            get {
                return "abc"
            }
        }
    }
    
    class B extends A
    {
        __New(a, b, c)
        {
            Supper(this, a, b) 
            this.c := c
        }

        ans()
        {
            return 42
        }
    } 
    bb := new B(1,2,3)
    MsgBox, % bb.a
    `;
    let lexer = new Lexer(TextDocument.create('A://virtual.ahk', 'ahk', 0, ahkFile));
    const docinfo = lexer.Parse();
    
    test('find function', () => {
        let finder = new ScriptFinder([new NodeMatcher('Supper', SymbolKind.Function)], 
                                    docinfo.tree, 
                                    'A://virtual.ahk', []);
        let res = finder.find();
        assert.ok(res, 'Find Fail');
        assert.strictEqual(res.node instanceof FuncNode, true, 'Type fail');
        assert.strictEqual(res.node.name, 'Supper', 'Name find fail');
        assert.strictEqual(res.node.kind, SymbolKind.Function, 'Kind find fail');
    });

    test('find method', () => {
        let finder = new ScriptFinder([
            new NodeMatcher('A', SymbolKind.Class),
            new NodeMatcher('mdzz', SymbolKind.Function)
        ], docinfo.tree, 
        'A://virtual.ahk', []);
        let res = finder.find();
        assert.ok(res, 'Find Fail');
        assert.strictEqual(res.node instanceof FuncNode, true, 'Type fail');
        assert.strictEqual(res.node.name, 'mdzz', 'Name find fail');
        assert.strictEqual(res.node.kind, SymbolKind.Function, 'Kind find fail');
    });

    test('find var reference', () => {
        let finder = new ScriptFinder([
            new NodeMatcher('bb'),
            new NodeMatcher('ans')
        ], docinfo.tree, 
        'A://virtual.ahk', []);
        let res = finder.find();
        assert.ok(res, 'Find Fail');
        assert.strictEqual(res.node instanceof FuncNode, true, 'Type fail');
        assert.strictEqual(res.node.name, 'ans', 'Name find fail');
        assert.strictEqual(res.node.kind, SymbolKind.Function, 'Kind find fail');
    });
});