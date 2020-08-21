import {Lexer} from '../ahkparser'
import { TextDocument } from 'vscode-languageserver-textdocument'
import * as path from 'path';
import { open } from 'fs';

// suite('AHK parser test', () => {
// 	suiteSetup(() => {
// 		const file = open(path.join('..', 'data', 'test.ahk'), 'r', 'r');
		
// 		const doc = TextDocument.create(file, 'ahk', 1, file.)
// 		const parser = new Lexer()
// 	})
// })