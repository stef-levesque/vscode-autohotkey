import * as vscode from "vscode";
import { StringDecoder } from "string_decoder";
import { start } from "repl";

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

export class Lexer {
    line = 0;
    document: vscode.TextDocument;
    lineCommentFlag: boolean = false;
    classname: string;
    classendline: number;

    constructor (document: vscode.TextDocument){
        this.document = document;
    }

    public Parse() {
        const lineCount = Math.min(this.document.lineCount, 10000);
        // let range:vscode.Range;
        // let loc:vscode.Location;
        let Symbol: vscode.SymbolInformation;
        const result: vscode.SymbolInformation[] = [];
        // let loc =  new vscode.Location(this.document.uri, new vscode.Range(new vscode.Position(0,0),new vscode.Position(this.document.lineCount,0)));
        // let Symbolclass: vscode.SymbolInformation = new vscode.SymbolInformation("testclass",
        //                                 vscode.SymbolKind.Class,null,loc);
        // result.push(Symbolclass);
        while (this.line < lineCount) {
            let text = this.GetText();
            try {
                if (Symbol = this.GetMethodInfo(text, this.classname)) {
                    result.push(Symbol);
                }
                else if (Symbol = this.GetClassInfo(text)) {
                    result.push(Symbol);
                }
            }
            catch (e) {
                continue;
            }
            this.line++;
            if (this.line > this.classendline) {
                this.classname = null;
            }
        }

        return result;
    }

