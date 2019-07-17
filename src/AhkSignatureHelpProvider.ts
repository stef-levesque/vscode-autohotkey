import * as vscode from "vscode";
import * as v from "./vcore";

export class AhkSignatureHelpProvider implements vscode.SignatureHelpProvider {
	provideSignatureHelp(doc: vscode.TextDocument, 
			pos: vscode.Position, 
			token: vscode.CancellationToken, 
			ctx: vscode.SignatureHelpContext): vscode.ProviderResult<vscode.SignatureHelp> {
		let {text} = doc.lineAt(pos.line);
		v.log("signatureHelp[line " + pos.line + "; " + pos.character + "]: " + text);

		// find left parenthesis
		let i = pos.character, nCommas = 0;
		let char = text.charAt(i--);
		while(char != "(") {
			if(char == ",")
				nCommas++;
			char = text.charAt(i--);
		}
		v.log("i = " + i);

		// find a word to the left of the paren
		let p2 = pos.with(undefined, i);
		let wr = doc.getWordRangeAtPosition(p2, /[A-Za-z0-9_]+/);
		let word = doc.getText(wr);
		v.log("sigHelp word: " + word);
		if(word == null || word.length < 1) {
			return;
		} else {
			let defLine = v.getLine(doc, new RegExp(word + "\s*\(.*\)\s*{"), token);
			let s = null;
			if(v.isTextLine(defLine)) {
				s = defLine.text;
				v.log("defLine: " + s);
				let sh = new vscode.SignatureHelp();
				let sig = new vscode.SignatureInformation(word);
				sh.signatures.push(sig);
				sh.activeSignature = 0;
				sh.activeParameter = nCommas;
				let i = s.indexOf("("), j = s.lastIndexOf(")");
				s = s.substring(i + 1, j);
				sig.label += "(";
				let paramIndex = 0;
				for(let ps of s.split(",")) {
					let param = new vscode.ParameterInformation(ps);
					sig.parameters.push(param);
					if(paramIndex > 0)
						sig.label += ", ";
					sig.label += ps;
					paramIndex++;
					// sig.documentation += ps + "\n";
				}
				sig.label += ")";
				return sh;
			}
		}
	}
}