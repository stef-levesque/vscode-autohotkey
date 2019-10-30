import * as vscode from "vscode";

export class MethodCallInfo {

    public signatureHelp: vscode.SignatureHelp;

    constructor(public start: number, public end: number, public data: string) {
    }
}
