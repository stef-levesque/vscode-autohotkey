export enum TokenType {

    // operators
    pplus,
    mminus,

    power,

    not,
    bnot,

    multi,
    div,
    fdiv,

    plus,
    minus,

    rshift,
    lshift,

    and,
    xor,
    or,

    sconnect,

    regeq,

    greater,
    greaterEqual,
    less,
    lessEqual,

    equal,
    dequal,
    glnequal,
    notEqual,

    keynot,

    logicand,
    keyand,

    keyor,
    logicor,

    question,

    aassign,
    pluseq,
    minuseq,
    multieq,
    diveq,
    idiveq,
    sconneq,
    oreq,
    andeq,
    xoreq,
    rshifteq,
    lshifteq,

    dot,
    comma,


    // literal
    string, number,
    true, false,

    id,

    // paren
    openBracket,
    openParen,
    precent,
    openBrace,
    closeBrace,
    closeBracket,
    closeParen,

    // marks
    sharp,
    dollar,
    key,

    /**
     * mark: ':'
     */
    colon,
    hotkey,
    hotkeyand,
    /**
     * ':热字串的修饰符:'
     */
    hotstringOpen,
    /**
     * '热字串::'
     */
    hotstringEnd,

    // comment
    lineComment,
    blockComment,


    // keyword
    if, else, switch, case, loop,
    for, in,
    while, until, break, continue,
    try, catch, finally,
    gosub, goto, return, global,
    local, throw, class,
    extends, new, static,


    command,
    drective,
    label,
    implconn,

    // file
    EOL, EOF,

    // error
    unknown,
}