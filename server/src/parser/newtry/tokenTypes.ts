export enum TokenType {

    // operators
    pplus,
    mminus,
    
    power,       // **
    
    not,         // !
    bnot,        // ~
    
    multi,
    div,         // /
    fdiv,        // //
    
    plus,
    minus,
    
    rshift,     // >>
    lshift,     // <<
    
    and,         // &
    xor,         // ^
    or,          // |
    
    sconnect,    // string connect
    
    regeq,       // ~=
    
    greater,
    greaterEqual,
    less,
    lessEqual,
    
    equal,       // =
    dequal,      // ==
    glnequal,    // <>
    notEqual,    // !=
    
    keynot,      // not

    logicand,    // &&
    keyand,

    keyor, 
    logicor,     // ||

    question,

    aassign,     // :=
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

    dot,         // .
    comma,       // ,

    // literal
    number, string,
    true, false,
    
    id,
    
    // paren
    openBrace,   // {
    openBracket, // [
    openParen,   // (
    precent,     // %
    closeBrace,  // }
    closeBracket,// ]
    closeParen,  // )

    // comment
    lineComment,       // ;
    openMultiComment,  // /*
    closeMultiComment, // */
    
    // marks
    sharp,       // #

    /**
     * mark: :
     */
    colon,       // :
    hotkey,      // ::

    // keyword
    if, else, switch, case, loop, 
    while, until, break, continue,
    try, catch, finally, 
    gosub, goto, return, global, 
    local, throw, class, 
    extends, new, static,
    

    command,
    drective,
    implconn,
    
    // file
    EOL, EOF,

    // error
    unknown
}