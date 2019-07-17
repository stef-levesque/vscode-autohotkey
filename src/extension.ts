
import * as vscode from "vscode";
import { AhkDefinitionProvider } from "./AhkDefinitionProvider";
import { AhkSignatureHelpProvider } from "./AhkSignatureHelpProvider";
import { FormatProvider } from "./FormatProvider";
import { SymBolProvider } from "./SymbolProvider";
import { initLogging, log } from "./vcore";

/**
 * to build:
 * 
 *   vsce package
 *   copy vscode-autohotkey-plus-2.0.1.vsix \Dropbox\v
 *   code --install-extension vscode-autohotkey-plus-2.0.1.vsix
 * 
 */

export function activate(ctx: vscode.ExtensionContext) {
	let channel = vscode.window.createOutputChannel("ahk");
	initLogging(channel)
	// context.subscriptions.push(channel);
	log("ahk extension activating");

	// vscode.DocuemntSelector
	let ds = { language: "ahk" };

	vscode.languages.registerDocumentSymbolProvider(ds, new SymBolProvider());
	vscode.languages.registerDocumentFormattingEditProvider(ds, new FormatProvider());

	let dp = new AhkDefinitionProvider();
	let dpHandle = vscode.languages.registerDefinitionProvider(ds, dp);
	ctx.subscriptions.push(dpHandle);

	log("registering signature help provider");
	let sigHp = new AhkSignatureHelpProvider();
	let sigHpHandle = vscode.languages.registerSignatureHelpProvider(ds, sigHp, "(", ",");
	ctx.subscriptions.push(sigHpHandle);

	log("ahk extension activation complete");
}
