import {Lexer} from '../parser/regParser/ahkparser'
import { TextDocument } from 'vscode-languageserver-textdocument'
import * as Path from 'path';
import { IoService } from '../services/ioService';
import * as assert from 'assert';
import { SymbolKind } from 'vscode-languageserver';

suite('AHK regex parser test', () => {
	const ioService = new IoService();
	const path = Path.join('client','testFixture', 'completion.ahk');
	let doc: TextDocument;
	let file:string;
	let parser: Lexer;
	setup((done) => {
		ioService.load(path)
			.then(res => {
				file = res;
				doc = TextDocument.create(path, 'ahk', 0, file);
				parser = new Lexer(doc);
				done();
			})
			.catch(err => {
				done(err);
			});
	})

	test('General test', () => {
		const docinfo = parser.Parse();
		const tree = docinfo.tree;
		const expectTree = [
			['TestFunc', SymbolKind.Function],
			['TestClass', SymbolKind.Class],
			['ScopedFunc', SymbolKind.Function]
		];
		tree.forEach((act, index) => {
			assert.strictEqual(act.name, expectTree[index][0], `Name error. expect: ${expectTree[index][0]} got ${act.name}`);
			assert.strictEqual(act.kind, expectTree[index][1], `Kind error. expect: ${expectTree[index][1]} got ${act.kind}`);
		});
	});
});
