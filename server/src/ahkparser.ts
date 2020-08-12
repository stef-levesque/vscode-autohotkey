import {
	Position,
	Range,
	Location,
	SymbolInformation,
    SymbolKind,
    ParameterInformation,
    CompletionItem,
    CompletionItemKind
} from 'vscode-languageserver';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import { promises } from 'dns';

export interface SymbolNode {
    name: string
    kind: SymbolKind
    range: Range
    subnode?: SymbolNode[]
}

export interface FuncNode extends SymbolNode {
    params: ParameterInformation[]
}

export interface Word {
    name: string
    range: Range
}

export interface ReferenceInfomation {
    name: string
    line: number
}

export namespace SymbolNode {
    export function create(name: string, kind: SymbolKind, range: Range, subnode?: SymbolNode[]): SymbolNode {
        let result:SymbolNode = {
            name: name,
            kind: kind,
            range: range,
        };
        if (subnode) {
            result.subnode = subnode;
        }
        return result;
    }
}

export namespace FuncNode {
    export function create(name: string, kind: SymbolKind, range: Range, params: ParameterInformation[], subnode?: SymbolNode[]): FuncNode {
        let result:FuncNode = {
            name: name,
            kind: kind,
            range: range,
            params: params
        };
        if (subnode) {
            result.subnode = subnode;
        }
        return result;
    }
}

export namespace Word {
    export function create(name: string, range: Range): Word {
        return {
            name: name,
            range: range
        };
    }
}

export namespace ReferenceInfomation {
    export function create(name: string, line: number): ReferenceInfomation {
        return {
            name: name,
            line: line
        };
    }
}

// export interface CommentNode {
//     text: string
//     range: Range
// }

export class Lexer {
    private line = 0;
    private lineCommentFlag: boolean = false;
    private classname: string|undefined = '';
    private classendline: number = 0;
    private symboltree: SymbolNode[]|null;
    private referenceTable: {[key: string]: ReferenceInfomation[]} = {};
    private done: boolean = false;
    private Ilogger: (message: string) => void;
    document: TextDocument;

    constructor (Ilogger: (message: string) => void ,document: TextDocument){
        this.document = document;
        this.Ilogger = Ilogger;
        this.symboltree = null;
    }

