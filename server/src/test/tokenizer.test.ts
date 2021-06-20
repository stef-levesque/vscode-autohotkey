import * as assert from 'assert';
import { createToken, Token, TokenType } from '../parser/types'
import { Tokenizer } from '../parser/tokenizer';
function getalltoken(text: string): Token[] {
	let tokenizer = new Tokenizer(text);
	let token = tokenizer.GetNextToken();
	let actualTokens: Token[] = [];
	while (token.type != TokenType.EOF) {
		actualTokens.push(token);
		token = tokenizer.GetNextToken();
	}
	actualTokens.push(token);
	return actualTokens;
}

suite('Basic Token Test', () => {

	test('float', () => {
		let actualTokens = getalltoken('1.324 .234');
		assert.deepStrictEqual(actualTokens[0], createToken(TokenType.number, '1.324', 0, 5));
		assert.deepStrictEqual(actualTokens[1], createToken(TokenType.number, '.234', 6, 10));
	});

	test('string', () => {
		let actualTokens = getalltoken('"123" "AHK是世界第一的热键语言"');
		assert.deepStrictEqual(actualTokens[0], createToken(TokenType.string, '123', 0, 5));
		assert.deepStrictEqual(actualTokens[1], createToken(TokenType.string, 'AHK是世界第一的热键语言', 6, 21));
	})

	test('identifer', () => {
		let actualTokens = getalltoken('AHKisHotkey DllCall');
		assert.deepStrictEqual(actualTokens[0], createToken(TokenType.id, 'AHKisHotkey', 0,  11));
		assert.deepStrictEqual(actualTokens[1], createToken(TokenType.id, 'DllCall', 12, 19));
	})

	test('drective', () => {
		let actualTokens = getalltoken('#IfWinActive WinTitle'); 
		assert.strictEqual(actualTokens[0].content, 'IfWinActive');
		assert.strictEqual(actualTokens[0].type, TokenType.drective);
		assert.strictEqual(actualTokens[1].content, 'WinTitle');
	})

	test('mark', () => {
		let actualTokens = getalltoken('^ >>= ||');
		assert.strictEqual(actualTokens[0].type, TokenType.xor);
		assert.strictEqual(actualTokens[1].type, TokenType.rshifteq);
		assert.strictEqual(actualTokens[2].type, TokenType.logicor);
	})
});

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

	let actualTokens: Token[] = getalltoken(cmdTokenStr);

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
	const cmdTokenStr = '   SoundGet(master_mute, 1.334, mute)';
	const expectTokens = [
		createToken(TokenType.id, 'SoundGet', 0, 7),
		createToken(TokenType.openParen, '(', 7, 8),
		createToken(TokenType.id, 'master_mute', 8, 20),
		createToken(TokenType.comma, ',', 20, 21),
		createToken(TokenType.number, "1.334", 25, 30),
		createToken(TokenType.comma, ',', 30, 31),
		createToken(TokenType.id, 'mute', 32, 36),
		createToken(TokenType.closeParen, ')', 36, 37),
		createToken(TokenType.EOF, 'EOF', 37, 37)
	];

	let actualTokens: Token[] = getalltoken(cmdTokenStr);

	test('length test', () => {
		assert.ok(actualTokens.length === expectTokens.length, `acl: ${actualTokens.length} expl: ${expectTokens.length}`);
	});

	test('token content test', () => {
		expectTokens.forEach((expectToken, i) => {
			let actualToken = actualTokens[i];
			assert.strictEqual(actualToken.type, expectToken.type, 'type false index:'+i);
			assert.strictEqual(actualToken.content, expectToken.content, 'content false index:'+i);
		})
	});
});