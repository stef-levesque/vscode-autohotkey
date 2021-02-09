import {Lexer} from '../parser/ahkparser'
import { TextDocument } from 'vscode-languageserver-textdocument'
import * as Path from 'path';
import { IoService } from '../services/ioService';
import * as assert from 'assert';
import { SymbolKind } from 'vscode-languageserver';
import { stderr } from 'process';

suite('AHK regex parser test', () => {
	const ioService = new IoService();
	const path = Path.join( 'client','testFixture', 'completion.ahk');
	console.log(path);
	let parser: Lexer;
	before(async (done) => {
		const file = await ioService.load(path);
		if (file)
			console.log('File loaded');
		else
			console.log('File load fail')
		
		const doc = TextDocument.create(path, 'ahk', 0, file);
		parser = new Lexer(doc);
		done();
	})

	test('General test', () => {
		const docinfo = parser.Parse();
		const tree = docinfo.tree;
		assert.strictEqual(tree[0].kind, SymbolKind.Function)
	});
});
