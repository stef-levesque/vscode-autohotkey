import * as vscode from "vscode";

function getRemark(document: vscode.TextDocument, line: number) {
    if (line >= 0) {
        const { text } = document.lineAt(line);
        const markMatch = text.match(/^;(.+)/);
        if (markMatch) {
            return markMatch[1];
        }
    }
    return null;
}

export function getSymbolForLine(document: vscode.TextDocument, line: number): vscode.SymbolInformation {
    const { text } = document.lineAt(line);

    const methodMatch = text.match(/(\w+\(\w*\))\s*{/);
    if (methodMatch) {
        const loc = new vscode.Location(document.uri, new vscode.Position(line, 0));
        return new vscode.SymbolInformation(methodMatch[1], vscode.SymbolKind.Method,
            getRemark(document, line - 1), loc);
    }

    const hotKeyMatch = text.match(/;;(.+)/);
    if (hotKeyMatch) {
        return new vscode.SymbolInformation(hotKeyMatch[1], vscode.SymbolKind.Module, null, new vscode.Location(document.uri, new vscode.Position(line, 0)));
    }

}

export class SymBolProvider implements vscode.DocumentSymbolProvider {
    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
        const lineCount = Math.min(document.lineCount, 10000);
        const result: vscode.SymbolInformation[] = [];
        for (let line = 0; line < lineCount; line++) {
            const symbol = getSymbolForLine(document, line);
            if (symbol) { result.push(symbol); }
        }
        return result;
    }

}
