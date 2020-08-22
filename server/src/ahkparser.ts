import {
	Position,
	Range,
    SymbolKind,
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
    params: Parameter[]
}

export interface Word {
    name: string
    range: Range
}

export interface Parameter {
    /**
     * Name of a parameter
     */
    name: string
    /**
     * default value of a parameter
     */
    defaultVal?: string
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
    export function create(name: string, kind: SymbolKind, range: Range, params: Parameter[], subnode?: SymbolNode[]): FuncNode {
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

namespace Parameter {
    export function create(name: string): Parameter {
        return {name: name};
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

// if belong to FuncNode
function isFuncNode(props: any): props is FuncNode{
    return typeof (props as FuncNode)['params'] !== 'undefined';
}

export class Lexer {
    private line = -1;
    private currentText: string|undefined;
    private lineCommentFlag: boolean = false;
    private symboltree: Array<SymbolNode|FuncNode>|null;
    private referenceTable: {[key: string]: ReferenceInfomation[]} = {};
    private done: boolean = false;
    // private logger: RemoteConsole['log'];
    document: TextDocument;

    constructor (document: TextDocument){
        this.document = document;
        this.symboltree = null;
    }

    public getTree(): Array<SymbolNode|FuncNode> {
        // await this.done;
        return <Array<SymbolNode|FuncNode>>this.symboltree;
    }

    public getFuncPrototype(symbol: FuncNode): string {
        let result = symbol.name + '(';
        symbol.params.map(param => {
            result += param.name;
            if (param.defaultVal) {
                result += ' := ' + param.defaultVal;
            }
            result += ', '
        })
        return result.slice(0, -2)+')';
    }

    public convertParamsCompletion(node: SymbolNode): CompletionItem[] {
        if (node.kind === SymbolKind.Function) {
            let params =  (<FuncNode>node).params
            return params.map(param => {
                let pc = CompletionItem.create(param.name);
                pc.kind = CompletionItemKind.Variable;
                return pc;
            })
        }
        else {
            return [];
        }
    }

    public getGlobalCompletion(): CompletionItem[] {
		return this.getTree().map(node => {
            return this.convertNodeCompletion(node);
        });
    }

    public getScopedCompletion(pos: Position): CompletionItem[] {
        let node = this.searchNodeAtPosition(pos, this.getTree());
        
        if (node && node.subnode) {
            return node.subnode.map(node => {
                return this.convertNodeCompletion(node);
            }).concat(...this.convertParamsCompletion(node));
        }
        else {
            return [];
        }
    }

    /**
     * Get all nodes of a particular token.
     * return all possible nodes or empty list
     * @param position 
     */
    public getSuffixNodes(position: Position): (SymbolNode|FuncNode)[]|undefined {
        const context = this.document.getText(Range.create(Position.create(position.line, 0), Position.create(position.line+1, 0)));
        let suffix = this.getWordAtPosition(position);
        let perfixs: string[] = [];
        let temppos = (suffix.name === '') ? suffix.range.start.character : suffix.range.start.character-1;
        // let w = this.document.getText(suffix.range);

        // Push perfixs into perfixs stack
        while (this.getChar(context, temppos) === '.') {
            let word = this.getWordAtPosition(Position.create(position.line, temppos-1));
            perfixs.push(word.name);
            temppos = word.range.start.character-1;
        }
        let perfix: string|undefined;
        let nodeList: SymbolNode[] = this.getTree();
        
        // Search tree
        let isFound = false;
        while (perfix = perfixs.pop()) {
            isFound = false;
            if (perfix === 'this') {
                let classNode = this.searchNodeAtPosition(position, this.getTree(), SymbolKind.Class);
                if (classNode && classNode.subnode) {
                    nodeList = classNode.subnode;
                } 
                else {
                    return undefined;
                }
            }
            for(const node of nodeList) {
                if (node.name === perfix && node.subnode) {
                    nodeList = node.subnode;
                    isFound = true;
                    break;
                }
            }
            // TODO: Check reference here
            if (!isFound) {
                return undefined;
            }
        }

        if (isFound) {
            return nodeList;
        }
        return undefined;
    }

    /**
     * search at given tree to 
     * find the deepest node that
     * covers the given condition
     *  
     * @param pos position to search
     * @param tree AST tree for search
     * @param kind symbol kind of search item
     */
    public searchNodeAtPosition(pos: Position, tree: Array<SymbolNode|FuncNode>, kind:SymbolKind = SymbolKind.Function): SymbolNode|FuncNode|undefined {
        for (const node of tree) {
            if (pos.line > node.range.start.line && pos.line < node.range.end.line && node.kind === kind) {
                if (node.subnode) {
                    let subScopedNode = this.searchNodeAtPosition(pos, node.subnode);
                    if (subScopedNode) {
                        return subScopedNode;
                    } 
                    else {
                        return node;
                    }
                }
            }
        }
        return undefined;
    }

    /**
     * Convert a node to comletion item
     * @param info node to be converted
     */
    public convertNodeCompletion(info: SymbolNode): CompletionItem {
        let ci = CompletionItem.create(info.name);
        if (isFuncNode(info)) {
            ci['kind'] = CompletionItemKind.Function;
            ci.data = this.getFuncPrototype(info);
        }  else if (info.kind === SymbolKind.Variable) {
            ci.kind = CompletionItemKind.Variable;
        } else if (info.kind === SymbolKind.Class) {
            ci['kind'] = CompletionItemKind.Class;
        } else if (info.kind === SymbolKind.Event) {
            ci['kind'] = CompletionItemKind.Event;
        } else if (info.kind === SymbolKind.Null) {
            ci['kind'] = CompletionItemKind.Text;
			} 
        return ci;
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
        let tree = this.getSuffixNodes(position);
        if (!tree) {
            tree = this.getTree()
        }
        let nodeList:SymbolNode[] = [];
        for (let i=0; i < tree.length; i++) {
            if (tree[i].name === word.name) {
                nodeList.push(tree[i]);
            }
        }
        return nodeList;
    }

    private getWordAtPosition(position: Position): Word {
        let reg = /[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+/;
        let context = this.document.getText(Range.create(Position.create(position.line, 0), Position.create(position.line+1, 0)));
        context = context.slice(0, context.length-2);
        let wordName = '';
        let start: Position;
        let end: Position;
        let pos: number;

        // if given position is beyond line length, start at last character
        pos = (position.character >= context.length) ? context.length-1 : position.character
        // Scan start
        for (let c = this.getChar(context, pos); c !== ''; --pos) {
            if(c.search(reg) >= 0) {
                wordName = c + wordName;
                c = this.getChar(context, pos-1);
            } else {
                break;
            }
        }
        pos = (pos+1 >= context.length) ? context.length-1 : pos+1
        start = Position.create(position.line, pos); // why start need +1?
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
        // if end is beyond line length, end at last character
        pos = (pos >= context.length) ? context.length-1 : pos
        end = Position.create(position.line, pos);
        return Word.create(wordName, Range.create(start, end));
    }

    private getChar(context: string, pos: number): string {
        try {
            // if (context[pos] === '\r' || context[pos] === '\t')
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
        this.line = -1;
        this.advanceLine();
        this.symboltree = this.Analyze();
    }

    public Analyze(isEndByBrace: boolean = false, maxLine: number = 10000): Array<SymbolNode|FuncNode> {
        const lineCount = Math.min(this.document.lineCount, maxLine);

        let Symbol: SymbolNode|undefined;
        const result: Array<SymbolNode|FuncNode> = [];
        const FuncReg = /^[ \t]*(?<funcname>[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+)(\(.*?\))/;
        const ClassReg = /^[ \t]*class[ \t]+(?<classname>[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+)/i;
        const VarReg = /^[\s\t]*([a-zA-Z_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*)(?=[\s\t]*:?=)/;
        let match:RegExpMatchArray|null;
        let unclosedBrace = 0;

        while (this.currentText && this.line <= lineCount-1) {
            this.JumpMeanless();
            let startLine = this.line;
            try {
                if ((match = this.currentText.match(FuncReg)) && this.isVaildBlockStart()) {
                    switch (match[1].toLowerCase()) {
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
                // abandone a line while error
                continue;
            }
            if (isEndByBrace && unclosedBrace <= 0) {
                break;
            }
            this.advanceLine();
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
    * @param match match result
    * @param startLine startline of this symbol
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

    private PParams(s_params: string): Parameter[] {
        s_params = s_params.slice(1, -1);
        let result: Parameter[] = [];
        s_params.split(',').map(param =>{
            let paraminfo = Parameter.create(param.trim());
            // check if the parameter has a default value
            let l = paraminfo.name.split(/:?=/);
            if (l.length > 1) {
                paraminfo.defaultVal = l[1];
            }
            result.push(paraminfo);
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
        // TODO: Support Docs comments
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