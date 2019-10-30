import * as vscode from "vscode";
import { MethodCallInfo } from "./LastMatch";
import { ResultingTextLine } from "./ResultingTextLine";
import * as v from "./vcore";

export class AhkSignatureHelpProvider implements vscode.SignatureHelpProvider {
    /**
     * It points to the last method call found
     */
    private lastMethodCallFound: MethodCallInfo;
    /**
     * It helps to find all the available method calls
     */
    private methodCallRegex: RegExp = new RegExp(/(\w+\s*\(.*\))\s*/, "gm");

    public provideSignatureHelp(doc: vscode.TextDocument, pos: vscode.Position, token: vscode.CancellationToken, ctx: vscode.SignatureHelpContext): vscode.ProviderResult<vscode.SignatureHelp> {

        const myOffset = doc.offsetAt(pos);

        const findCurrentMethodCall = () => {
            const fullText = doc.getText();
            let methodCall;
            while ((methodCall = this.methodCallRegex.exec(fullText)) != null) {

                const startMethodCallRange = methodCall.index;
                const endMethodCallRange = methodCall.index + methodCall[1].length;

                if (myOffset > startMethodCallRange && myOffset < endMethodCallRange) {
                    v.log("Method call found: " + methodCall[1] + " at " + methodCall.index);
                    this.lastMethodCallFound = new MethodCallInfo(startMethodCallRange, endMethodCallRange, methodCall[1]);
                    return this.locateMethodDefinition(myOffset, doc, token);
                } else if (myOffset < startMethodCallRange) {
                    v.log("No suitable method call found");
                    return;
                }
            }
        };

        if (this.lastMethodCallFound) {
            return this.locateMethodDefinition(myOffset, doc, token).then((value) => {
                return value;
            }).catch(findCurrentMethodCall);
        } else
            findCurrentMethodCall();
    }

    /**
     * it locates the method definition searching across all the referenced files
     * @param myOffset the current offset
     * @param doc the opened document
     * @param token cancellation token
     */
    private locateMethodDefinition(myOffset: number, doc: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SignatureHelp> {
        return new Promise<vscode.SignatureHelp>((resolve, cancel) => {
            if (myOffset > this.lastMethodCallFound.start && myOffset < this.lastMethodCallFound.end) {
                // I'm still inside the last method call range
                const openBracketIndex = this.lastMethodCallFound.data.indexOf("(");
                if (openBracketIndex === -1) {
                    v.log("strange: the open bracket was not found");
                    this.lastMethodCallFound = null;
                    cancel(null);
                } else {
                    const methodName = this.lastMethodCallFound.data.substring(0, openBracketIndex).trim();
                    const regex = new RegExp("^\\s*" + methodName + "\\(.*\\)\\s*{", "gm");
                    // I'll search the references
                    const result = v.getReferences([], doc, regex, token, methodName);
                    if (result instanceof Promise) {
                        (result as Promise<ResultingTextLine>).then((value) => {
                            // I have found a reference so i'll use it when available
                            resolve(this.buildSignature(value, methodName, openBracketIndex, myOffset));
                        });
                    } else if (result) {
                        // I have found a reference so i'll use it directly
                        resolve(this.buildSignature(result as ResultingTextLine, methodName, openBracketIndex, myOffset));
                    } else {
                        this.lastMethodCallFound = null;
                        cancel(null);
                    }
                }
            } else {
                this.lastMethodCallFound = null;
                cancel(null);
            }
        });
    }

    /**
     * It build reference using the source definition and focus the parameter with the active one
     * @param definition the source definition
     * @param methodName the method name
     * @param methodCallOpenBracketPosition the open bracket location
     * @param myOffset the current offset in the active file
     */
    private buildSignature(definition: ResultingTextLine, methodName: string, methodCallOpenBracketPosition: number, myOffset: number) {

        let sh: vscode.SignatureHelp;
        if (this.lastMethodCallFound.signatureHelp === undefined) {
            sh = new vscode.SignatureHelp();
            const sig = new vscode.SignatureInformation(methodName);
            sh.signatures.push(sig);
            sh.activeSignature = 0;
            const openBracket = definition.text.lastIndexOf("(");
            const closeBracket = definition.text.lastIndexOf(")");
            const methodParametersRange = definition.text.substring(openBracket + 1, closeBracket);
            sig.label += "(";
            let paramIndex = 0;
            for (let ps of methodParametersRange.split(",")) {
                ps = ps.replace(/\s/g, "");
                const param = new vscode.ParameterInformation(ps);
                //param.documentation = ps;// TODO better doc structure for args
                sig.parameters.push(param);
                if (paramIndex > 0)
                    sig.label += ", ";
                sig.label += ps;
                paramIndex++;
            }
            sig.documentation = definition.docs;
            sig.label += ")";
            this.lastMethodCallFound.signatureHelp = sh;
        } else
            sh = this.lastMethodCallFound.signatureHelp;

        if (myOffset < methodCallOpenBracketPosition) {
            sh.activeParameter = -1;
        } else {
            const position = myOffset - this.lastMethodCallFound.start;
            const subParameters = this.lastMethodCallFound.data.substr(0, position);
            let nCommas = 0;
            const count = subParameters.length;
            for (let i = 0; i < count; i++) {
                if (subParameters[i] === ",")
                    nCommas++;
            }
            sh.activeParameter = nCommas;
        }
        return sh;
    }
}
