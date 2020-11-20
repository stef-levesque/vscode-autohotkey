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
    type:TokenType;
    content:string; 
    offset:number;
}

export function createToken(id:TokenType, content:string, offset:number): Token {
    return {type: id, content, offset}
}
export type ITokenMap = Map<string, TokenType>;