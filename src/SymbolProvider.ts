import * as vscode from "vscode";
import { StringDecoder } from "string_decoder";
import { start } from "repl";
import * as Lexer from "./Lexer";

export class SymBolProvider implements vscode.DocumentSymbolProvider {
    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
        let lexer = new Lexer.Lexer(document);
        const result = lexer.Parse();
        return result;
    }
}