    /**
    * @param text document line content
    * @param scopename class name of a function
    */
    public GetMethodInfo(text: string, scopename?: string):vscode.SymbolInformation {
        // if we match the funcName(param*), 
        // then we check if it is a function definition
        let range: vscode.Range;
        let SymbolFunc: vscode.SymbolInformation;
        let methodMatch = text.match(/^[ \t]*(?<funcname>[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+)(\(.*?\))/);
        if (methodMatch) {
            let l = this.line;
            try {
                range = this.PMethod(text, methodMatch['groups']['funcname'], methodMatch[2], methodMatch[0]);
            }
            catch(err) {
                // if something went wrong, abandon parse this line
                this.line = l + 1;
                // reset flag 
                this.lineCommentFlag = false;
                throw "get wrong"
            }
            let loc = new vscode.Location(this.document.uri, range);
            if (!scopename) {
                SymbolFunc = new vscode.SymbolInformation(methodMatch['groups']['funcname'], vscode.SymbolKind.Method,
                    getRemark(this.document, l - 1), loc);
            }
            else {
                SymbolFunc = new vscode.SymbolInformation(methodMatch['groups']['funcname'], vscode.SymbolKind.Method,
                    scopename, loc);
            }
            return SymbolFunc;
        }
    }

    /**
    * @param text document line content
    */
    public GetClassInfo(text: string):vscode.SymbolInformation {
        // if we match the funcName(param*), 
        // then we check if it is a function definition
        let range: vscode.Range;
        let methodMatch = text.match(/^[ \t]*class[ \t]+(?<classname>[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+)/);
        if (methodMatch) {
            let l = this.line;
            try {
                range = this.PClass(text, methodMatch['groups']['classname'], methodMatch[0]);
            }
            catch(err) {
                // if something went wrong, abandon parse this line
                this.line = l + 1;
                // reset flag 
                this.lineCommentFlag = false;
                throw "get wrong"
            }
            let loc = new vscode.Location(this.document.uri, range);
            let SymbolFunc = new vscode.SymbolInformation(methodMatch['groups']['classname'], vscode.SymbolKind.Class,
                getRemark(this.document, l - 1), loc);
            return SymbolFunc;
        }
    }

    public GetText() :string {
        let { text } = this.document.lineAt(this.line);
        return text;
    }

    public PClass(text: string, classname: string, fullmatch: string): vscode.Range {
        let startIndex = fullmatch.search(classname);
        let startLine = this.line;
        let nextSearchStr = text.slice(startIndex+classname.length);
        let discardPairNum = 0;
        let l = this.line + 1;

        if (nextSearchStr.search(/^\s*{/) < 0) {
            this.line++;
            // we jump Meanless line, space line and comment line
            this.JumpMeanless();
            nextSearchStr = this.GetText();
            if (nextSearchStr.search(/^[ \t]*({)/) < 0) {
                throw "Not a class";
            }
        }

        this.line++;
        nextSearchStr = this.GetText();

        while (true) {
            // Exclude "{}" pairs of if and while
            // by count how many this kind of pairs we meet
            this.JumpMeanless();
            nextSearchStr = this.GetText();
            if (nextSearchStr.search(/^[ \t]*({)/) >= 0) {
                discardPairNum++;
            }

            if (nextSearchStr.search(/^[ \t]*(})/) >= 0) {
                // decrease the discard number if we meet another "}"
                if (discardPairNum !== 0) {
                    discardPairNum--;
                }
                else {
                    break;
                }
            }
            this.line++;
            nextSearchStr = this.GetText();
            // TODO: Better solution while a break func 
            if (this.line > Math.min(this.document.lineCount, this.line+1000)) {
                throw "Break class!";
            }
        }
        let endline:number = this.line;
        this.classendline = endline;
        // set line to the next line of declearation
        this.line = l;
        this.classname = classname;
        let endIndex = nextSearchStr.match(/^[ \t]*(})/)[0].length;
        return new vscode.Range(new vscode.Position(startLine, startIndex), 
                                new vscode.Position(endline, endIndex));
    }

    // parse Method
    public PMethod(text: string, funcname: string, pairstr:string, fullmatch: string): vscode.Range {
        let startIndex = fullmatch.search(funcname);
        let startLine = this.line;
        let nextSearchStr = text.slice(startIndex+pairstr.length+funcname.length);
        let discardPairNum = 0;

        // skip if() and while()
        if (funcname.search(/if|while/i) >= 0)
        {
            throw "if or while declear"
        }
        // search if there is a "{" in the rest of the line
        // if not we go next line 
        if (nextSearchStr.search(/^\s*{/) < 0) {
            this.line++;
            // we jump Meanless line, space line and comment line
            this.JumpMeanless();
            nextSearchStr = this.GetText();
            if (nextSearchStr.search(/^[ \t]*({)/) < 0) {
                throw "Not a function";
            }
        }
        // here we found it
        this.line++;
        nextSearchStr = this.GetText();
        // go to next line search "}"
        // though ahk premit end function with "}" after "{" immediately, but I do not premit it.
        // I said calculation.
        while (true) {
            // Exclude "{}" pairs of if and while
            // by count how many this kind of pairs we meet
            this.JumpMeanless();
            nextSearchStr = this.GetText();
            if (nextSearchStr.search(/[ \t]*({)/) >= 0) {
                discardPairNum++;
            }

            if (nextSearchStr.search(/[ \t]*(})/) >= 0) {
                // decrease the discard number if we meet another "}"
                if (discardPairNum !== 0) {
                    discardPairNum--;
                }
                else {
                    break;
                }
            }
            this.line++;
            nextSearchStr = this.GetText();
            // TODO: Better solution while a break func 
            if (this.line > Math.min(this.document.lineCount, this.line+1000)) {
                throw "Break func!";
            }
        }
        let endline:number = this.line;
        let endIndex = nextSearchStr.match(/^[ \t]*(})/)[0].length;
        return new vscode.Range(new vscode.Position(startLine, startIndex), 
                                new vscode.Position(endline, endIndex));
    }

    public PComment(text:string) {
        // temp return true
        if (this.lineCommentFlag === true) {
            // end of block comments
            if (text.search(/^[ \t]*\*\//) >= 0) {
                this.lineCommentFlag = false;
            }
            return true;
        }
        else if (text.search(/^[ \t]*[;]/) >= 0) {
            return true;
        }
        // start of block comments
        else if (text.search(/^[ \t]*\/\*/) >= 0) {
            this.lineCommentFlag = true;
            return true;
        }
        return false;
    }

    public JumpMeanless() {
        let text = this.GetText()
        while (this.PComment(text) || text.trim() === "") {
            this.line++;
            text = this.GetText();
        }
    }

}