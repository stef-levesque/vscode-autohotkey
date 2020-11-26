import {
	CompletionItem,
	CompletionItemKind,
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
    IFakeDocumentInfomation
} from '../utilities/types';
import {
	INodeResult, 
	IFunctionCall, 
	IMethodCall, 
	IPropertCall, 
	IAssign, 
	IASTNode, 
	FunctionCall,
	MethodCall
} from '../asttypes';
import { SemanticStack, isExpr } from '../semantic_stack';
import { BuiltinFuncNode } from '../utilities/constants';
import { Lexer } from '../ahkparser';
import { IoService } from './ioServices';

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

    private ioService: IoService;
    
    /**
     * built-in standard function AST
     */
	private readonly builtinFunction: BuiltinFuncNode[];

	private currentDocUri?: string;

	constructor(builtinFuction: BuiltinFuncNode[]) {
		this.serverDocs = new Map();
        this.docsAST = new Map();
        this.ioService = new IoService();
		this.builtinFunction = builtinFuction;
		this.serverConfigDoc = undefined;
		this.currentDocUri = undefined;
	}

    /**
     * Select a document for next steps. For provide node infomation of client requests
     * @param uri Uri of document to be selected
     */
	public selectDocument(uri: string) {
		this.currentDocUri = this.serverDocs.has(uri) ? uri : undefined;
		return this;
	}
    /**
     * Update infomation of a given document, will automatic load its includes
     * @param uri Uri of updated document
     * @param docinfo AST of updated document
     * @param doc TextDocument of  update documnet
     */
	public async updateDocumentAST(uri: string, docinfo: IFakeDocumentInfomation, doc: TextDocument) {
        // updata documnet
        this.serverDocs.set(uri, doc);
        const oldInclude = this.docsAST.get(uri)?.include
        // updata AST first, then its includes
        this.docsAST.set(uri, docinfo);
        if (oldInclude) {
            // useless need delete, useneed need to add
            // FIXME: delete useless include
            const [useless, useneed] = setDiffSet(oldInclude, docinfo.include);
            for (const path of useneed) {
                const doc = await this.loadDocumnet(path);
                if (doc) {
                    let lexer = new Lexer(doc);
                    this.serverDocs.set(doc.uri, doc);
                    this.docsAST.set(doc.uri, lexer.Parse());
                }
            }
        }
        else {
            for (const path of docinfo.include) {
                const doc = await this.loadDocumnet(path);
                if (doc) {
                    let lexer = new Lexer(doc);
                    this.serverDocs.set(doc.uri, doc);
                    this.docsAST.set(doc.uri, lexer.Parse());
                }
            }
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
		this.docsAST.forEach(
			(docinfo) => {
				// no document include, unused
				if (docinfo.include.has(uri)) isUseless = false;
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
    public getFuncPrototype(symbol: FuncNode|BuiltinFuncNode): string {
        let result = symbol.name + '(';
        symbol.params.map((param, index, array) => {
            result += param.name;
            if (param.isOptional) result += '[Optional]';
            if (param.defaultVal) result += ' := ' + param.defaultVal;
            if (array.length-1 !== index) result += ', ';
        })
        return result+')';
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
        let inc_tree: SymbolNode[] = [];
        let docinfo: IFakeDocumentInfomation|undefined;
        if (this.currentDocUri)
            docinfo = this.docsAST.get(this.currentDocUri);
        if (!docinfo) return [];
        docinfo.include.forEach(inc => {
            const inc_uri = URI.file(inc);
            const tree = this.docsAST.get(inc_uri.toString())?.tree;
            if (tree)
                inc_tree.push(...tree);
        })
        return this.getTree().map(node => this.convertNodeCompletion(node))
        .concat(this.builtinFunction.map(node => {
            let ci = CompletionItem.create(node.name);
            ci.data = this.getFuncPrototype(node);
            ci.kind = CompletionItemKind.Function;
            return ci;
        }))
        .concat(inc_tree.map(node => this.convertNodeCompletion(node)));
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
		const context = this.LineTextToPosition(position);
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
        
        return this.searchSuffix(perfixs, position);
    }

    /**
     * Get suffixs list of a given perfixs list
     * @param perfixs perfix list for search(top scope at last)
     */
    searchSuffix(perfixs: string[], position: Position): (SymbolNode|FuncNode)[]|undefined {
        let isFound = false;
        let perfix: string|undefined;
		let nodeList: SymbolNode[] = this.getTree();
		const refTable = this.getReference();

        // find if perfix is a reference of a class
        // for now, reference infomation only record one layer reference
        // only check once
        perfix = perfixs[perfixs.length-1];
        if (perfix) {
            for (const [refClassName, table] of refTable.entries()) {
                table.forEach(refinfo => {
                    if (refinfo.name === perfix) {
                        perfixs.pop();
                        for(const node of nodeList) {
                            // ahk is case insensitive
                            if (node.name.toLowerCase() === refClassName.toLowerCase() && node.subnode) {
                                nodeList = node.subnode;
                                isFound = true;
                                break;
                            }
                        }
                    }
                });
            }
        }

        while (perfix = perfixs.pop()) {
            isFound = false;
            if (perfix === 'this') {
                let classNode = this.searchNodeAtPosition(position, this.getTree(), SymbolKind.Class);
                if (classNode && classNode.subnode) {
                    nodeList = classNode.subnode;
                    isFound = true;
                    continue;
                } 
                else {
                    return undefined;
                }
            }
            for(const node of nodeList) {
                if (node.name === perfix) {
                    // TODO: support search multilayers
                    if (node.subnode)
                    {
                        nodeList = node.subnode;
                        isFound = true;
                    }
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

    public getFuncAtPosition(position: Position): {func: FuncNode|BuiltinFuncNode, index: number}|undefined {
		const context = this.LineTextToPosition(position);
		if (!context) return undefined;
        
        let stmtStack = new SemanticStack(context);
        let stmt: INodeResult<IFunctionCall| IMethodCall | IPropertCall | IAssign>|undefined;
        try {
            stmt = stmtStack.statement();
        }
        catch (err) {
            return undefined;
        }
        if (!stmt) {
            return undefined;
        }
        let perfixs: string[]|undefined;
        
        let node: INodeResult<IASTNode> = stmt;
        if (isExpr(stmt.value)) {
            node = stmt.value.right;
            while(isExpr(node.value)) {
                node = node.value.right;
            }
        }
        
        stmt = node as INodeResult<IFunctionCall | IMethodCall | IPropertCall | IAssign>;
        
        if (stmt.value instanceof FunctionCall) {
            if (!stmt.errors) {
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
            const tree = perfixs ? this.searchSuffix(perfixs.reverse(), position) : this.getTree();
            let func:FuncNode;
            // first, search in the document syntax tree
            if (tree) {
                for (let i=0,len=tree.length; i<len; i++) {
                    if (tree[i].name === funcName) {
                        if (tree[i].kind === SymbolKind.Function) {
                            func = <FuncNode>tree[i];
                        }
                        else {
                            return undefined;
                        }
                        if (func.range.start.line === position.line) {
                            return undefined;
                        }
                        let index = lastnode.actualParams.length===0 ?
                                    lastnode.actualParams.length:
                                    lastnode.actualParams.length-1;
                        return {
                            func: func,
                            index: index
                        };
                    }
                }
                // then find if symbol is in built-in function tree
                for (const node of this.builtinFunction) {
                    if (node.name === funcName) {
                        let index = lastnode.actualParams.length===0 ?
                                    lastnode.actualParams.length:
                                    lastnode.actualParams.length-1;
                        return {
                            func: node,
                            index: index
                        }
                    }
                }
                return undefined;
            }
            // finally search if is built-in method
            // TODO: finish signature about built-in method
        }
        return undefined;
    }

    getUnfinishedFunc(node: IFunctionCall): IFunctionCall|undefined {
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
        }
        return node;
    }

    getDefinitionAtPosition(position: Position): SymbolNode[] {
        let word = this.getWordAtPosition(position);
        let tree = this.getSuffixNodes(position);
        if (!tree) {
            tree = this.getTree()
        }
        let nodeList:SymbolNode[] = [];
        for (let i=0; i < tree.length; i++) {
            if (tree[i].name === word.name &&
                 // FIXME: temporary soluation, invaild -1 line marked builtin property
                tree[i].range.start.line !== -1) {
                nodeList.push(tree[i]);
            }
        }
        return nodeList;
    }

    private getWordAtPosition(position: Position): Word {
        let reg = /[a-zA-Z0-9\u4e00-\u9fa5#_@\$\?\[\]]+/;
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
