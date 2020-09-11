import * as fs from "fs";
import * as nrl from "n-readlines";
import * as path from "path";
import * as vs from "vscode";
import { ResultingTextLine } from "./ResultingTextLine";

let logChannel: vs.OutputChannel;

export function initLogging(channel: vs.OutputChannel) {
    logChannel = channel;
}
export function isTextLine(obj: any): obj is vs.TextLine {
    return "lineNumber" in obj;
}

export function getLocation(doc: vs.TextDocument, reg: RegExp, token: vs.CancellationToken, word: string): vs.Location | Promise<vs.Location> {
    const lineCount = Math.min(doc.lineCount, 10000);
    const pp = new Array<Promise<vs.Location>>();
    const checkedFiles: string[] = new Array(doc.uri.fsPath);
    for (let n = 0; n < lineCount; n++) {
        if (token.isCancellationRequested)
            return;
        const line: vs.TextLine = doc.lineAt(n);
        const result = getLoc_parseLine(checkedFiles, doc.uri, token, line.lineNumber, line.text, reg, word);
        if (result != null)
            return result;
    }
    return pp.length > 0 ? pp[0] : null;
}

/**
 * recursive function that will search the origin of a word searching in all the referenced files.
 * @param checkedFiles array of checked files: it prevents cyrcular references to block VSC while reccurring the function
 * @param docUri the current file uri
 * @param token the cancellation token
 * @param lineNumber the current line number
 * @param text the text line to process
 * @param reg the search regex to be match
 * @param word the target word
 */
function getLoc_parseLine(checkedFiles: string[], docUri: vs.Uri, token: vs.CancellationToken, lineNumber: number, text: string, reg: RegExp, word: string) {
    if (text.startsWith("#Include")) {
        const inc = text.substring(9).trim();
        let fpath = getRelative(docUri, inc);
        // let uri = vs.Uri.parse(fpath);
        while (fpath.startsWith("/"))
            fpath = fpath.substr(1);
        // log("docUri: " + docUri);
        const uri = vs.Uri.file(fpath);
        if (checkedFiles.includes(uri.fsPath))
            return null;
        checkedFiles.push(uri.fsPath);
        // log("includedUri: " + uri);

        const lineByLine = require("n-readlines");
        const liner = new lineByLine(fpath);
        // let liner = new nrl.readlines(fpath);
        let line = null;
        let n = 0;
        while (line = liner.next()) {
            if (token.isCancellationRequested)
                return;
            const text2 = line.toString();
            const result = getLoc_parseLine(checkedFiles, uri, token, n++, text2, reg, word);
            if (result != null) {
                liner.close();
                return result;
            }
        }
    } else if (text.match(reg)) {
        const loc1 = new vs.Location(docUri,
            new vs.Position(lineNumber, text.indexOf(word)));
        return loc1;
    }
}

function getRelative(docUri: vs.Uri, inc: string) {
    let fpath = docUri.path;
    log("fpath1: " + fpath);
    log("inc: " + inc);
    fpath = fpath.substring(0, fpath.lastIndexOf("/"));
    log("fpath2: " + fpath);
    while (inc.startsWith("..")) {
        inc = inc.substring(3);
        fpath = fpath.substring(0, fpath.lastIndexOf("/"));
        log("fpath[n]: " + fpath);
    }
    fpath += "/" + inc;
    log("fpath3: " + fpath);
    return fpath;
}

function resolvePath(docUri: vs.Uri, inc: string) {
    let fpath = inc;
    const dir = path.dirname(docUri.fsPath);
    fpath = fpath.replace("%A_ScriptDir%", dir);
    //TODO: https://www.autohotkey.com/docs/commands/_Include.htm
    return fpath;
}

export function log(msg) {
    logChannel.appendLine(msg);
}

export function getLine(doc: vs.TextDocument, reg: RegExp, token: vs.CancellationToken): vs.TextLine | Promise<vs.TextLine> {
    const lineCount = Math.min(doc.lineCount, 10000);
    const pp = new Array<Promise<vs.TextLine>>();
    for (let n = 0; n < lineCount; n++) {
        if (token.isCancellationRequested)
            return;
        const line = doc.lineAt(n);
        if (line.text.startsWith("#Include")) {
            pp.push(new Promise<vs.TextLine>((resolve) => {
                const inc = line.text.substring(9).trim();
                const fpath = getRelative(doc.uri, inc);
                vs.workspace.openTextDocument(fpath).then((doc2: vs.TextDocument) => {
                    log("opened TextDocument: " + fpath)
                    resolve(getLine(doc2, reg, token));
                });
            }));
        } else if (line.text.match(reg)) {
            return line;
        }
    }
    return pp.length > 0 ? pp[0] : null;
}

