import { SymbolKind } from 'vscode-languageserver-types';
import { 
    ClassNode, 
    FuncNode, 
    IClassNode, 
    IFindResult, 
    IFuncNode, 
    ISymbolNode, 
    IVariableNode, 
    NodeInfomation, 
    VariableNode 
} from './types';

export class ScriptFinder {
    /**
     * list of condition that node need to match
     */
    private cond: NodeMatcher[];

    /**
     * index of condition to be matched
     */
    private pos: number = 0;

    /**
     * all the tree and its uri to be search
     */
    private Trees: NodeInfomation[];

    /**
     * uri of the file own the node
     */
    private uri: string;

    private issuffix = false;

    constructor(cond: NodeMatcher[], syntaxNode: ISymbolNode[], uri: string, includeTree: NodeInfomation[]) {
        // Create a tree contains file AST and AST of file include
        // file AST in the first index => file AST is top level
        let Trees:NodeInfomation[] = [{
            nodes: syntaxNode,
            uri: uri
        }].concat(includeTree);

        this.Trees = Trees;
        this.uri = uri;
        this.cond = cond;
    }

    /**
     * return if we need to search on deep node 
     */
    private needDeep(): boolean {
        // This function will not be called more than once when it is not needed
        // and we need pos to be over length when search suffix on a variable
        // just add one
        this.pos++;
        if (this.pos >= this.cond.length) 
            return false;
        else 
            return true;
    }

    private searchDeep(nodes: ISymbolNode[]): Maybe<ISymbolNode> {
        for (const node of nodes) {
            let n = this.visit(node);
            if (n) return n;
        }
        return undefined;
    }

    private visit(node: ISymbolNode): Maybe<ISymbolNode> {
        if (node instanceof FuncNode)
            return this.visitFunc(node);
        if (node instanceof ClassNode) 
            return this.visitClass(node);
        if (node instanceof VariableNode)
            return this.visitVar(node);
        return undefined;
    }

    private visitFunc(node: IFuncNode): Maybe<ISymbolNode> {
        if (this.cond[this.pos].match(node)) {
            if (this.needDeep()) {
                if (node.subnode)
                    return this.searchDeep(node.subnode);
                return undefined;
            }
            return node;
        }
        return undefined;
    }

    private visitClass(node: IClassNode): Maybe<ISymbolNode> {
        if (this.cond[this.pos].match(node)) {
            if (this.needDeep()) {
                if (node.subnode)
                    return this.searchDeep(node.subnode);
                return undefined;
            }
            return node;
        }
        return undefined;
    }

    private visitVar(node: IVariableNode): Maybe<ISymbolNode> {
        if (this.cond[this.pos].match(node)) {
            // issuffix is true means we need suffix infomation
            // so we also convert variable node to its reference 
            if (this.needDeep() || this.issuffix) {
                // if node has refere a class we search that class
                // since class should be global, 
                // just search the whole tree by this.find()
                if (node.refname)
                {
                    // add condition to the next search pos
                    // next search will begin at that position
                    this.cond = this.cond.slice(this.pos);
                    this.cond.unshift(new NodeMatcher(node.refname, SymbolKind.Class));
                    this.pos = 0;
                    let temp = this.find();
                    if (!temp)
                        return undefined;
                    this.uri = temp.uri;
                    return temp.node;
                }
                // 这里请求一个有后缀的节点，检查是否有子节点代表后缀，
                // 这个是在之后的函数检查，如果返回undefined就会将搜索链条打断
                return this.issuffix ? node : undefined;
            }
            return node;
        }
        return undefined;
    }

    public find(issuffix: boolean = false): Maybe<IFindResult> {
        this.issuffix = issuffix;
        for (const tree of this.Trees) {
            this.uri = tree.uri;
            for (const node of tree.nodes) {
                let n = this.visit(node);
                if (n)
                    return {
                        node: n,
                        uri: this.uri
                    };
            }
        }

        return undefined;
    }
}

/**
 * condition a node need to be matched
 */
export class NodeMatcher
{
    private readonly name: string;
    private readonly kind?: SymbolKind;

    constructor(name: string, kind?: SymbolKind) {
        this.name = name;
        this.kind = kind;
    }

    /**
     * check if node matches the conditions
     * @param node node to match
     */
    match(node: ISymbolNode): boolean {
        return this.kind ? 
        (node.name.toLowerCase() === this.name.toLowerCase() && node.kind === this.kind) :
        (node.name.toLowerCase() === this.name.toLowerCase());
    }
}
