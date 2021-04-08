import { CompletionItemKind, CompletionItem } from 'vscode-languageserver';
import { Parameter } from "../parser/types";
import { 
    builtin_variable,
    builtin_function,
	builtin_command
} from "./builtins";
import {  } from '../services/ioService';

export const serverName = 'mock-ahk-vscode';
export const languageServer = 'ahk-language-server';

export const keywords = [
	'class',    'extends', 'if',
	'else',     'while',   'try',
	'loop',     'until',   'switch',
	'case',     'break',   'goto',
	'gosub',    'return',  'global',
	'local',    'throw',   'continue',
	'catch',	'finally',	'in',
	'for', 		'this',		'new',
	'critical',	'exit',		'exitapp'
]

export interface BuiltinFuncNode {
    name: string
    params: Parameter[]
}


export function buildKeyWordCompletions(): CompletionItem[] {
	return keywords.map(keyword => ({
		kind: CompletionItemKind.Keyword,
		label: keyword,
		data: 0,
	}));
}

export function buildbuiltin_variable(): CompletionItem[] {
	return builtin_variable.map((bti_var_info, index) => {
		return {
            kind: CompletionItemKind.Variable,
            detail: 'Built-in Variable',
            label: bti_var_info[0],
            data: index
		}
	});
}

export function buildBuiltinFunctionNode(): BuiltinFuncNode[] {
    return builtin_function
}

export function buildBuiltinCommandNode(): BuiltinFuncNode[] {
	return builtin_command;
}