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

function atomUnpackTest(value: IExpr, testFunc: (atom: Atom) => void) {
	assert.strictEqual(value instanceof Expr.factor, true);
	if (value instanceof Expr.factor) {
		assert.strictEqual(value.trailer, undefined);
		assert.strictEqual(value.suffixTerm instanceof SuffixTerm.SuffixTerm, true);
		if (value.suffixTerm instanceof SuffixTerm.SuffixTerm) {
			assert.strictEqual(value.suffixTerm.trailers.length, 0);
			testFunc(value.suffixTerm.atom);
		}
	}
};

function arrayUnpackTest(value: IExpr, testFunc: (atom: Atom, index: number) => void) {
	atomUnpackTest(value, arrayTerm => {
		assert.strictEqual(arrayTerm instanceof SuffixTerm.ArrayTerm, true);
		if (arrayTerm instanceof SuffixTerm.ArrayTerm) {
			let i = 0;
			for (const item of arrayTerm.items) {
				atomUnpackTest(item, atom => {
					testFunc(atom, i);
				});
				i++;
			}
		}
	});
}

function aarrayUnpackTest(value: IExpr, 
	testKeyFunc: (atom: Atom, index: number) => void,
	testValueFunc: (atom: Atom, index: number) => void) {
	atomUnpackTest(value, arrayTerm => {
		assert.strictEqual(arrayTerm instanceof SuffixTerm.AssociativeArray, true);
		if (arrayTerm instanceof SuffixTerm.ArrayTerm) {
			let i = 0;
			for (const item of arrayTerm.items) {
				atomUnpackTest(item, atom => {
					testKeyFunc(atom, i);
				});
				atomUnpackTest(item, atom => {
					testValueFunc(atom, i);
				});
				i++;
			}
		}
	});
}

suite('Syntax Parser Expresion Test', () => {
	test('basic valid literal', () => {
		const expects = [
			AtomTestItem('15', TokenType.number, '15'),
			AtomTestItem('1.234', TokenType.number, '1.234'),
			AtomTestItem('"Test string"', TokenType.string, 'Test string'),
			AtomTestItem('"true if until"', TokenType.string, 'true if until')
		];
		for (const expect of expects) {
			const actuals = getExpr(expect.source);
			assert.strictEqual(actuals.errors.length, 0);

			atomUnpackTest(actuals.value, atom => {
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

	test('basic array', () => {
		const expects = [
			AtomTestItem('1', TokenType.number, '1'),
			AtomTestItem('1.234', TokenType.number, '1.234'),
			AtomTestItem('"AHKL"', TokenType.string, 'AHKL')
		];
		const actuals = getExpr('[1, 1.234, "AHKL"]');
		assert.strictEqual(actuals.errors.length, 0);
		arrayUnpackTest(actuals.value, (item, index) => {
			assert.strictEqual(item instanceof SuffixTerm.Literal, true);
			if (item instanceof SuffixTerm.Literal) {
				assert.strictEqual(expects[index].type, item.token.type);
				assert.strictEqual(expects[index].literal, item.token.content);
			}
		})
	});

	test('basic associative array', () => {
		const expects = [
			[
				AtomTestItem('"key"', TokenType.string, 'key'),
				AtomTestItem('"value"', TokenType.string, 'value')
			],
			[
				AtomTestItem('123', TokenType.number, '123'),
				AtomTestItem('12.12', TokenType.number, '12.12')
			],
			[
				AtomTestItem('abc', TokenType.id, 'abc'),
				AtomTestItem('def', TokenType.id, 'def')
			]
		];
		const actuals = getExpr('{"key": "value", 123: 12.12, abc: def}');
		assert.strictEqual(actuals.errors.length, 0);
		aarrayUnpackTest(
			actuals.value,
			(key, index) => {
				assert.strictEqual(key instanceof SuffixTerm.Literal, true);
				if (key instanceof SuffixTerm.Literal) {
					assert.strictEqual(expects[index][0].type, key.token.type);
					assert.strictEqual(expects[index][0].literal, key.token.content);
				}
			},
			(value, index) => {
				assert.strictEqual(value instanceof SuffixTerm.Literal, true);
				if (value instanceof SuffixTerm.Literal) {
					assert.strictEqual(expects[index][1].type, value.token.type);
					assert.strictEqual(expects[index][1].literal, value.token.content);
				}
			}
		);
	})
});