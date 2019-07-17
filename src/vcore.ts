import * as vs from "vscode";
import * as fs from 'fs';

var logChannel: vs.OutputChannel;

export function initLogging(channel: vs.OutputChannel) {
	logChannel = channel
}
export function isTextLine(obj: any): obj is vs.TextLine {
	return "lineNumber" in obj;
}
export function getLocation(doc: vs.TextDocument, reg: RegExp, 
	token: vs.CancellationToken, word: string, offset: number): vs.Location | Promise<vs.Location> {
	const lineCount = Math.min(doc.lineCount, 10000);
	let pp = new Array<Promise<vs.Location>>();
	for(let n = 0; n < lineCount; n++) {
		if(token.isCancellationRequested)
			return;
		let line = doc.lineAt(n);
		if(line.text.startsWith("#Include")) {
			let inc = line.text.substring(9).trim();
			let fpath = getRelative(doc, inc);
			// let data = fs.readFileSync(fpath);
			// log(data);
			pp.push(new Promise<vs.Location>(function(resolve2) {
				vs.workspace.openTextDocument(fpath).then(function(doc2: vs.TextDocument) {
					log("opened TextDocument: " + fpath + "; " + token.isCancellationRequested);
					let loc2 = getLocation(doc2, reg, token, word, offset);
					resolve2(loc2);
				});
			}));
		} else if(line.text.match(reg)) {
			let loc1 = new vs.Location(doc.uri, 
				new vs.Position(line.lineNumber, line.text.indexOf(word.substr(offset))));
			return loc1;
		}
	}
	return pp.length > 0 ? pp[0] : null;
}
export function getLine(doc: vs.TextDocument, reg: RegExp, 
		token: vs.CancellationToken): vs.TextLine | Promise<vs.TextLine> {
	const lineCount = Math.min(doc.lineCount, 10000);
	let pp = new Array<Promise<vs.TextLine>>();
	for(let n = 0; n < lineCount; n++) {
		if(token.isCancellationRequested)
			return;
		let line = doc.lineAt(n);
		if(line.text.startsWith("#Include")) {
			pp.push(new Promise<vs.TextLine>(function(resolve) {
				let inc = line.text.substring(9).trim();
				let fpath = getRelative(doc, inc);
				vs.workspace.openTextDocument(fpath).then(function(doc2: vs.TextDocument) {
					log("opened TextDocument: " + fpath)
					resolve(getLine(doc2, reg, token));
				});
			}));
		} else if(line.text.match(reg)) {
			return line;
		}
	}
	return pp.length > 0 ? pp[0] : null;
}
function getRelative(doc: vs.TextDocument, inc: string) {
	let fpath = doc.uri.path;
	log("fpath1: " + fpath);
	fpath = fpath.substring(0, fpath.lastIndexOf("/"));
	log("fpath2: " + fpath);
	while(inc.startsWith("..")) {
		inc = inc.substring(3);
		fpath = fpath.substring(0, fpath.lastIndexOf("/"));
		log("fpath[n]: " + fpath);
	}
	fpath += "/" + inc;
	log("fpath3: " + fpath);
	return fpath;
}
export function getWord(str: string, pos: number | vs.Position, validCharsRegex: RegExp) {
	let strIndex = 0;
	if(pos instanceof vs.Position) {
		strIndex = pos.character;
	} else {
		strIndex = pos;
	}
	let left = strIndex - 1;
	let char = str.charAt(left);
	// log("char[" + left + "] = " + char);
	while(left > 0 && char.match(validCharsRegex) != null) {
		char = str.charAt(--left);
	}
	left++; // last char didn't match
	// log("left = " + left)
	let right = strIndex
	char = str.charAt(right);
	while(right < str.length && char.match(/[A-Za-z0-9_]/) != null) {
		char = str.charAt(++right);
	}
	let word = str.substr(left, right - left);
	log("left, right, word = " + left + ", " + right + ", " + word);
	return word;
}
export function log(msg) {
	logChannel.appendLine(msg)
}
