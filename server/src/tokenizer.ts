export enum TokenType{
    number, string, id,
    aassign,    // :=
    equal,    // =
    openBrace,   // {
    closeBrace,  // }
    openBracket, // [
    closeBracket,// ]
    openParen,   // (
    closeParen,  // )
    lineComment, // ;
    openMultiComment, // /*
    closeMultiComment, // */
    sharp,       // #
    dot,         // .
    comma,       // ,
    ifkeyword, elsekeyword, switchkeyword, casekeyword, dokeyword, loopkeyword, 
    whilekeyword, untilkeyword, breakkeyword, continuekeyword, 
    gosubkeyword, gotokeyword, returnkeyword, 
    globalkeyword, localkeyword, throwkeyword, includekeyword,
    classkeyword, extendskeyword,
    EOL, EOF,
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
let RESERVED_KEYWORDS: {[key: string]: TokenType} = {"class": TokenType.classkeyword, "extends": TokenType.extendskeyword, 
                        "if": TokenType.ifkeyword, "else": TokenType.elsekeyword, "while": TokenType.whilekeyword, 
                        "do": TokenType.dokeyword, "loop": TokenType.loopkeyword, "until":TokenType.untilkeyword, 
                        "switch": TokenType.switchkeyword, "case": TokenType.casekeyword, "break": TokenType.breakkeyword,
                        "goto": TokenType.gotokeyword, "gosub": TokenType.gosubkeyword, "return": TokenType.returnkeyword,
                        "global": TokenType.globalkeyword, "local": TokenType.loopkeyword, "throw": TokenType.throwkeyword,
                        "include": TokenType.includekeyword, "continue": TokenType.continuekeyword};
let OTHER_MARK: {[key: string]: TokenType}= {"{": TokenType.openBrace, "}": TokenType.closeBrace,
                "[":TokenType.openBracket, "]":TokenType.closeBracket,
                "(": TokenType.openParen, ")": TokenType.closeParen,
                "/*": TokenType.openMultiComment, "*/": TokenType.closeMultiComment,
                ";": TokenType.lineComment, "=": TokenType.equal, ":=": TokenType.aassign,
                "#": TokenType.sharp,",":TokenType.comma, ".": TokenType.dot};

export class Tokenizer {
    private pos: number = 0;
    private document: string;
    currChar: string;

    constructor(document: string) {
        this.document = document;
        this.currChar = document[this.pos];
    }

    Advance() {
        this.pos++;
        if(this.pos >= this.document.length) {
            this.currChar = "EOF";
        } else {
            this.currChar = this.document[this.pos];
        }
        return this;
    }

    Peek(): string {
        if(this.pos >= this.document.length) {
            return "EOF";
        }
        return this.document[this.pos];
    }

    GetNumber(): Token {
        let sNum:string = "";
        let offset = this.pos;
        let hasdot = false;
        while(this.currChar.search(/[0-9.]/) >= 0) {
            if(this.currChar === ".") {
                if(!hasdot) {
                    hasdot = true;
                } else {
                    break;
                }
            }
            sNum += this.currChar;
            this.Advance();
        }
        return createToken(TokenType.number, sNum, offset);
    }

    GetString(): Token {
        let str:string = "";
        let offset = this.pos;
        this.Advance();
        while(this.currChar !== "\"") {
            str += this.currChar;
            this.Advance()
        }
        this.Advance()
        return createToken(TokenType.string, str, offset);
    }

    GetId(): Token {
        let str:string = this.currChar;
        let offset = this.pos;
        this.Advance();
        while(this.currChar.search(/[a-zA-Z0-9_\u4e00-\u9fa5]/) >= 0 && this.currChar.length === 1) {
            str += this.currChar;
            this.Advance()
        }
        if (RESERVED_KEYWORDS[str.toLowerCase()]) {
            return createToken(RESERVED_KEYWORDS[str.toLowerCase()], str, offset);
        }
        return createToken(TokenType.id, str, offset);
    }

    GetMark(): Token {
        let currstr = this.currChar;
        let offset = this.pos;
        if (OTHER_MARK[this.currChar]) {
            this.Advance();
            return createToken(OTHER_MARK[currstr], currstr, offset);
        } else if (OTHER_MARK[this.currChar+this.document[this.pos+1]]) {
            // 2-char token
            currstr += this.document[this.pos+1];
            this.Advance().Advance();
            return createToken(OTHER_MARK[currstr], currstr, offset);
        }
        else {
            this.Advance();
            return createToken(TokenType.unknown, currstr, offset);
        }
    }

    GetNextToken(): Token {
        while(this.currChar !== "EOF") {
            if(this.currChar.search(/[ \t]/) >= 0) {
                this.Advance();
            } else if (this.currChar === "\n") {
                let token = createToken(TokenType.EOL, "\n", this.pos);
                this.Advance();
                return token;
            } else if (this.currChar.search(/[0-9]/) >= 0) {
                return this.GetNumber();
            } else if (this.currChar.search(/[a-zA-Z\u4e00-\u9fa5]/) >= 0) {
                return this.GetId();
            } else if (this.currChar === "\"") {
                return this.GetString();
            } else {
                return this.GetMark();
            }
        }
        return createToken(TokenType.EOF, "EOF", this.pos);
    }

    /**
     * reset tokenizer for new loop
     * @param document optional string to split
     */
    Reset(document?: string): void {
        this.pos = 0;
        if (document) {
            this.document = document;
        }
        this.Advance();
    }
}