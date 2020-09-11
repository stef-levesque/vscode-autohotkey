import { resolve } from "dns";
import * as vs from "vscode";
import * as v from "./vcore";

export class AhkDefinitionProvider implements vs.DefinitionProvider {
    public provideDefinition(doc: vs.TextDocument, position: vs.Position, token: vs.CancellationToken): vs.ProviderResult<vs.Location | vs.Location[] | vs.LocationLink[]> {
        const text = doc.lineAt(position.line).text.trim();
        v.log(`provideDefinition[line ${position.line}; ${position.character}]: ${text}`);
        const wr = doc.getWordRangeAtPosition(position, /[A-Za-z0-9_]+/);
        let word = doc.getText(wr); // getWord(text, position, /[A-Za-z0-9_]/);

        // look a few characters back to see if they're looking for a "new SomeObject"
        // log("wr.start.character " + wr.start.character);
        // log("ti " + text.indexOf("new", wr.start.character - 4));
        let ioc = text.indexOf("new", wr.start.character - 4);
        if (ioc !== -1 && ioc === wr.start.character - 4)
            word = "new " + word;
        ioc = text.indexOf("extends", wr.start.character - 8);
        if (ioc !== -1 && ioc === wr.start.character - 8)
            word = "new " + word;
        // "new" indicates look for a class
        v.log(`word "${word}"`);

        if (word == null || word.length < 1)
            return;

        // build regex to find function or class def
        let re: RegExp;
        // let offset: number = 0;
        if (word.startsWith("new ")) {
            // offset = 4;
            word = word.substr(4);
            re = new RegExp("class\\s+" + word + "\\s+");
        } else
            re = new RegExp("^\\s*" + word + "\\s*\\(.*\\)\\s*{");

        const obj: vs.Location | Promise<vs.Location> = v.getLocation(doc, re, token, word);
        if (obj instanceof vs.Location)
            return obj;
        if (obj instanceof Promise) {
            const p: Promise<vs.Location> = obj;
            return p;
        }
    }
}
