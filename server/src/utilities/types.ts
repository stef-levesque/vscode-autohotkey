import { SymbolKind, Range } from 'vscode-languageserver';

export enum TokenType{
    // literal
    number, string,
    true, false,
    
    id,
    
    // equals
    aassign,     // :=
    equal,       // =
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
    comma,       // ,

    // keyword
    if, else, switch, case, do, loop, 
    while, until, break, continue, 
    gosub, goto, return, global, 
    local, throw, include, class, 
    extends, new,
    
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

export interface Word {
    name: string
    range: Range
}

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

// export interface CommentNode {
//     text: string
//     range: Range
// }

export interface IFakeDocumentInfomation {
	tree: SymbolNode[]
	refTable: ReferenceMap
	include: Set<string>
}
