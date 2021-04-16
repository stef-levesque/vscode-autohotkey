import {
	Position,
	Range,
    SymbolKind,
} from 'vscode-languageserver';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { 
    extname 
} from 'path';

import { 
    FuncNode, 
    Parameter, 
    ReferenceInfomation, 
    ReferenceMap, 
    SymbolNode,
    ClassNode, 
    Token, 
    TokenType,
    IDocumentInfomation,
    ISymbolNode,
    IFuncNode,
    VariableNode
} from './types';
import { Tokenizer } from './tokenizer'
import { mockLogger } from '../utilities/logger';
export class Lexer {
    private line = -1;
    private currentText: string|undefined;
    private currentrawText: string = '';
    private lineCommentFlag: boolean = false;
    private symboltree: Array<ISymbolNode|IFuncNode>|null;
    private referenceTable: ReferenceMap;
    private includeFile: Set<string> = new Set();
    private document: TextDocument;

    private logger: ILoggerBase;

    constructor (document: TextDocument, logger: ILoggerBase = mockLogger){
        this.document = document;
        this.symboltree = null;
        this.referenceTable = new Map();
        this.logger = logger;
    }

    private advanceLine(): void {
        if (this.line < this.document.lineCount-1) {
            this.line++;
            this.currentrawText = this.GetText();
            this.currentText = this.currentrawText.replace(/"(""|.)*?"/g, '""');
        } else {
            this.currentText = undefined;
        }
    }

    public Parse(): IDocumentInfomation {
        this.line = -1;
        this.advanceLine();
        this.referenceTable = new Map();
        this.symboltree = this.Analyze();
        return {
            tree: this.symboltree,
            refTable: this.referenceTable,
            include: this.includeFile
        }
    }

