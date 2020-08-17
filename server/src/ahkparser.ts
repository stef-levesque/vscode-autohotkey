import {
	Position,
	Range,
	Location,
	SymbolInformation,
    SymbolKind,
    ParameterInformation,
    CompletionItem,
    CompletionItemKind,
    RemoteConsole
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
    private currentText: string|undefined;
    private lineCommentFlag: boolean = false;
    private classname: string|undefined = '';
    private classendline: number = 0;
    private symboltree: SymbolNode[]|null;
    private referenceTable: {[key: string]: ReferenceInfomation[]} = {};
    private done: boolean = false;
    private logger: RemoteConsole['log'];
    document: TextDocument;

    constructor (logger: RemoteConsole['log'],document: TextDocument){
        this.document = document;
        this.logger = logger;
        this.symboltree = null;
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

    private advanceLine(): void {
        if (this.line < this.document.lineCount-1) {
            this.line++;
            this.currentText = this.GetText();
        } else {
            this.currentText = undefined;
        }
    }

    public Parse(): void {
        this.line = 0;
        this.advanceLine();
        this.symboltree = this.Analyze();
    }

    public Analyze(isEndByBrace: boolean = false, maxLine: number = 10000): SymbolNode[] {
        const lineCount = Math.min(this.document.lineCount, maxLine);

        let Symbol: SymbolNode|undefined;
        const result: SymbolNode[] = [];
        const FuncReg = /^[ \t]*(?<funcname>[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+)(\(.*?\))/;
        const ClassReg = /^[ \t]*class[ \t]+(?<classname>[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+)/i;
        const VarReg = /^[\s\t]*([a-zA-Z_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*)(?=[\s\t]*:?=)/;
        let match:RegExpMatchArray|null;
        let unclosedBrace = 1;

        while (this.currentText) {
            if (this.line > lineCount-1 && 
                (isEndByBrace && unclosedBrace <= 0)) {
                break;
            }
            this.advanceLine();
            this.JumpMeanless();
            let startLine = this.line;
            try {
                if ((match = this.currentText.match(FuncReg)) && this.isVaildBlockStart()) {
                    switch (match[1].toLocaleLowerCase()) {
                        // skip if() and while()
                        case 'if':
                        case 'while':
                            unclosedBrace++;
                            break;
                    
                        default:
                            result.push(this.GetMethodInfo(match, startLine));
                            break;
                    }
                }
                else if ((match = this.currentText.match(ClassReg)) && this.isVaildBlockStart()) {
                    result.push(this.GetClassInfo(match, startLine));
                }
                else if (Symbol = this.GetLabelInfo()) {
                    result.push(Symbol);
                } 
                else if (match = this.currentText.match(VarReg)) {
                    unclosedBrace += this.getUnclosedNum();
                    result.push(this.GetVarInfo(match))
                }
                else {
                    unclosedBrace += this.getUnclosedNum();
                }
            }
            catch (error) {
                // TODO: log every parse error here
                // this.logger(error.stringfy())
                continue;
            }
            if (this.line > this.classendline) {
                this.classname = undefined;
            }
        }
        return result;
    }

    /**
     * verify is a vaild block start
     * if not is add reference of this symbol
     */
    private isVaildBlockStart(): boolean {
        // search if there is a "{" in the rest of the line
        // if not we go next line 
        let line = this.line;
        let text = this.currentText as string;
        if (this.currentText && this.currentText.search(/^\s*{/) < 0) {
            this.advanceLine();
            // we jump Meanless line, space line and comment line
            this.JumpMeanless();
            if (this.currentText === undefined) {
                return false;
            }
            if (this.currentText.search(/^[ \t]*({)/) >= 0) {
                return true;
            }
        } 
        let templ = text.split(':=', 2);
        this.addReference(templ[0].trim(), templ[1].trim(), line);
        return false;
    }

    private getUnclosedNum(): number {
        let nextSearchStr = <string>this.currentText;
        let unclosedPairNum:number = 0;
        let a_LPair = nextSearchStr.match(/[\s\t]*{/g);
        let a_RPair = nextSearchStr.match(/[\s\t]*}/g);

        if (a_LPair) {
            unclosedPairNum += a_LPair.length;
        }
        if (a_RPair) {
            unclosedPairNum -= a_RPair.length;
        }
        return unclosedPairNum;
    }

    /**
    * @param match fullmatch array of a method
    * @param startLine start line of a method
    */
    private GetMethodInfo(match: RegExpMatchArray, startLine: number): FuncNode {
        // if we match the funcName(param*), 
        // then we check if it is a function definition
        let name:string = (<{[key: string]: string}>match['groups'])['funcname']
        let sub = this.Analyze(true, 500);
        let endMatch: RegExpMatchArray|null;
        if (this.currentText && (endMatch = this.currentText.match(/^[ \t]*(})/))) {
            let endLine = this.line;
            let endIndex = endMatch[0].length;
            return FuncNode.create(name, 
                                   SymbolKind.Function,
                                   Range.create(Position.create(startLine, 0), Position.create(endLine, endIndex)),
                                   this.PParams(match[2]),
                                   sub);
        }
        return FuncNode.create(name, 
                        SymbolKind.Function,
                        Range.create(Position.create(startLine, 0), Position.create(startLine, 0)),
                        this.PParams(match[2]));
    }

    /**
    * @param text document line content
    */
    private GetClassInfo(match: RegExpMatchArray, startLine: number):SymbolNode {
        // if we match the funcName(param*), 
        // then we check if it is a function definition
        let name:string = (<{[key: string]: string}>match['groups'])['classname']
        let sub = this.Analyze(true, 1000);
        let endMatch: RegExpMatchArray|null;
        if (this.currentText && (endMatch = this.currentText.match(/^[ \t]*(})/))) {
            let endLine = this.line;
            let endIndex = endMatch[0].length;
            return SymbolNode.create(name, 
                                   SymbolKind.Class,
                                   Range.create(Position.create(startLine, 0), Position.create(endLine, endIndex)),
                                   sub);
        }
        return SymbolNode.create(name, 
                        SymbolKind.Class,
                        Range.create(Position.create(startLine, 0), Position.create(startLine, 0)));
    }

    private GetLabelInfo():SymbolNode|undefined {
        let text = <string>this.currentText;
        let match = text.match(/^[\t\s]*(?!;)(?<labelname>[a-zA-Z0-9\Q@#$_\[\]?~`!%^&*\+\-()={}|\:;"'<>./\E]+):(?=([\t\s]*|[\t\s]+\Q;\E))/);
        if (match) {
            let range = Range.create(Position.create(this.line, 0), Position.create(this.line, 0));
            let labelname = (<{[key: string]: string}>match['groups'])['labelname'];
            if (labelname[labelname.length-1] === ":" && labelname[labelname.length-2] !== ":")
                return SymbolNode.create(labelname.slice(0, labelname.length-1), SymbolKind.Event, range);
            return SymbolNode.create(labelname, SymbolKind.Null, range);
        }
    }

    private GetVarInfo(match: RegExpMatchArray): SymbolNode {
        let index = match[0].length - match[1].length;
        return SymbolNode.create(match[1], 
                                SymbolKind.Variable,
                                Range.create(Position.create(this.line, index), Position.create(this.line, index)));
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

    public PComment():boolean {
        let text = <string>this.currentText;
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
        while ((this.currentText && this.currentText.trim() === "") ||
                this.PComment()) {
            this.advanceLine();
            if (this.line >= this.document.lineCount-1) {
                break;
            }
        }
        this.lineCommentFlag = false;
    }
}