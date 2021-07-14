import * as assert from 'assert';
import { AHKParser } from "../../parser/newtry/parser";
// import { Tokenizer } from "../../parser/newtry/tokenizer";
import { Atom, IExpr } from "../../parser/newtry/types";
import { TokenType } from "../../parser/newtry/tokenTypes";
import * as Expr from '../../parser/newtry/models/expr';
import * as SuffixTerm from '../../parser/newtry/models/suffixterm';

function getExpr(s: string) {
	const p = new AHKParser(s);
	return p.testExpr();
}

interface IAtomTestItem {
	source: string;
	type: TokenType;
	literal: any;
}

function AtomTestItem(source: string, type: TokenType, literal: any): IAtomTestItem {
	return {
		source: source,
		type: type,
		literal: literal
	};
}

function atomUnpackTest(value: IExpr, testFunct: (atom: Atom) => void) {
	assert.strictEqual(value instanceof Expr.factor, true);
	if (value instanceof Expr.factor) {
		assert.strictEqual(value.trailer, undefined);
		assert.strictEqual(value.suffixTerm instanceof SuffixTerm.SuffixTerm, true);
		if (value.suffixTerm instanceof SuffixTerm.SuffixTerm) {
			assert.strictEqual(value.suffixTerm.trailers.length, 0);
			testFunct(value.suffixTerm.atom);
		}
	}
};

suite('Syntax Parser Expresion Test', () => {
	test('basic valid literal', () => {
		const expects = [
			AtomTestItem('15', TokenType.number, '15'),
			AtomTestItem('1.234', TokenType.number, '1.234'),
			AtomTestItem('"Test string"', TokenType.string, 'Test string'),
			AtomTestItem('"true if until"', TokenType.string, 'true if until')
		];
		for (const expect of expects) {
			let actual = getExpr(expect.source);
			assert.strictEqual(actual.errors.length, 0);

			atomUnpackTest(actual.value, atom => {
				assert.strictEqual(atom instanceof SuffixTerm.Literal, true);
				if (atom instanceof SuffixTerm.Literal) {
					assert.strictEqual(atom.token.type, expect.type);
					assert.strictEqual(atom.token.content, expect.literal);
				}
			});
		}
	});

	// test('basic invalid literal', () => {
		
	// });
	
	test('basic valid expression', () => {
		const actual = getExpr('1+3*2-12/3');
		assert.strictEqual(actual.value.toString(), '1 + 3 * 2 - 12 / 3');
	});
});