import * as assert from 'assert';
import { SemanticStack } from '../parser/semantic_stack';
import { CommandCall } from '../parser/asttypes';

suite('Semantic Parse test', () => {
	const testStr = 'this.p := Func1(1, "asd", [1,3]'
	const cmdTestStr = 'SoundGet, master_mute, , mute'
	
	test('Property Assignment Test', () => {
		let ssparser = new SemanticStack(testStr);
		const actualAST = ssparser.statement();
		console.log(actualAST);
	});

	test('Command Call Test', () => {
		let ssparser = new SemanticStack(cmdTestStr);
		const actualAST = ssparser.statement();
		assert.ok(actualAST?.value instanceof CommandCall)
		console.log(actualAST);
	})
})