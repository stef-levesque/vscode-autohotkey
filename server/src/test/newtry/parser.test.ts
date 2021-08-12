import * as assert from 'assert';
import { AHKParser } from "../../parser/newtry/parser/parser";
// import { Tokenizer } from "../../parser/newtry/tokenizer";
import { Atom, IExpr, SuffixTermTrailer } from "../../parser/newtry/types";
import { TokenType } from "../../parser/newtry/tokenizor/tokenTypes";
import * as Expr from '../../parser/newtry/parser/models/expr';
import * as SuffixTerm from '../../parser/newtry/parser/models/suffixterm';
import * as Decl from '../../parser/newtry/parser/models/declaration';

function getExpr(s: string) {
	const p = new AHKParser(s, '');
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
	assert.strictEqual(value instanceof Expr.Factor, true);
	if (value instanceof Expr.Factor) {
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
	atomUnpackTest(value, aarray => {
		assert.strictEqual(aarray instanceof SuffixTerm.AssociativeArray, true);
		if (aarray instanceof SuffixTerm.AssociativeArray) {
			let i = 0;
			for (const pair of aarray.pairs) {
				atomUnpackTest(pair.key, atom => {
					testKeyFunc(atom, i);
				});
				atomUnpackTest(pair.value, atom => {
					testValueFunc(atom, i);
				});
				i++;
			}
		}
	});
}

function factorUpackTest(
	value: IExpr,
	atomTest: (atom: Atom) => void,
	...trailerTests: ((trailer: SuffixTermTrailer) => void)[]
) {
	assert.strictEqual(value instanceof Expr.Factor, true);
	if (value instanceof Expr.Factor) {
		assert.strictEqual(value.trailer, undefined);
		assert.strictEqual(value.suffixTerm instanceof SuffixTerm.SuffixTerm, true);
		if (value.suffixTerm instanceof SuffixTerm.SuffixTerm) {
			assert.strictEqual(trailerTests.length, value.suffixTerm.trailers.length);
			atomTest(value.suffixTerm.atom);

			for (let i = 1; i < value.suffixTerm.trailers.length; i += 1) {
				trailerTests[i](value.suffixTerm.trailers[i]);
			}
		}
	}
};

interface ICallTest {
	source: string;
	callee: string;
	args: Function[];
  }

function callTest(
	source: string,
	callee: string,
	args: Constructor<SuffixTerm.SuffixTermBase>[],
): ICallTest {
	return { source, callee, args };
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
		const actual = getExpr('a:=1+3*2-12/3');
		assert.strictEqual(actual.errors.length, 0);
		assert.strictEqual(actual.value instanceof Expr.Binary, true);
		assert.strictEqual(actual.value.toString(), 'a := 1 + 3 * 2 - 12 / 3');
	});

	test('operator eol', () => {
		const actuals = getExpr(`123
		
		+ 99`);
		assert.strictEqual(actuals.errors.length, 0);
		assert.strictEqual(actuals.value instanceof Expr.Binary, true);
		if (actuals.value instanceof Expr.Binary) {
			atomUnpackTest(actuals.value.left, atom => {
				assert.strictEqual(atom instanceof SuffixTerm.Literal, true);
				if (atom instanceof SuffixTerm.Literal) {
					assert.strictEqual(atom.token.content, '123');
				}
			});
			assert.strictEqual(actuals.value.operator.type, TokenType.plus);
			atomUnpackTest(actuals.value.right, atom => {
				assert.strictEqual(atom instanceof SuffixTerm.Literal, true);
				if (atom instanceof SuffixTerm.Literal) {
					assert.strictEqual(atom.token.content, '99');
				}
			});
		}
	});

	test('postfix operator', () => {
		const actuals = getExpr('a+++10');
		assert.strictEqual(actuals.errors.length, 0);
		assert.strictEqual(actuals.value instanceof Expr.Binary, true);
		if (actuals.value instanceof Expr.Binary) {
			assert.strictEqual(actuals.value.left instanceof Expr.Unary, true);
			if (actuals.value.left instanceof Expr.Unary) {
				factorUpackTest(actuals.value.left.factor, atom => {
					assert.strictEqual(atom instanceof SuffixTerm.Identifier, true);
					if (atom instanceof SuffixTerm.Identifier) {
						assert.strictEqual(atom.token.content, 'a');
					}
				});
				assert.strictEqual(actuals.value.left.operator.type, TokenType.pplus);
			}
			assert.strictEqual(actuals.value.operator.type, TokenType.plus);
			atomUnpackTest(actuals.value.right, atom => {
				assert.strictEqual(atom instanceof SuffixTerm.Literal, true);
				if (atom instanceof SuffixTerm.Literal) {
					assert.strictEqual(atom.token.content, '10');
				}
			});
		}
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
				if (index === 2) 
					assert.strictEqual(key instanceof SuffixTerm.Identifier, true);
				else
					assert.strictEqual(key instanceof SuffixTerm.Literal, true);
				if (key instanceof SuffixTerm.Literal) {
					assert.strictEqual(expects[index][0].type, key.token.type);
					assert.strictEqual(expects[index][0].literal, key.token.content);
				}
			},
			(value, index) => {
				if (index === 2) 
					assert.strictEqual(value instanceof SuffixTerm.Identifier, true);
				else
					assert.strictEqual(value instanceof SuffixTerm.Literal, true);
				if (value instanceof SuffixTerm.Literal) {
					assert.strictEqual(expects[index][1].type, value.token.type);
					assert.strictEqual(expects[index][1].literal, value.token.content);
				}
			}
		);
	});

	test('basic valid call test', () => {
		const expects = [
			callTest('test(100, "water")', 'test', [
				SuffixTerm.Literal,
				SuffixTerm.Literal
			]),
			callTest('自动热键调用(AHK, "最好的热键语言")', '自动热键调用', [
				SuffixTerm.Identifier,
				SuffixTerm.Literal
			]),
			callTest('__EmptyCall()', '__EmptyCall', [])
		];

		for (const expect of expects) {
			const actual = getExpr(expect.source);

			assert.strictEqual(actual.errors.length, 0);

			factorUpackTest(
				actual.value,
				atom => {
					assert.strictEqual(atom instanceof SuffixTerm.Identifier, true);
					if (atom instanceof SuffixTerm.Identifier) {
						assert.strictEqual(atom.token.content, expect.callee);
					}
				},
				trailer => {
					assert.strictEqual(trailer instanceof SuffixTerm.Call, true);
					if (trailer instanceof SuffixTerm.Call) {
						for (let i = 0; i < trailer.args.length; i++)
						atomUnpackTest(trailer.args[i], atom => {
							assert.strictEqual(atom instanceof expect.args[i], true);
						})
					}
				}
			)
		}
	});
});

