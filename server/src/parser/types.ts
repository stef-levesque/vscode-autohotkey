import { SymbolKind, Range, Location } from 'vscode-languageserver';

export enum TokenType{
    // literal
    number, string,
    true, false,
    
    id,
    
    // equals
    aassign,     // :=
    equal,       // =
    pluseq,      // +=
    minuseq,     // -=
    multieq,     // *=
    diveq,       // /=
    idiveq,      // //=
    sconneq,     // .=
    oreq,        // |=
    andeq,       // &=
    xoreq,       // ^=
    rshifteq,    // >>=
    lshifteq,    // <<=
    regeq,       // ~=
    // triple
    /**
     * mark: ?
     */
    question,
    // binary
    sconnect,    // string connect
    plus,
    minus,
    multi,
    div,         // /
    idiv,        // //
    power,
    and,         // &
    or,          // |
    xor,         // ^
    not,
    logicand,    // &&
    logicor,     // ||
    notEqual,
    greaterEqual,
    greater,
    lessEqual,
    less,
    
    // paren
    openBrace,   // {
    closeBrace,  // }
    openBracket, // [
    closeBracket,// ]
    openParen,   // (
    closeParen,  // )

    // comment
    lineComment,       // ;
    openMultiComment,  // /*
    closeMultiComment, // */
    
    // marks
    sharp,       // #
    dot,         // .
    /**
     * mark: ,
     */
    comma,       // ,
    /**
     * mark: :
     */
    colon,       // :
    hotkey,      // ::

    // keyword
    if, else, switch, case, do, loop, 
    while, until, break, continue, 
    gosub, goto, return, global, 
    local, throw, class, 
    extends, new,
    keyand, keyor, keynot,

    command,
    drective,
    
    // file
    EOL, EOF,

    // error
    unknown
}

export interface Token {
    type:TokenType
    content:string 
    start:number
    end:number  
};

export function createToken(type:TokenType, content:string, start:number, end: number): Token {
    return {type: type, content, start, end};
}
export type ITokenMap = Map<string, TokenType>;

export interface ISymbolNode {
    name: string
    kind: SymbolKind
    range: Range
    subnode?: ISymbolNode[]
}

export interface IVariableNode extends ISymbolNode {
    refname?: string
}

export interface IFuncNode extends ISymbolNode {
    params: Parameter[]
}

export interface IClassNode extends ISymbolNode {
    extends: string[] 
}

export interface Parameter {
    /**
     * Name of a parameter
     */
    name: string
    /**
     * This parameter is optional or not
     */
    isOptional?: boolean
    /**
     * default value of a parameter
     */
    defaultVal?: string
}

export interface ReferenceInfomation {
    /**
     * name of reference symbol
     */
    name: string
    /**
     * line of reference symbol been refered
     */
    line: number
}

/**
 * Represent a word that likes TokenType.id
 * Temporary solution for this regex based parser
 * to get token of a given position
 */
export interface Word {
    /**
     * Content of a word
     */
    name: string
    range: Range
}

/**
 * Simple solution for representing script's symbol connections 
 */
export type ReferenceMap = Map<string, ReferenceInfomation[]>;

export class SymbolNode implements ISymbolNode {
    public readonly name: string;
    public readonly kind: SymbolKind;
    public readonly range: Range;
    public subnode?: ISymbolNode[];
    constructor(name: string, kind: SymbolKind, range: Range, subnode?: ISymbolNode[]) {
        this.name  = name;
        this.kind  = kind;
        this.range =  range;

        if (subnode) {
            this.subnode = subnode;
        }
    }
}

export class VariableNode extends SymbolNode implements IVariableNode {
    public readonly refname?: string;
    constructor(name: string, kind: SymbolKind, range: Range, refname?: string, subnode?: ISymbolNode[]) {
        super(name, kind, range, subnode);
        this.refname = refname;
    }
}

export class FuncNode extends SymbolNode implements IFuncNode {
    public readonly params: Parameter[];
    constructor(name: string, kind: SymbolKind, range: Range, params: Parameter[], subnode?: ISymbolNode[]) {
        super(name, kind, range, subnode);
        this.params = params
    }
}

export class ClassNode extends SymbolNode implements IClassNode {
    public readonly extends: string[];
    constructor(name: string, kind: SymbolKind, range: Range, subnode?: ISymbolNode[], extendsName: string[] = ['prototype']) {
        super(name, kind, range, subnode);
        this.extends = extendsName
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

export namespace Parameter {
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
// 这个interface写的莫名其妙的
// 当初我为什么要做成node列表的？
/**
 * Infomation of a file AST
 * Contains its uri and AST
 */
export interface NodeInfomation {
    /**
     * AST
     */
    nodes: ISymbolNode[]
    /**
     * file uri
     */
    uri: string
}

export interface IFindResult {
    node: ISymbolNode
    uri: string
}

// export interface CommentNode {
//     text: string
//     range: Range
// }

/**
 * A simple document infomation interface,
 * for temporary usage
 */
export interface IDocumentInfomation {
    /**
     * AST of document
     */
    tree: ISymbolNode[]
    /**
     * All reference information can get from document
     */
    refTable: ReferenceMap
    /**
     * Path document include file
     */
	include: Set<string>
}
  