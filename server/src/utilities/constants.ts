import { CompletionItemKind, CompletionItem } from 'vscode-languageserver';
import { Parameter } from "../ahkparser";
import { 
    builtin_variable,
    builtin_function
} from "./builtins";

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
    return builtin_function.map((bti_func) => {
            return {
                name: bti_func.name,
                params: bti_func.params
            };
        });
}