    public Parse(isEndByBrace: boolean = false): Lexer {
        this.line = 0;
        const lineCount = Math.min(this.document.lineCount, 10000);

        let Symbol: SymbolNode|undefined;
        const result: SymbolNode[] = [];

        while (this.line < lineCount-1) {
            this.JumpMeanless();
            let text = this.GetText();
            if (isEndByBrace && text.search(/^[\s\t]*}/) >= 0) {
                break;
            }
            try {
                if (Symbol = this.GetMethodInfo(text, this.classname)) {
                    result.push(Symbol);
                }
                else if (Symbol = this.GetClassInfo(text)) {
                    result.push(Symbol);
                }
                else if (Symbol = this.GetLabelInfo(text)) {
                    result.push(Symbol);
                }
            }
            catch (e) {
                continue;
            }
            finally {
                this.line++;
            }
            if (this.line > this.classendline) {
                this.classname = undefined;
            }
        }
        this.symboltree = result;
        return this;
    }

    getTree(): SymbolNode[] {
        // await this.done;
        return <SymbolNode[]>this.symboltree;
    }

    public getFuncPrototype(symbol: FuncNode): string {
        let result = symbol.name + '(';
        symbol.params.forEach(param => {
            result += param.label + ', ';
        })
        return result.slice(0, -2)+')';
    }

    public convertTreeCompletion(): CompletionItem[] {
        let symbol: SymbolNode[] = this.getTree();
		let sci: CompletionItem[] = [];
		
		for(let i=0,len=symbol.length; i<len; i++) {
			let info = symbol[i];
			let ci = CompletionItem.create(info.name);
			if (info.kind === SymbolKind.Function) {
				ci['kind'] = CompletionItemKind.Function;
				ci.data = this.getFuncPrototype(<FuncNode>info);
			} else if (info.kind === SymbolKind.Method) {
				ci['kind'] = CompletionItemKind.Method;
				ci.data = this.getFuncPrototype(<FuncNode>info);
			} else if (info.kind === SymbolKind.Class) {
				ci['kind'] = CompletionItemKind.Class;
			} else if (info.kind === SymbolKind.Event) {
				ci['kind'] = CompletionItemKind.Event;
			} else if (info.kind === SymbolKind.Null) {
				ci['kind'] = CompletionItemKind.Text;
			} 
			sci.push(ci);
        }
        return sci;
    }

    public getFuncAtPosition(position: Position): {func: FuncNode, index: number}|undefined {
        const reg = /[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+\((?=.*?)(?!\))/g;
        const context = this.document.getText(Range.create(Position.create(position.line, 0), position));
        let m = context.match(reg);
        let p = context.split(reg);
        if (m) {
            const funcName = m[m.length-1].slice(0, -1);
            const tree = this.getTree();
            let func:FuncNode;
            for (let i=0,len=tree.length; i<len; i++) {
                if (tree[i].name === funcName && (tree[i].kind === SymbolKind.Function)) {
                    func = <FuncNode>tree[i];
                    if (func.range.start.line === position.line) {
                        return undefined;
                    }
                    let index = p[p.length-1].split(',').length - 1
                    return {
                        func: func,
                        index: index
                    }
                }
            }
        }
    }

    getDefinitionAtPosition(position: Position): SymbolNode[] {
        
        let word = this.getWordAtPosition(position);
        let nodeList:SymbolNode[] = [];
        for (let tree = this.getTree(), i=0; i < tree.length; i++) {
            if (tree[i].name === word.name) {
                nodeList.push(tree[i]);
            }
        }
        return nodeList;
    }

    private getWordAtPosition(position: Position): Word {
        let reg = /[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+/;
        const context = this.document.getText(Range.create(Position.create(position.line, 0), Position.create(position.line+1, 0)));
        let wordName = '';
        let start: Position;
        let end: Position;
        let pos: number;

        // Scan start
        pos = position.character 
        for (let c = this.getChar(context, pos); c !== ''; --pos) {
            if(c.search(reg) >= 0) {
                wordName = c + wordName;
                c = this.getChar(context, pos-1);
            } else {
                break;
            }
        }
        start = Position.create(position.line, pos+1); // why start need +1?
        // Scan end
        pos = position.character+1
        for (let c = this.getChar(context, pos); c !== ''; pos++) {
            if(c.search(reg) >= 0) {
                wordName += c;
                c = this.getChar(context, pos+1);
            } else {
                break;
            }
        }
        end = Position.create(position.line, pos);
        return Word.create(wordName, Range.create(start, end));
    }

    private getChar(context: string, pos: number): string {
        try {
            return context[pos] ? context[pos] : '';
        } catch (err) {
            return '';
        }
    }

    /**
    * @param text document line content
    * @param scopename class name of a function
    */
    private GetMethodInfo(text: string, scopename?: string): FuncNode|undefined {
        // if we match the funcName(param*), 
        // then we check if it is a function definition
        let range: Range;
        let SymbolFunc: FuncNode;
        let methodMatch = text.match(/^[ \t]*(?<funcname>[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+)(\(.*?\))/);
        if (methodMatch) {
            let l = this.line;
            let name:string = (<{[key: string]: string}>methodMatch['groups'])['funcname']
            try {
                range = this.GetSymbolRange(text, name, methodMatch[2], methodMatch[0]);
            }
            catch(error) {
                // reset flag 
                this.lineCommentFlag = false;
                throw "get wrong";
            }
            if (!scopename) {
                SymbolFunc = FuncNode.create(name, SymbolKind.Function, range, this.PParams(methodMatch[2]));
            } 
            else {
                SymbolFunc = FuncNode.create(name, SymbolKind.Method, range, this.PParams(methodMatch[2]));
            }
            return SymbolFunc;
        }
    }

    /**
    * @param text document line content
    */
    private GetClassInfo(text: string):SymbolNode|undefined {
        // if we match the funcName(param*), 
        // then we check if it is a function definition
        let range: Range;
        let methodMatch = text.match(/^[ \t]*class[ \t]+(?<classname>[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+)/i);
        if (methodMatch) {
            let l = this.line;
            let name:string = (<{[key: string]: string}>methodMatch['groups'])['classname'];
            try {
                range = this.GetSymbolRange(text,name, "", methodMatch[0], 1000)
            }
            catch(error) {
                // reset flag 
                this.lineCommentFlag = false;
                throw "get wrong"
            }
            finally {
                this.line = l;
            }
            let SymbolFunc = SymbolNode.create(name, SymbolKind.Class, range);
            return SymbolFunc;
        }
    }

    private GetLabelInfo(text: string):SymbolNode|undefined {
        let match = text.match(/^[\t\s]*(?!;)(?<labelname>[a-zA-Z0-9\Q@#$_\[\]?~`!%^&*\+\-()={}|\:;"'<>./\E]+):(?=([\t\s]*|[\t\s]+\Q;\E))/);
        if (match) {
            let range = Range.create(Position.create(this.line, 0), Position.create(this.line, 0));
            let labelname = (<{[key: string]: string}>match['groups'])['labelname'];
            if (labelname[labelname.length-1] === ":" && labelname[labelname.length-2] !== ":")
                return SymbolNode.create(labelname.slice(0, labelname.length-1), SymbolKind.Event, range);
            return SymbolNode.create(labelname, SymbolKind.Null, range);
        }
    }

    private PParams(s_params: string): ParameterInformation[] {
        s_params = s_params.slice(1, -1);
        let result: ParameterInformation[] = [];
        s_params.split(',').forEach(param =>{
            result.push(ParameterInformation.create(param.trim()));
        });
        return result;
    }

    protected GetText() :string {
        let line = Range.create(Position.create(this.line, 0), Position.create(this.line+1, 0));
        // FIXME: getline here
        let text = this.document.getText(line)
        return text;
    }

    private addReference(variable: string, symbol: string, line: number): void {
        if (this.referenceTable[symbol]) {
            this.referenceTable[symbol].push(ReferenceInfomation.create(variable, line));
        }
        else {
            this.referenceTable[symbol] = [ReferenceInfomation.create(variable, line)];
        }
    }

    protected GetSymbolRange(text: string, symbolName: string, pairstr:string, fullmatch: string, maxrange: number = 300): Range {
        let startIndex = fullmatch.search(symbolName);
        let startLine = this.line;
        let nextSearchStr = text.slice(startIndex+pairstr.length+symbolName.length);
        let endline:number;
        let endIndex:number;

        // skip if() and while()
        if (fullmatch.search(/^[\s\t]*(if|while)[\s\t]*\(/i) >= 0) {
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
                let templ = text.split(':=', 2);
                this.addReference(templ[0].trim(), templ[1].trim(), startLine);
                throw "Not a symbol";
            }
        }
        // here we found it
        this.line++;

        try {
            this.FindCloseBrace(maxrange);
        } catch (error) {
            throw error;
        }

        endline = this.line;
        endIndex = (<RegExpMatchArray>this.GetText().match(/^[ \t]*(})/))[0].length;
        return Range.create(Position.create(startLine, startIndex), 
                                Position.create(endline, endIndex));
    }

    /**
     *  go to next line search "}"
     *  though ahk premit end function with "}" after "{" immediately, but I do not premit it.
     *  I said calculation.
     */
    protected FindCloseBrace(maxrange: number): void {
        let unclosedPairNum = 1;
        let nextSearchStr = this.GetText();
        let maxLine = Math.min(this.document.lineCount, this.line+maxrange);
        
        while (unclosedPairNum !== 0) {
            // Exclude "{}" pairs of if and while
            // by count how many this kind of pairs we meet
            if (this.line > maxLine-1) {
                throw "Break symbol!";
            }
            this.JumpMeanless();
            nextSearchStr = this.GetText();

            let a_LPair = nextSearchStr.match(/[\s\t]*{/g);
            let a_RPair = nextSearchStr.match(/[\s\t]*}/g);

            if (a_LPair) {
                unclosedPairNum += a_LPair.length;
            }
            if (a_RPair) {
                unclosedPairNum -= a_RPair.length;
            }
            
            this.line++;
        }
        this.line--
    }

    public PComment(text:string):boolean {
        if (this.lineCommentFlag === true) {
            // end of block commentss
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

    protected JumpMeanless() {
        let text = this.GetText()
        while (this.PComment(text) || text.trim() === "") {
            this.line++;
            if (this.line >= this.document.lineCount-1) {
                break;
            } else {
                text = this.GetText();
            }
        }
        this.lineCommentFlag = false;
    }

}