import {
	Position,
	Location,
	Diagnostic,
	Range,
	Connection,
	InitializeParams,
	InitializeResult,
	DocumentSymbolParams,
	TextDocumentSyncKind,
	SymbolInformation,
	InitializedParams,
	DidChangeConfigurationNotification,
	CompletionParams,
	CompletionItem,
	TextDocumentPositionParams,
	ParameterInformation,
	SignatureInformation,
	SignatureHelp,
	FoldingRangeParams,
	FoldingRange,
	CancellationToken,
	TextDocuments,
	TextDocumentChangeEvent
} from 'vscode-languageserver';
import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import {buildKeyWordCompletions, languageServer} from './utilities/constants'
import { threadId } from 'worker_threads';

export class AHKLS {
	/**
   	* Connection to the client
   	*/
	private readonly connection: Connection;

	/**
   	* The current cased set of keywords for completions
   	*/
	private keywords: CompletionItem[];
	  
	/**
	* The document service to store and manage documents
	*/
	private readonly documents: TextDocuments<TextDocument>;

	constructor(connection: Connection) {
		this.connection = connection;
		this.keywords = buildKeyWordCompletions();
		this.documents = new TextDocuments(TextDocument);
	}

	listen(): void {
		this.connection.onInitialize(this.onInitialize.bind(this));
		this.connection.onCompletion(this.onCompletion.bind(this));
		this.connection.onCompletionResolve(this.onCompletionResolve.bind(this));
		// this.connection.onDocumentSymbol(this.onDocumentSymbol.bind(this));

		// this.documents.onDidChangeContent(this.onChange.bind(this));
		// Make the text document manager listen on the connection
		// for open, change and close text document events
		this.documents.listen(this.connection);

		// Listen on the connection
		this.connection.listen();
	}

	/**
	 * Initialize the server from the client connection
	 * @param params initialization parameters
	 */
	onInitialize(params: InitializeParams): InitializeResult {
		return {
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
					triggerCharacters: ['.', '(']
				},
				signatureHelpProvider: {
					retriggerCharacters: ['(']
				},
				documentSymbolProvider: true
			}
		};
	}

	/**
	 * Respond to completion requests from the client. This handler currently provides
	 * both symbol completion as well as suffix completion.
	 * @param completion the parameters describing the completion request
	 * @param cancellation request cancellation token
	 */
    private async onCompletion(
		completion: CompletionParams,
		cancellation: CancellationToken,
    ): Promise<CompletionItem[]> {
		return this.keywords;
	}

	/**
	 * This handler provider completion item resolution capability. This provides
	 * additional information for the currently completion item selection
	 * @param completionItem the item to resolve further
	 */
	private onCompletionResolve(completionItem: CompletionItem): CompletionItem {
		try {
			return completionItem;
		} catch (err) {
			// logException(this.logger, this.tracer, err, LogLevel.error);
			return completionItem;
		}
	}

	/**
	 * Respond to updates made to document by the client. This method
	 * will parse and update the internal state of affects scripts
	 * reporting errors to the client as they are discovered
	 * @param document the updated document
	 */
	// private async onChange(change: TextDocumentChangeEvent<TextDocument>) {
	// 	try {
	// 		let document = change.document;
	// 		// TODO: parser implenmention
	// 		const diagnostic = await this.analysisService.analyzeDocument(
	// 			document.uri,
	// 			document.getText(),
	// 		);
		
	// 	// No Diagnostics for this simple parser
	// 	// this.sendDiagnostics(diagnostic, document.uri);
	// 	} catch (err) {
	// 	// report any exceptions to the client
	// 	// logException(this.logger, this.tracer, err, LogLevel.error);
	// 	}
	// }
	
	// /**
	//  * This handler provides document symbol capabilities. This provides a list of all
	//  * symbols that are located within a given document
	//  * @param documentSymbol the document to provide symbols for
	//  * @param cancellation request cancellation token
	//  */
	// public async onDocumentSymbol(
	// 	documentSymbol: DocumentSymbolParams,
	// 	cancellation: CancellationToken,
	// ): Promise<SymbolInformation[]> {
	// 	const { uri } = documentSymbol.textDocument;

	// 	// exit if cancel requested
	// 	// if (cancellation.isCancellationRequested) {
	// 	// 	return undefined;
	// 	// }

	// 	const entities = await this.loadAllTableSymbols(uri);
	// 	return toSymbolInformation(entities);
	// }


}