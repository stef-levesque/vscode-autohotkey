/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

suite('Should do completion', () => {
	const docUri = getDocUri('completion.ahk');

	test('Completes global symbol', async () => {
		await testCompletion(docUri, new vscode.Position(31-1, 0), {
			items: [
				{ label: 'TestFunc', kind: vscode.CompletionItemKind.Function },
				{ label: 'TestClass', kind: vscode.CompletionItemKind.Class }
			]
		});
	});
});

async function testCompletion(
	docUri: vscode.Uri,
	position: vscode.Position,
	expectedCompletionList: vscode.CompletionList
) {
	await activate(docUri);

	// Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
	const actualCompletionList = (await vscode.commands.executeCommand(
		'vscode.executeCompletionItemProvider',
		docUri,
		position
	)) as vscode.CompletionList;

	assert.ok(actualCompletionList.items.length >= 2);
	expectedCompletionList.items.forEach((expectedItem, i) => {
		let actualItem = actualCompletionList.items[i];
		actualCompletionList.items.map(item => {
			if (item.label === expectedItem.label) {
				actualItem = item;
			}
		});
		assert.strictEqual(actualItem.label, expectedItem.label);
		assert.strictEqual(actualItem.kind, expectedItem.kind);
	});
}
