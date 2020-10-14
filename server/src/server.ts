/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	SymbolInformation,
	DocumentSymbolParams,
	SymbolKind,
	SignatureHelpParams,
	SignatureHelp,
	SignatureInformation,
	ParameterInformation,
	CancellationToken,
	DefinitionParams,
	Definition,
	Location,
	Position
} from 'vscode-languageserver';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import {
	keywords,
	buildKeyWordCompletions,
	buildbuiltin_variable,
	builtin_variable,
	// serverName,
	languageServer
} from './utilities/constants'

import { 
	Lexer, SymbolNode
} from './ahkparser'
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. 
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;
let keyWordCompletions: CompletionItem[] = buildKeyWordCompletions();
let builtinVariableCompletions: CompletionItem[] = buildbuiltin_variable();
let treedict: {[key: string]: Lexer} = {};
let logger = connection.console.log;

type Maybe<T> = T | undefined;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		serverInfo: {
			// The name of the server as defined by the server.
			name: languageServer,
	
			// The servers's version as defined by the server.
			// version: this.version,
		},
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: ['.']
			},
			signatureHelpProvider: {
				triggerCharacters: ['(', ',', ', ']
			},
			documentSymbolProvider: true,
			definitionProvider: true
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The AHK Language Server settings
enum docLangName {
	CN = 'CN',
	NO = 'no'		// No Doc
};

interface AHKLSSettings {
	maxNumberOfProblems: number;
	documentLanguage: docLangName;			// which language doc to be used
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: AHKLSSettings = { 
	maxNumberOfProblems: 1000,
	documentLanguage: docLangName.NO
};
let globalSettings: AHKLSSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<AHKLSSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <AHKLSSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<AHKLSSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'AutohotkeyLanguageServer'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

function flatTree(tree: SymbolNode[]): SymbolNode[] {
	let result: SymbolNode[] = [];
	tree.map(info => {
		result.push(info);
		if (info.subnode) {
			result.push(...flatTree(info.subnode));
		}
	});
	return result;
}

connection.onDocumentSymbol(
	(params: DocumentSymbolParams): SymbolInformation[] => {
	let tree = treedict[params.textDocument.uri].getTree();

	return flatTree(tree).map(info => {
		return SymbolInformation.create(
			info.name,
			info.kind,
			info.range,
			params.textDocument.uri
		);
	});
});

connection.onSignatureHelp(
	async (positionParams: SignatureHelpParams, cancellation: CancellationToken): Promise<Maybe<SignatureHelp>> => {
	const { position } = positionParams;
	const { uri } = positionParams.textDocument;
	let docLexer = treedict[uri];

	if (cancellation.isCancellationRequested) {
		return undefined;
	}

	let info = docLexer.getFuncAtPosition(position);

	if (info) {
		return {
			signatures: [
				SignatureInformation.create(docLexer.getFuncPrototype(info.func), undefined, 
					...info.func.params.map((param): ParameterInformation => {
						return ParameterInformation.create(param.name);
					}))
			],
			activeParameter: info.index,
			activeSignature: 0
		};
	}
	else {
		return undefined;
	}
})

connection.onDefinition(
	async (params: DefinitionParams, token: CancellationToken): Promise<Maybe<Definition>> =>{
	if (token.isCancellationRequested) {
		return undefined;
	}

	let { position } = params;
	let docLexer = treedict[params.textDocument.uri];
	let nodes = docLexer.getDefinitionAtPosition(position);
	if (nodes.length) {
		return nodes.map(node => {
			return Location.create(params.textDocument.uri, node.range);
		});
	}
	return undefined;
})

documents.onDidOpen(async e => {
	let docLexer: Lexer = new Lexer(e.document);
	docLexer.Parse();
	treedict[e.document.uri] = docLexer;
});

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
	delete treedict[e.document.uri];
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	let docLexer = treedict[change.document.uri];
	docLexer.document = change.document;
	docLexer.Parse()
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	let result = await getDocumentSettings(textDocument.uri);
	connection.console.log(result.documentLanguage);
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	async (_textDocumentPosition: TextDocumentPositionParams, token: CancellationToken): Promise<Maybe<CompletionItem[]>> => {
		if (token.isCancellationRequested) {
			return undefined;
		}
		const {position, textDocument} = _textDocumentPosition;
		let docLexer = treedict[textDocument.uri];

		let result = docLexer.getSuffixNodes(position);
		if (result) {
			return result.map(docLexer.convertNodeCompletion.bind(docLexer));
		}

		return docLexer.getGlobalCompletion()
			.concat(docLexer.getScopedCompletion(_textDocumentPosition.position))
			.concat(keyWordCompletions).concat(builtinVariableCompletions);
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	async (item: CompletionItem): Promise<CompletionItem> => {
		switch (item.kind) {
			case CompletionItemKind.Function:
			case CompletionItemKind.Method:
				item.detail = item.data;
				break;
			case CompletionItemKind.Variable:
				if (item.detail === 'Built-in Variable') {
					// TODO: configuration for each document.
					let uri = documents.all()[0].uri;
					let cfg = await documentSettings.get(uri);
					if (cfg?.documentLanguage === docLangName.CN)
					// item.data contains the infomation index(in builtin_variable)
					// of variable
					item.documentation = {
						kind: 'markdown',
						value: builtin_variable[item.data][1]
					};
				}
			default:
				break;
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
