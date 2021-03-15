import { SymbolKind, Range, Location } from 'vscode-languageserver';

export enum TokenType{
    // literal
    number, string,
    true, false,
    
    id,
    
    // equals
    aassign,     // :=
    equal,       // =
    // triple
    /**
     * mark: ?
     */
    question,
    // binary
    plus,
    minus,
    multi,
    div,
    power,
    not,
    and,
    or,
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

    // keyword
    if, else, switch, case, do, loop, 
    while, until, break, continue, 
    gosub, goto, return, global, 
    local, throw, include, class, 
    extends, new,

    command,
    
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

export interface SymbolNode {
    name: string
    kind: SymbolKind
    range: Range
    subnode?: SymbolNode[]
}

export interface FuncNode extends SymbolNode {
    params: Parameter[]
}

export interface ClassNode extends SymbolNode {
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
export interface NodeInfomation {
    nodes: SymbolNode[]
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
export interface IFakeDocumentInfomation {
    /**
     * AST of document
     */
    tree: SymbolNode[]
    /**
     * All reference information can get from document
     */
    refTable: ReferenceMap
    /**
     * Path document include file
     */
	include: Set<string>
}

/**
 * Base logger interface, mirror vscodes logger
 * ref: vscode-kos-language-server
 */
 export interface ILoggerBase {
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    log(message: string): void;
  }
  