/**
 * recursive function that will search the origin of a method searching in all the referenced files.
 * @param checkedFiles array of checked files: it prevents circular references to block VSC while reccurring in the files
 * @param doc the current document
 * @param reg the search regex to be match
 * @param token the cancellation token
 * @param word the target word
 */
export function getReferences(checkedFiles: string[], doc: vs.TextDocument, reg: RegExp, token: vs.CancellationToken, word: string): ResultingTextLine | Promise<ResultingTextLine> {
    const text = doc.getText();
    let match;
    while ((match = reg.exec(text)) != null) {
        const position = doc.positionAt(match.index);
        const docLines = new Array<string>();
        if (position.line > 0) {
            let line = (match[0] as string).startsWith("\n") ? position.line : position.line - 1;
            let textLine = doc.lineAt(line);
            if (textLine.text.startsWith(";")) {
                while (line > 0) {
                    textLine = doc.lineAt(line);
                    if (textLine.text.startsWith(";")) {
                        docLines.push(textLine.text.substring(1));
                        line--;
                    } else
                        break;
                }
            } else if (textLine.text.trim().endsWith("*/")) {
                while (line > 0) {
                    textLine = doc.lineAt(line);
                    docLines.push(textLine.text);
                    if (textLine.text.startsWith("/*"))
                        break;
                    else
                        line--;
                }
            }
        }
        return new ResultingTextLine(match[0], new vs.Location(doc.uri, doc.positionAt(match.index)), docLines.reverse().join("\n"));
    }

    return new Promise((r, c) => {
        const includeRegex = new RegExp(/^#include,?[ ].*/, "gim");

        const promises = new Array();
        while ((match = includeRegex.exec(text)) != null) {
            const spacePos = match[0].indexOf(" ");
            const inc = match[0].substring(spacePos).trim();
            const fpath = resolvePath(doc.uri, inc);
            const uri = vs.Uri.file(inc);
            if (checkedFiles.includes(uri.fsPath))
                continue;
            checkedFiles.push(uri.fsPath);

            promises.push(new Promise((rc, cc) => {
                vs.workspace.openTextDocument(fpath).then((doc2: vs.TextDocument) => {
                    const result = getReferences(checkedFiles, doc2, reg, token, word);
                    if (result)
                        rc(result);
                    else
                        cc(null);
                });
            }));
        }
        const action = () => {
            const count = promises.length;
            let almostOne = false;
            for (let i = 0; i < count; i++) {
                const basePromise = (promises[i] as Promise<ResultingTextLine>);
                const promise = MakeQuerablePromise(basePromise);
                if (promise.isFulfilled) {
                    almostOne = true;
                    basePromise.then((value) => {
                        r(value);
                    });
                    return;
                }
            }
            if (!almostOne)
                c(null);
        };
        Promise.all(promises).then(() => {
            action();
        }).catch(() => {
            action();
        });
    });
}

/**
 * This function allow you to modify a JS Promise by adding some status properties.
 * Based on: http://stackoverflow.com/questions/21485545/is-there-a-way-to-tell-if-an-es6-promise-is-fulfilled-rejected-resolved
 * But modified according to the specs of promises : https://promisesaplus.com/
 */
function MakeQuerablePromise(promise) {
    // Don't modify any promise that has been already modified.
    if (promise.isResolved) return promise;

    // Set initial state
    let isPending = true;
    let isRejected = false;
    let isFulfilled = false;

    // Observe the promise, saving the fulfillment in a closure scope.
    const result = promise.then(
        (v) => {
            isFulfilled = true;
            isPending = false;
            return v;
        },
        (e) => {
            isRejected = true;
            isPending = false;
            throw e;
        },
    );

    result.isFulfilled = () => isFulfilled;
    result.isPending = () => isPending;
    result.isRejected = () => isRejected;
    return result;
}
