import { CompletionItemKind, CompletionItem } from 'vscode-languageserver';

export const serverName = 'mock-ahk-vscode';
export const languageServer = 'mock-language-server';

export const keywords = [
	'class',    'extends', 'if',
	'else',     'while',   'try',
	'loop',     'until',   'switch',
	'case',     'break',   'goto',
	'gosub',    'return',  'global',
	'local',    'throw',   'continue',
	'catch',	'finally',	'in',
	'for'
]

export function buildKeyWordCompletions(): CompletionItem[] {
	return keywords.map(keyword => ({
		kind: CompletionItemKind.Keyword,
		label: keyword,
		data: 0,
	}));
}
