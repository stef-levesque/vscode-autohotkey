import {
	CompletionItem,
	CompletionItemKind,
    Definition,
    Location,
	Position,
	Range,
	SymbolKind
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { 
    FuncNode,
	ReferenceInfomation, 
	SymbolNode, 
	Word,
    ReferenceMap,
    IFakeDocumentInfomation,
    NodeInfomation,
    ILoggerBase
} from '../utilities/types';
import {
	INodeResult, 
	IFunctionCall, 
	IMethodCall, 
	IPropertCall, 
	IAssign, 
	IASTNode, 
	FunctionCall,
	MethodCall,
    ICommandCall,
    CommandCall
} from '../parser/asttypes';
import { SemanticStack, isExpr } from '../parser/semantic_stack';
import { 
    BuiltinFuncNode,
    buildBuiltinFunctionNode,
    buildBuiltinCommandNode
} from '../utilities/constants';
import {
    dirname,
    extname,
    normalize
} from 'path';
import { homedir } from "os";
import { Lexer } from '../parser/ahkparser';
import { IoEntity, IoKind, IoService } from './ioService';
import { union } from '../utilities/setOperation';

// if belongs to FuncNode
function isFuncNode(node: SymbolNode): node is FuncNode{
    return typeof (node as FuncNode)['params'] !== 'undefined';
}

function setDiffSet<T>(set1: Set<T>, set2: Set<T>) {
    let d12: Array<T> = [], d21: Array<T> = [];
    for(let item of set1) {
        if (!set2.has(item)) {
            d12.push(item);
        }
    }
    for(let item of set2) {
        if (!set1.has(item)) {
            d21.push(item);
        }
    }
    return [d12, d21];
}

export class TreeManager
{
	/**
	 * server cached documnets
	 */
	private serverDocs: Map<string, TextDocument>;
	/**
	 * server cached ahk config
	 * TODO: need finish
	 */
	private serverConfigDoc?: TextDocument;
	/**
	 * server cached AST for documents, respectively
	 */
    private docsAST: Map<string, IFakeDocumentInfomation>;

    /**
     * Server cached include informations for each documents
     * Map<DocmemtsUri, Map<RawIncludePath, IncludeAbsolutePath>>
     */
    private incInfos: Map<string, Map<string, string>>;

    private logger: ILoggerBase;

    private ioService: IoService;
    
    /**
     * built-in standard function AST
     */
	private readonly builtinFunction: BuiltinFuncNode[];
    
    /**
     * builtin standard command AST
     */
    private readonly builtinCommand: BuiltinFuncNode[];

    private currentDocUri: string;
    
    /**
     * Standard Library directory
     */
    private readonly SLibDir: string;
    
    /**
     * User library directory
     */
    private readonly ULibDir: string;

	constructor(logger: ILoggerBase) {
		this.serverDocs = new Map();
        this.docsAST = new Map();
        this.incInfos = new Map();
        this.ioService = new IoService();
		this.builtinFunction = buildBuiltinFunctionNode();
        this.builtinCommand = buildBuiltinCommandNode();
		this.serverConfigDoc = undefined;
        this.currentDocUri = '';
        // TODO: non hardcoded Standard Library
        this.SLibDir = 'C:\\Program Files\\AutoHotkey\\Lib'
        this.ULibDir = homedir() + '\\Documents\\AutoHotkey\\Lib'
        this.logger = logger;
    }
    
    /**
     * Initialize information of a just open document
     * @param uri Uri of initialized document
     * @param docinfo AST of initialized document
     * @param doc TextDocument of initialized documnet
     */
    public initDocument(uri: string, docinfo: IFakeDocumentInfomation, doc: TextDocument) {
        this.currentDocUri = uri;
        this.updateDocumentAST(uri, docinfo, doc);
    }

    /**
     * Select a document for next steps. For provide node infomation of client requests
     * @param uri Uri of document to be selected
     */
	public selectDocument(uri: string) {
		this.currentDocUri = this.serverDocs.has(uri) ? uri : '';
		return this;
    }
    
    /**
     * Update infomation of a given document, will automatic load its includes
     * @param uri Uri of updated document
     * @param docinfo AST of updated document
     * @param doc TextDocument of update documnet
     */
	public async updateDocumentAST(uri: string, docinfo: IFakeDocumentInfomation, doc: TextDocument) {
        // updata documnet
        this.serverDocs.set(uri, doc);
        const oldInclude = this.docsAST.get(uri)?.include
        let useneed, useless: string[];
        // updata AST first, then its includes
        this.docsAST.set(uri, docinfo);
        if (oldInclude) {
            // useless need delete, useneed need to add
            // FIXME: delete useless include
            [useless, useneed] = setDiffSet(oldInclude, docinfo.include);
        }
        else {
            useneed = docinfo.include;
            useless = [];
        }

        // EnumIncludes
        let incQueue: string[] = [...useneed];
        // this code works why?
        // no return async always fails?
        let path = incQueue.shift();
        while (path) {
            const docDir = dirname(URI.parse(this.currentDocUri).fsPath);
            let p = this.include2Path(path, docDir);
            if (!p) continue;
            // if is lib include, use lib dir
            // 我有必要一遍遍读IO来确认库文件存不存在吗？
            const doc = await this.loadDocumnet(p);
            if (doc) {
                let lexer = new Lexer(doc, this.logger);
                this.serverDocs.set(doc.uri, doc);
                let incDocInfo = lexer.Parse();
                this.docsAST.set(doc.uri, incDocInfo);
                // TODO: Correct document include tree
                if (this.incInfos.has(uri))
                    this.incInfos.get(uri)?.set(path, p);
                else
                    this.incInfos.set(uri, new Map([[path, p]]));
                incQueue.push(...Array.from(incDocInfo.include));
            }
            path = incQueue.shift();
        }
            
    }
    
    /**
     * Load and parse a set of documents. Used for process ahk includes
     * @param documnets A set of documents' uri to be loaded and parsed
     */
    private async loadDocumnet(path: string): Promise<TextDocument|undefined>  {
        const uri = URI.file(path);
        try {
            const c = await this.retrieveResource(uri);
            let document = TextDocument.create(uri.toString(), 'ahk', 0, c);
            return document
        }
        catch (err) {
            // TODO: log exception here
            return undefined;
        }
    }

	public deleteUnusedDocument(uri: string) {
        let isUseless: boolean = true;
        const path = URI.parse(uri).fsPath
		this.docsAST.forEach(
			(docinfo) => {
				// no document include, unused
				if (docinfo.include.has(path)) isUseless = false;
			}
		)
		if (isUseless) this.docsAST.delete(uri);
	}

    /**
   * Retrieve a resource from the provided uri
   * @param uri uri to load resources from
   */
    private retrieveResource(uri: URI): Promise<string> {
        const path = uri.fsPath;
        return this.ioService.load(path);
    }

    /**
     * Return a line of text up to the given position
     * @param position position of end mark
     */
	private LineTextToPosition(position: Position): string|undefined {
		if (this.currentDocUri) {
			return this.serverDocs
				.get(this.currentDocUri)
				?.getText(Range.create(
					Position.create(position.line, 0),
					position
				)).trimRight();
		}
    }
    
    /**
     * Return the text of a given line
     * @param line line number
     */
    private getLine(line: number): string|undefined {
        if (this.currentDocUri) {
			return this.serverDocs
				.get(this.currentDocUri)
				?.getText(Range.create(
					Position.create(line, 0),
					Position.create(line+1, 0)
				)).trimRight();
		}
    }

    /**
     * Find all include of a document and its includes' include
     * @param doc Doucment Infomation to find
     */
    private documentAllInclude(doc: IFakeDocumentInfomation): Set<string> {
        let incInfo = new Set(doc.include);
        for (let inc of incInfo) {
            const incUri = URI.file(inc).toString();
            let incDoc = this.docsAST.get(incUri);
            if (incDoc) {
                const deepIncPath = this.documentAllInclude(incDoc);
                incInfo = union(incInfo, deepIncPath);
            }
        }
        return incInfo;
    }

    private include2Path(rawPath: string, scriptPath: string): string|undefined {
        const scriptDir = scriptPath;
        const normalized = normalize(rawPath);
        switch (extname(normalized)) {
            case '.ahk':
                if (dirname(normalized)[0] === '.') // if dir start as ../ or .
                    return normalize(scriptDir + '\\' + normalized);
                else    // absolute path
                    return normalized;
            case '':
                if (rawPath[0] === '<' && rawPath[rawPath.length-1] === '>') {
                    let searchDir: string[] = []
                    const np = normalize(rawPath.slice(1, rawPath.length-1)+'.ahk');
                    const dir = normalize(scriptDir + '\\Lib\\' + np);
                    const ULibDir = normalize(this.ULibDir + '\\' + np);
                    const SLibDir = normalize(this.SLibDir + '\\' + np);
                    searchDir.push(dir, ULibDir, SLibDir);
                    for(const d of searchDir) {
                        if (this.ioService.fileExistsSync(d))
                            return d;
                    }
                }
                // TODO: handle include path change
                break;
            default:
                break;
        }
    }

    /**
     * A simple(vegetable) way to get all include AST of a document
     * @returns SymbolNode[]-ASTs, document uri
     */
    private allIncludeTreeinfomation(): Map<string, SymbolNode[]>|undefined {
        const docinfo = this.docsAST.get(this.currentDocUri);
        if (!docinfo) return undefined;
        const incInfo = this.incInfos.get(this.currentDocUri) || [];
        let r: Map<string, SymbolNode[]> = new Map();
        for (const [raw, path] of incInfo) {
            const uri = URI.file(path).toString();
            const incDocInfo = this.docsAST.get(uri);
            if (incDocInfo) {
                r.set(uri, incDocInfo.tree);
            }
        }    
        return r;
    }
    
    /**
     * Return the AST of current select document
     */
	public getTree(): Array<SymbolNode|FuncNode> {
		// await this.done;
		if (this.currentDocUri)
			return <Array<SymbolNode|FuncNode>>this.docsAST.get(this.currentDocUri)?.tree;
		else
			return [];
    }

    /**
     * Returns a string in the form of the function node's definition
     * @param symbol Function node to be converted
     */
    public getFuncPrototype(symbol: FuncNode|BuiltinFuncNode, cmdFormat: boolean = false): string {
        const paramStartSym = cmdFormat ? ', ' : '(';
        const paramEndSym = cmdFormat ? '' : ')'
        let result = symbol.name + paramStartSym;
        symbol.params.map((param, index, array) => {
            result += param.name;
            if (param.isOptional) result += '[Optional]';
            if (param.defaultVal) result += ' := ' + param.defaultVal;
            if (array.length-1 !== index) result += ', ';
        })
        return result+paramEndSym;
    }

    public convertParamsCompletion(node: SymbolNode): CompletionItem[] {
        if (node.kind === SymbolKind.Function) {
            let params =  (<FuncNode>node).params
            return params.map(param => {
                let pc = CompletionItem.create(param.name);
                pc.kind = CompletionItemKind.Variable;
                pc.detail = '(parameter) '+param.name;
                return pc;
            })
        }
        return [];
    }

    public getGlobalCompletion(): CompletionItem[] {
        let incCompletion: CompletionItem[] = [];
        let docinfo: IFakeDocumentInfomation|undefined;
        if (this.currentDocUri)
            docinfo = this.docsAST.get(this.currentDocUri);
        if (!docinfo) return [];
        // TODO: 应该统一只用this.allIncludeTreeinfomation
        const incInfo = this.incInfos.get(this.currentDocUri) || []
        // 为方便的各种重复存储，还要各种加上累赘代码，真是有点沙雕
        for (let [raw, path] of incInfo) {
            const incUri = URI.file(path).toString();
            const tree = this.docsAST.get(incUri)?.tree;
            if (tree) {
                incCompletion.push(...tree.map(node => {
                    let c = this.convertNodeCompletion(node);
                    c.data += '\nInclude from ' + raw;
                    return c;
                }))
            }
        }
        
        return this.getTree().map(node => this.convertNodeCompletion(node))
        .concat(this.builtinFunction.map(node => {
            let ci = CompletionItem.create(node.name);
            ci.data = this.getFuncPrototype(node);
            ci.kind = CompletionItemKind.Function;
            return ci;
        }))
        .concat(this.builtinCommand.map(node => {
            let ci = CompletionItem.create(node.name);
            ci.data = this.getFuncPrototype(node, true);
            ci.kind = CompletionItemKind.Function;
            return ci;
        }))
        .concat(incCompletion);
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

    public includeDirCompletion(position: Position): CompletionItem[]|undefined {
        const context = this.LineTextToPosition(position);
        const reg = /^\s*#include/i;
        if (!context) return undefined;
        let match = context.match(reg);
        if (!match) return undefined;
        // get dir text
        const p = context.slice(match[0].length).trim();
        const docDir = dirname(URI.parse(this.currentDocUri).fsPath);
        let searchDir: string[] = []
        // if is lib include, use lib dir
        if (p[0] === '<') {
            const np = normalize(p.slice(1));
            const dir = normalize(docDir + '\\Lib\\' + np);
            const ULibDir = normalize(this.ULibDir + '\\' + np);
            const SLibDir = normalize(this.SLibDir + '\\' + np);
            searchDir.push(dir, ULibDir, SLibDir);
        } 
        else {
            const dir = normalize(docDir + '\\' + normalize(p));
            searchDir.push(dir);
        }
        let completions: IoEntity[] = []
        for (const dir of searchDir) {
            completions.push(...this.ioService.statDirectory(dir));
            // If is not '#include <', because of library search order 
            // we must not search all directory. Once we found an exist directory, 
            // we return it
            if (completions.length > 0 && p !== '<') break;
        }
        return completions.map((completion):CompletionItem => {
            let c = CompletionItem.create(completion.path);
            c.kind = completion.kind === IoKind.folder ? 
                     CompletionItemKind.Folder :
                     CompletionItemKind.File;
            return c;
        }
        );
    }

    /**
     * All words at a given position(top scope at last)
     * @param position 
     */
    private getLexemsAtPosition(position: Position): string[]|undefined {
        const context = this.getLine(position.line);
        if (!context) return undefined;
        let suffix = this.getWordAtPosition(position);
        let perfixs: string[] = [];
        let temppos = (suffix.name === '') ? suffix.range.start.character : suffix.range.start.character-1;
        // let w = this.document.getText(suffix.range);

        // Push perfixs into perfixs stack
        while (this.getChar(context, temppos) === '.') {
            // FIXME: correct get word here 
            let word = this.getWordAtPosition(Position.create(position.line, temppos-1));
            perfixs.push(word.name);
            temppos = word.range.start.character-1;
        }
        return [suffix.name].concat(perfixs);
    }

    /**
     * Get all nodes of a particular token.
     * return all possible nodes or empty list
     * @param position 
     */
    public getSuffixNodes(position: Position): NodeInfomation|undefined {
        let lexems = this.getLexemsAtPosition(position);
        if (!lexems) return undefined;
        
        return this.searchSuffix(lexems.slice(1), position);
    }

    /**
     * Get suffixs list of a given perfixs list
     * @param perfixs perfix list for search(top scope at last)
     */
    private searchSuffix(perfixs: string[], position: Position): NodeInfomation|undefined {
        const find = this.searchNode(perfixs, position);
        if (!find) return undefined;
        const node = find.nodes[0];
        if (!node.subnode) return undefined;
        return {
            nodes: node.subnode,
            uri: find.uri
        };
    }

    /**
     * Get node of position and lexems
     * @param lexems all words strings(这次call，全部的分割词)
     * @param position position of qurey word(这个call的位置)
     */
    private searchNode(lexems: string[], position: Position, deref: boolean = true): NodeInfomation|undefined {
        let lexem: string|undefined;
        // first search tree of current document
        let currTreeUri: string = this.currentDocUri;
        let nodeList: SymbolNode[]|undefined = this.getTree();
        let resultNode: SymbolNode|undefined = undefined;
        let incTreeMap = this.allIncludeTreeinfomation();
		const refTable = this.getReference();
        
        // 这写的都是什么破玩意，没有天分就不要写，还学别人写LS --武状元
        // find if perfix is a reference of a class
        // for now, reference infomation only record one layer reference
        // only check once
        lexem = lexems[lexems.length-1];
        if (lexem && deref) {
            for (const [refClassName, table] of refTable.entries()) {
                let find = arrayFilter(table, refinfo => refinfo.name === lexem);
                if (find) {
                    // No need to check reference
                    lexem = refClassName;
                    lexems[lexems.length-1] = refClassName;
                    break;
                }
            }
        }
        if (lexem === 'this') {
            let classNode = this.searchNodeAtPosition(position, this.getTree(), SymbolKind.Class);
            if (classNode) {
                resultNode = classNode;
                // set next search tree to class node we found
                nodeList = classNode.subnode;
                lexems.pop()
            } 
            else {
                return undefined;
            }
        }
        // Since we now only support one layer reference,
        // thereby, only top scope symbol are located in 
        // different document
        if (incTreeMap) {
            for (const [uri, tree] of incTreeMap.entries()) {
                let find = arrayFilter(tree, item => item.name === lexem);
                if (find) {
                    currTreeUri = uri;
                    // set next search tree to found node's subnode tree
                    nodeList = find.subnode;
                    resultNode = find;
                    lexems.pop();
                    break;
                }
            }
        }

        while (lexem = lexems.pop()) {
            resultNode = undefined;
            let find: SymbolNode|undefined;
            if (nodeList)
                find = arrayFilter(nodeList, (item) => item.name === lexem);
            resultNode = find !== undefined ? find : undefined;       
            // TODO: Check reference here
            if (find && find.subnode) {
                nodeList = find.subnode;
            }
            else if (!resultNode) return undefined;
        }

        if (resultNode) {
            return {
                nodes: [resultNode],
                uri: currTreeUri
            };
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
    public searchNodeAtPosition(pos: Position, tree: Array<SymbolNode|FuncNode>, kind?:SymbolKind): SymbolNode|FuncNode|undefined {
        for (const node of tree) {
            if (pos.line > node.range.start.line && pos.line < node.range.end.line) {
                if (node.subnode) {
                    if (kind && !(node.kind === kind)) {
                       continue;
                    }
                    let subScopedNode = this.searchNodeAtPosition(pos, node.subnode, kind);
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
        } else if (info.kind === SymbolKind.Variable) {
            ci.kind = CompletionItemKind.Variable;
        } else if (info.kind === SymbolKind.Class) {
            ci['kind'] = CompletionItemKind.Class;
            ci.data = ''
        } else if (info.kind === SymbolKind.Event) {
            ci['kind'] = CompletionItemKind.Event;
        } else if (info.kind === SymbolKind.Null) {
            ci['kind'] = CompletionItemKind.Text;
		} 
        return ci;
    }

    public getFuncAtPosition(position: Position): {func: FuncNode|BuiltinFuncNode, index: number, isCmd: boolean}|undefined {
		const context = this.LineTextToPosition(position);
		if (!context) return undefined;
        
        let stmtStack = new SemanticStack(context);
        let stmt: INodeResult<IFunctionCall| IMethodCall | IPropertCall | IAssign | ICommandCall>|undefined;
        try {
            stmt = stmtStack.statement();
        }
        catch (err) {
            return undefined;
        }
        if (!stmt) {
            return undefined;
        }
        let perfixs: string[] = [];
        
        let node: INodeResult<IASTNode> = stmt;
        if (isExpr(stmt.value)) {
            node = stmt.value.right;
            while(isExpr(node.value)) {
                node = node.value.right;
            }
        }
        
        stmt = node as INodeResult<IFunctionCall | IMethodCall | IPropertCall | IAssign | ICommandCall>;
        
        if (stmt.value instanceof FunctionCall ) {
            // CommandCall always no errors
            if (!stmt.errors && !(stmt.value instanceof CommandCall)) {
                return undefined;
            }
            let lastnode = this.getUnfinishedFunc(stmt.value);
            if (!lastnode) {
                lastnode = stmt.value;
            } 
            if (lastnode instanceof MethodCall) {
                perfixs = lastnode.ref.map(r => {
                    return r.content;
                });
            }

            const funcName = lastnode.name;
            let index = lastnode.actualParams.length===0 ?
                        lastnode.actualParams.length:
                        lastnode.actualParams.length-1;
            if (lastnode instanceof CommandCall) {
                // All Commands are built-in, just search built-in Commands
                const bfind = arrayFilter(this.builtinCommand, item => item.name === funcName);
                if (!bfind) return undefined;
                return {
                    func: bfind,
                    index: index,
                    isCmd: true
                }
            }
            let find = this.searchNode([funcName].concat(...perfixs.reverse()), position);
            // if no find, search build-in
            if (!find) {
                const bfind = arrayFilter(this.builtinFunction, item => item.name === funcName);
                if (!bfind) return undefined;
                return {
                    func: bfind,
                    index: index,
                    isCmd: false
                }
            }
            return {
                func: <FuncNode>find.nodes[0],
                index: index,
                isCmd: false
            };
        }
    }

    /**
     * Find the deepest unfinished Function of a AST node
     * @param node Node to be found
     */
    private getUnfinishedFunc(node: IFunctionCall): IFunctionCall|undefined {
        let perfixs: string[]|undefined;
        // let lastParam: any
        let lastParam = node.actualParams[node.actualParams.length-1] as INodeResult<IASTNode>;
        if (!lastParam.errors) {
            return undefined;
        }
        if (lastParam.value instanceof FunctionCall) {
            let lastnode = this.getUnfinishedFunc(lastParam.value);
            if (lastnode) {
                if (node instanceof FunctionCall) {
                    return lastnode
                }
            }
            return lastParam.value;
        }
        return node;
    }

    public getDefinitionAtPosition(position: Position): Location[] {
        let lexems = this.getLexemsAtPosition(position);
        if (!lexems) return [];
        // 1 length lexems means a variable, we shouldn't search reference table.
        let find = this.searchNode(lexems, position, !(lexems.length === 1));
        if (!find) return [];
        let locations: Location[] = [];
        for (const node of find.nodes) {
            locations.push(Location.create(find.uri, node.range));
        }
        return locations;
        // let word = this.getWordAtPosition(position);
        // let tree = this.getSuffixNodes(position);
        // let incTree = this.allIncludeTreeinfomation();
        // if (!tree) {
        //     // FIXME: need search include AST
        //     tree = {
        //         nodes: this.getTree(),
        //         uri: this.currentDocUri
        //     }
        // }
        // let locations: Location[] = [];
        // // FIXME: temporary soluation, invaild -1 line marked builtin property
        // let find = arrayFilter(tree.nodes, node => node.name === word.name && node.range.start.line !== -1);
        // if (find) locations.push(Location.create(tree.uri, find.range));
        // if (incTree) {
        //     for (const [uri, nodes] of incTree) {
        //         find = arrayFilter(nodes, node => node.name === word.name && node.range.start.line !== -1);
        //         if (find){
        //             locations.push(Location.create(uri, find.range));
        //             break;
        //         } 

        //     }
        // }

    }

    private getWordAtPosition(position: Position): Word {
        let reg = /[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?]+/;
		const context = this.getLine(position.line);
		if (!context)
			return Word.create('', Range.create(position, position));
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
	
	private getReference(): ReferenceMap {
		if (this.currentDocUri){
			const ref = this.docsAST.get(this.currentDocUri)?.refTable
			if (ref) return ref;
		}
		return new Map();
	}
}

/**
 * Get eligible items in the array(找到数组中符合callback条件的项)
 * @param list array to be filted
 * @param callback condition of filter
 */
function arrayFilter<T>(list: Array<T>, callback: (item: T) => boolean): T|undefined {
    for (const item of list) {
        if (callback(item)) 
            return item;
    }
    return undefined;
}