function getStmt(s: string) {
	const p = new AHKParser(s, '');
	return p.testDeclaration();
}

interface IKeyTest {
	name: string,
	modifiers: string[]
}

function keyTest(name: string, modifiers:string[]): IKeyTest {
	return {
		name: name,
		modifiers: modifiers
	};
}

suite('Syntax Parser Statment Test', () => {
	test('valid hotkey', () => {
		const actual = getStmt('^!#F12 & 1::');
		const expects = [
			keyTest(
				'^!#F12',
				['^', '!', '#']
			),
			keyTest(
				'1',
				[]
			)
		];
		assert.strictEqual(actual.errors.length, 0, `counter errors: ${actual.errors[0]}`);
		const aHotkey = actual.value;
		assert.strictEqual(aHotkey instanceof Decl.Hotkey, true, 'wrong instance');
		if (aHotkey instanceof Decl.Hotkey) {
			// assert.strictEqual(aHotkey.key1.modifiers !== undefined, true, 'key1 modifiers wrong');
			assert.strictEqual(aHotkey.key1.key.content, expects[0].name);
			if (aHotkey.key1.modifiers) {
				let i = 0;
				for (const mod of aHotkey.key1.modifiers) {
					assert.strictEqual(expects[0].modifiers[i], mod.content, 'key1 modifier name wrong');
					i++;
				}
			}
			assert.strictEqual(aHotkey.key2 !== undefined,true, 'Key2 exists');
			if (aHotkey.key2) {
				assert.strictEqual(aHotkey.key2.key.content, expects[1].name);
				assert.strictEqual(aHotkey.key2.modifiers, undefined);
			}
		}
	})
});

suite('Full file test', () => {
	test('class file', () => {
		const file = `class IncludeType
		{
			static Path := "Path"
			static Lib := "Lib"
			static Auto := "Auto"
			static Directory := "Directory"
			static Error := "Error"
		}
		
		
		a := "abcdefbcd"
		
		b := 10 + Ord "b"		
		`;
		const parser = new AHKParser(file, '');
		const fileAST = parser.parse();
		assert.strictEqual(fileAST.tokenErrors.length, 0, 'Enconter Token error');
		assert.strictEqual(fileAST.sytanxErrors.length, 0, 'Enconter Parser error');
	});
	test('Function define file', () => {
		const file = `a()
		{
			Path := "Path"
			Lib := "Lib"
			Auto := "Auto"
			Directory := "Directory"
			Error := "Error"
		}
		
		
		a := "abcdefbcd"
		
		b := 10 + Ord "b"		
		`;
		const parser = new AHKParser(file, '');
		const fileAST = parser.parse();
		assert.strictEqual(fileAST.tokenErrors.length, 0, 'Enconter Token error');
		assert.strictEqual(fileAST.sytanxErrors.length, 0, 'Enconter Parser error');
	});

	test('Method define file', () => {
		const file = `class IncludeType
		{
			static Path := "Path"
			static Lib := "Lib"
			static Auto := "Auto"
			static Directory := "Directory"
			static Error := "Error"

			__New() {
				this.a := 12
			}
		}
		
		
		a := "abcdefbcd"
		
		b := 10 + Ord "b"		
		`;
		const parser = new AHKParser(file, '');
		const fileAST = parser.parse();
		assert.strictEqual(fileAST.tokenErrors.length, 0, 'Enconter Token error');
		assert.strictEqual(fileAST.sytanxErrors.length, 0, 'Enconter Parser error');
	});
});