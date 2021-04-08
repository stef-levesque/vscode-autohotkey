import * as assert from 'assert';
import { createToken, Token, TokenType } from '../parser/types'
import { Tokenizer } from '../parser/tokenizer';

suite('Command token basic test', () => {
	const cmdTokenStr = '    	SoundGet	, master_mute, , mute';
	const expectTokens = [
		createToken(TokenType.command, 'SoundGet', 0, 7),
		createToken(TokenType.comma, ',', 7, 8),
		createToken(TokenType.string, 'master_mute', 8, 20),
		createToken(TokenType.comma, ',', 20, 21),
		// createToken(TokenType.string, '', 21, 22),
		createToken(TokenType.comma, ',', 22, 23),
		createToken(TokenType.string, 'mute', 23, 28),
		createToken(TokenType.EOF, 'EOF', 29, 29)
	];
	let tokenizer = new Tokenizer(cmdTokenStr);
	let token = tokenizer.GetNextToken();
	let actualTokens: Token[] = [];
	while (token.type != TokenType.EOF) {
		actualTokens.push(token);
		token = tokenizer.GetNextToken();
	}
	actualTokens.push(token);

	test('length test', () => {
		assert.ok(actualTokens.length === expectTokens.length, `acl: ${actualTokens.length} expl: ${expectTokens.length}`);
	});

	test('token content test', () => {
		expectTokens.forEach((expectToken, i) => {
			let actualToken = actualTokens[i];

			assert.strictEqual(actualToken.type, expectToken.type, 'type false index:'+i);
			assert.strictEqual(actualToken.content, expectToken.content, 'content false index:'+i);
			// assert.strictEqual(actualToken.start, expectToken.start, 'start false');
			// assert.strictEqual(actualToken.end, expectToken.end, 'end false');
		})
	});
});

suite('Function token test', () => {
	const cmdTokenStr = '   SoundGet(master_mute, , mute)';
	const expectTokens = [
		createToken(TokenType.id, 'SoundGet', 0, 7),
		createToken(TokenType.openParen, '(', 7, 8),
		createToken(TokenType.id, 'master_mute', 8, 20),
		createToken(TokenType.comma, ',', 20, 21),
		createToken(TokenType.comma, ',', 22, 23),
		createToken(TokenType.id, 'mute', 23, 28),
		createToken(TokenType.closeParen, ')', 30, 31),
		createToken(TokenType.EOF, 'EOF', 32, 32)
	];
	let tokenizer = new Tokenizer(cmdTokenStr);
	let token = tokenizer.GetNextToken();
	let actualTokens: Token[] = [];
	while (token.type != TokenType.EOF) {
		actualTokens.push(token);
		token = tokenizer.GetNextToken();
	}
	actualTokens.push(token);

	test('length test', () => {
		assert.ok(actualTokens.length === expectTokens.length, `acl: ${actualTokens.length} expl: ${expectTokens.length}`);
	});

	test('token content test', () => {
		expectTokens.forEach((expectToken, i) => {
			let actualToken = actualTokens[i];

			assert.strictEqual(actualToken.type, expectToken.type, 'type false index:'+i);
			assert.strictEqual(actualToken.content, expectToken.content, 'content false index:'+i);
			// assert.strictEqual(actualToken.start, expectToken.start, 'start false');
			// assert.strictEqual(actualToken.end, expectToken.end, 'end false');
		})
	});
});