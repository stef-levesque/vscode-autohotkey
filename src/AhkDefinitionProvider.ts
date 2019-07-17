import * as vs from "vscode";
import * as v from "./vcore";
import { resolve } from "dns";

export class AhkDefinitionProvider implements vs.DefinitionProvider {
	public provideDefinition(doc: vs.TextDocument, position: vs.Position, 
			token: vs.CancellationToken): vs.ProviderResult<vs.Location | vs.Location[] | vs.LocationLink[]> {
		let text = doc.lineAt(position.line).text.trim();
		v.log("provideDefinition[line " + position.line + "; "
			+ position.character + "]: " + text);
		let wr = doc.getWordRangeAtPosition(position, /[A-Za-z0-9_]+/);
		let word = doc.getText(wr); // getWord(text, position, /[A-Za-z0-9_]/);

		// look a few characters back to see if they're looking for a "new SomeObject"
		// log("wr.start.character " + wr.start.character);
		// log("ti " + text.indexOf("new", wr.start.character - 4));
		let ioc = text.indexOf("new", wr.start.character - 4);
		if(ioc != -1 && ioc === wr.start.character - 4)
			word = "new " + word;
		ioc = text.indexOf("extends", wr.start.character - 8);
		if(ioc != -1 && ioc === wr.start.character - 8)
			word = "new " + word; // "new" indicates look for a class
		v.log("word \"" + word + "\"");

		if(word == null || word.length < 1)
			return;

		// build regex to find funtion definition or class def
		let re: RegExp, offset: number = 0;
		if(word.startsWith("new ")) {
			offset = 4;
			re = new RegExp("class\\s+" + word.substr(offset) + "\\s+");
		} else {
			re = new RegExp("^\\s*" + word + "\\s*\\(.*\\)\\s*{");
		}

		let obj: vs.Location | Promise<vs.Location> = v.getLocation(doc, re, token, word, offset);
		if(obj instanceof vs.Location) {
			return obj;
		} else if(obj instanceof Promise) {
			let p: Promise<vs.Location> = obj;
			return p;
		}
	}
}
