import * as vscode from "vscode";
import { AhkDefinitionProvider } from "./AhkDefinitionProvider";
import { AhkSignatureHelpProvider } from "./AhkSignatureHelpProvider";
import { FormatProvider } from "./FormatProvider";
import { SymBolProvider } from "./SymbolProvider";
import { initLogging, log } from "./vcore";

/**
 * to build:
 *   vsce package
 *   copy vscode-autohotkey-plus-2.0.1.vsix \Dropbox\v
 *   code --install-extension vscode-autohotkey-plus-2.0.1.vsix
 */
export function activate(ctx: vscode.ExtensionContext) {
    const channel: vscode.OutputChannel = vscode.window.createOutputChannel("ahk");
    initLogging(channel);
    log("ahk extension activating");

    const ds: vscode.DocumentSelector = { language: "ahk" };

    const spHandler = vscode.languages.registerDocumentSymbolProvider(ds, new SymBolProvider());
    const fpHandler = vscode.languages.registerDocumentFormattingEditProvider(ds, new FormatProvider());
    const dpHandle = vscode.languages.registerDefinitionProvider(ds, new AhkDefinitionProvider());
    const sigHpHandle = vscode.languages.registerSignatureHelpProvider(ds, new AhkSignatureHelpProvider(), "(", ",");

    log("registering providers");
    ctx.subscriptions.push(channel, spHandler, fpHandler, dpHandle, sigHpHandle);
    log("ahk extension activation complete");
}