    public Analyze(isEndByBrace: boolean = false, maxLine: number = 10000): Array<ISymbolNode|IFuncNode> {
        const lineCount = Math.min(this.document.lineCount, this.line + maxLine);

        let Symbol: Maybe<ISymbolNode>;
        const result: Array<ISymbolNode> = [];
        const FuncReg = /^[ \t]*(?<funcname>[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+)(\(.*?\))/;
        const ClassReg = /^[ \t]*class[ \t]+(?<classname>[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+)/i;
        const VarReg = /\s*\b((?<!\.)[a-zA-Z\u4e00-\u9fa5#_@$][a-zA-Z0-9\u4e00-\u9fa5#_@$]*)(\.[a-zA-Z0-9\u4e00-\u9fa5#_@$]+)*?\s*(?=[+\-*/.:]=|\+\+|\-\-)/g;
        const includeReg = /^\s*#include[,]?/i;
        let match:RegExpMatchArray|null;
        let unclosedBrace = 1;
        let varnames: Set<string> = new Set();

        while (this.currentText && this.line <= lineCount-1) {
            this.JumpMeanless();
            let startLine = this.line;
            try {
                if ((match = this.currentText.match(FuncReg)) && this.isVaildBlockStart(match[0].length)) {
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
                else if ((match = this.currentText.match(ClassReg)) && this.isVaildBlockStart(match[0].length)) {
                    result.push(this.GetClassInfo(match, startLine));
                }
                else if (Symbol = this.GetLabelInfo()) {
                    unclosedBrace += this.getUnclosedNum();
                    result.push(Symbol);
                } 
                // improved var match and parse
                // thanks to 天黑请闭眼
                else if (match = this.currentText.match(VarReg)) {
                    unclosedBrace += this.getUnclosedNum();
                    for (let i = 0; i < match.length; i++) {
                        let name = match[i].trim();
                        // FIXME: wrong when refer class after first assign
                        if (varnames.has(name.toLowerCase())) {
                            continue;
                        }
                        varnames.add(name.toLowerCase());
                        result.push(this.GetVarInfo(name));
                    }
                }
                else {
                    if (match = this.currentText.match(includeReg)) {
                        this.checkInclude(this.currentText.slice(match[0].length).trim());
                    }
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
    private isVaildBlockStart(startIndex: number): boolean {
        // search if there is a "{" in the rest of the line
        // if not we go next line 
        let line = this.line;
        const text = (<string>this.currentText).slice(startIndex);
        if (text.search(/{/) >= 0) {
            this.advanceLine();
            return true;
        } 
        else {
            this.advanceLine();
            // we jump Meanless line, space line and comment line
            this.JumpMeanless();
            if (this.currentText === undefined) {
                return false;
            }
            if (this.currentText.search(/^[ \t]*({)/) >= 0) {
                this.advanceLine();
                return true;
            }
        }
        // let templ = text.split(':=', 2);
        // this.addReference(templ[0].trim(), templ[1].trim(), line);
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
     * Add a normalized absolute include path 
     * @param rawPath Raw include path of a ahk file
     */
    private checkInclude(rawPath: string): void {
        switch (extname(rawPath)) {
            case '.ahk':
                this.includeFile.add(rawPath);
                break;
            case '':
                if (rawPath[0] === '<' && rawPath[rawPath.length-1] === '>')
                    this.includeFile.add(rawPath)
                // TODO: handle include path change
                break;
            default:
                break;
        }
    }

    /**
    * @param match fullmatch array of a method
    * @param startLine start line of a method
    */
    private GetMethodInfo(match: RegExpMatchArray, startLine: number): IFuncNode {
        // if we match the funcName(param*), 
        // then we check if it is a function definition
        let name:string = (<{[key: string]: string}>match['groups'])['funcname']
        let sub = this.Analyze(true, 500);
        let endMatch: RegExpMatchArray|null;
        if (this.currentText && (endMatch = this.currentText.match(/^[ \t]*(})/))) {
            let endLine = this.line;
            let endIndex = endMatch[0].length;
            return new FuncNode(name, 
                                SymbolKind.Function,
                                Range.create(Position.create(startLine, 0), Position.create(endLine, endIndex)),
                                this.PParams(match[2]),
                                sub);
        }
        this.logger.error(`Method parse fail: ${name} at ${startLine+1}-${this.line+1}`)
        return new FuncNode(name, 
                        SymbolKind.Function,
                        Range.create(Position.create(startLine, 0), Position.create(startLine, 0)),
                        this.PParams(match[2]));
    }

    /**
    * @param match match result
    * @param startLine startline of this symbol
    */
    private GetClassInfo(match: RegExpMatchArray, startLine: number):ISymbolNode {
        let name:string = (<{[key: string]: string}>match['groups'])['classname']
        let sub = this.Analyze(true, 2000);
        let endMatch: RegExpMatchArray|null;
        // FIXME: temporary soluation, invaild -1 line marked builtin property
        const invaildRange: Range = Range.create(
            Position.create(-1, -1),
            Position.create(-1, -1)
        );
        // class property belongs to method's subnode which is wrong
        // fix it here
        let propertyList: ISymbolNode[] = [
            new SymbolNode('base', SymbolKind.Property, invaildRange),
            new SymbolNode('__class', SymbolKind.Property, invaildRange)
        ];
        for (const fNode of sub) {
            if (fNode instanceof FuncNode && fNode.subnode) {
                // temp array containing non-property node
                let temp: ISymbolNode[] = [];
                for (const node of fNode.subnode) {
                    if (node.kind === SymbolKind.Property) {
                        propertyList.push(node);
                    }
                    else
                        temp.push(node);
                }
                fNode.subnode = temp;
            }
            // varible belongs to class is a property
            // fix it here
            else if (fNode.kind === SymbolKind.Variable)
                fNode.kind = SymbolKind.Property
        }
        sub.push(...propertyList);
        // get end of class
        if (this.currentText && (endMatch = this.currentText.match(/^[ \t]*(})/))) {
            let endLine = this.line;
            let endIndex = endMatch[0].length;
            return new ClassNode(name, 
                            SymbolKind.Class,
                            Range.create(Position.create(startLine, 0), Position.create(endLine, endIndex)),
                            sub);
        }
        this.logger.error(`Class parse fail: ${name} at ${startLine+1}-${this.line+1}`)
        return new ClassNode(name, 
                        SymbolKind.Class,
                        Range.create(Position.create(startLine, 0), Position.create(startLine, 0)),
                        sub);
    }

    private GetLabelInfo():ISymbolNode|undefined {
        let text = <string>this.currentText;
        let match = text.match(/^\s*(?<labelname>[a-zA-Z\u4e00-\u9fa5#_@$][a-zA-Z0-9\u4e00-\u9fa5#_@$]*):\s*(\s;.*)?$/);
        let range = Range.create(Position.create(this.line, 0), Position.create(this.line, 0));
        if (match) {
            let labelname = (<{ [key: string]: string }>match['groups'])['labelname'];
            return new SymbolNode(labelname, SymbolKind.Null, range);
        } else if (match = text.match(/^\s*(?<labelname>[\x09\x20-\x7E]+)::/)) {
            let labelname = (<{ [key: string]: string }>match['groups'])['labelname'];
            return new SymbolNode(labelname, SymbolKind.Event, range);
        }
    }

    /**
     * Return variable symbol node
     * @param match matched variable name string
     */
    private GetVarInfo(match: string): ISymbolNode {
        // get position of current variable in current line
        const index = (<string>this.currentText).search(match);
        // cut string to assignment token for parsing of tokenizer
        const s = (<string>this.currentText).slice(index+match.length);
        let ref: Maybe<string>;
        const tokenizer = new Tokenizer(s);
        let tokenStack: Token[] = [];
        tokenStack.push(tokenizer.GetNextToken());
        tokenStack.push(tokenizer.GetNextToken());
        let t = tokenStack.pop();
        if (t && t.type === TokenType.new) {
            let token = tokenizer.GetNextToken();
            if (token.type === TokenType.id) {
                let perfix:string[] = [token.content];
                while (tokenizer.currChar === '.') {
                    tokenizer.GetNextToken();
                    token = tokenizer.GetNextToken();
                    if (token.type === TokenType.id) {
                        perfix.push(token.content);
                    }
                }
                ref = perfix.join('.');
                this.addReference(match, perfix.join('.'), this.line);
            }
        }
        // check if var is a property
        if (match.search(/\./) >= 0) {
            let propertyList: string[] = match.split('.')
            if (propertyList[0] === 'this') {
                // property is return as subnode of method
                // will be fixed in GetClassInfo
                return new VariableNode(propertyList[1], 
                            SymbolKind.Property,
                            Range.create(Position.create(this.line, index), Position.create(this.line, index)),
                            ref);
            }
        }
        return new VariableNode(match, 
                        SymbolKind.Variable,
                        Range.create(Position.create(this.line, index), Position.create(this.line, index)),
                        ref);
    }

    private PParams(s_params: string): Parameter[] {
        s_params = s_params.slice(1, -1);
        let result: Parameter[] = [];
        s_params.split(',').map(param =>{
            let paraminfo = Parameter.create(param.trim());
            // check if the parameter has a default value
            let l = paraminfo.name.split(/:?=/);
            if (l.length > 1) {
                paraminfo.name = l[0].trim();
                paraminfo.isOptional = true;
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
    /**
     * Add reference infomation to referenceTable
     * @param variable var
     * @param symbol Class or function that a variable is refered
     * @param line Line of the variable
     */
    private addReference(variable: string, symbol: string, line: number): void {
        if (this.referenceTable.has(symbol)) {
            this.referenceTable.get(symbol)?.push(ReferenceInfomation.create(variable, line));
        }
        else {
            this.referenceTable.set(symbol, [ReferenceInfomation.create(variable, line)]);
        }
    }

    private PComment():boolean {
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
