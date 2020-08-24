/**
 * Generate a parse stack of parsing process,
 * not for a real parser.
 * But, for language server providers.
 * Only parse a line.
 */

import { 
	Tokenizer,
	TokenType,
	Token
} from "./tokenizer";
import { throws } from 'assert';

interface AST {
	isWrong: boolean
}

interface NoOperat extends AST {
	
}

interface Expr extends AST {
	token: Token
	expr: any
}

interface Variable extends AST {
	name: string
	token: Token
}

interface Assign extends AST {
	left: Variable
	operator: Token
	right: any
}

interface FunctionCall extends AST {
	name: string
	actualParams: any[]
	token: Token
}

interface MethodCall extends FunctionCall {
	/**
	 * reference class of a method
	 */
	ref: Token[]
}

interface PropertCall extends AST {
	name: string
	token: Token
	ref: Token[]
}

class SemanticStack {
	private tokenizer: Tokenizer;
	private currentToken: Token;

	constructor(document: string) {
		this.tokenizer = new Tokenizer(document);
		this.currentToken = this.tokenizer.GetNextToken();
	}

	reset(document: string) {
		this.tokenizer.Reset(document);
		return this;
	}

	eat(type: TokenType) {
		if (type === this.currentToken.type) {
			this.currentToken = this.tokenizer.GetNextToken();
		} 
		else {
			throw new Error("Unexpect Token");
		}
	}

	variable(): Variable {
		let token = this.currentToken;
		this.eat(TokenType.id);
		return {
			name: token.content,
			token: token,
			isWrong: false
		};
	}

	expr(): Expr | NoOperat {
		let token = this.currentToken;
		while (this.currentToken.type !== TokenType.id && this.currentToken.type !== TokenType.comma) {
			this.eat(this.currentToken.type);
		}
		if (this.currentToken.type === TokenType.id) {
			let expr = this.parseStatement();
			return {
				token: token,
				expr: expr,
				isWrong: false
			}
		}
		return {
			isWrong: false
		} as NoOperat

	}

	assignment(): Assign {
		let left = this.variable();
		let isWrong = false;

		this.eat(TokenType.id);
		let token: Token = this.currentToken;
		if (this.currentToken.type === TokenType.aassign) {
			this.eat(TokenType.aassign);
		}
		try{
			this.eat(TokenType.equal);
		}
		catch (err) {
			isWrong = true;
		}
		let exprNode = this.expr();
		return {
			left: left,
			operator: token,
			right: exprNode,
			isWrong: isWrong
		}

	}

	funcCall(): FunctionCall {
		let token = this.currentToken;
		let funcName = token.content;
		let iserror = false;

		this.eat(TokenType.id);
		this.eat(TokenType.openParen);
		let actualParams = [];
		if (this.currentToken.type !== TokenType.closeParen) {
			actualParams.push(this.expr());
		}

		while (this.currentToken.type === TokenType.comma) {
			this.eat(TokenType.comma);
			actualParams.push(this.expr());
		}

		try {
			this.eat(TokenType.closeParen);
		}
		catch (err) {
			iserror = true;
		}
		
		return {
			name: funcName,
			actualParams: actualParams,
			token: token,
			isWrong: iserror
		};
	}

	classCall(): MethodCall|PropertCall {
		let classref: Token[] = [];

		this.eat(TokenType.id);
		this.eat(TokenType.dot);
		while (this.currentToken.type === TokenType.id && this.tokenizer.currChar === '.') {
			classref.push(this.currentToken);
			this.eat(TokenType.id);
			this.eat(TokenType.dot);
		}
		if (this.currentToken.type === TokenType.id) {
			if (this.tokenizer.currChar === '(') {
				let callNode = this.funcCall() as MethodCall;
				callNode.ref = classref;
				return callNode;
			} 
			return {
				name: this.currentToken.content,
				token: this.currentToken,
				ref: classref,
				isWrong: false
				
			}
		}
		return {
			name: '',
			token: this.currentToken,
			ref: classref,
			isWrong: true
		}

	}

	parseStatement() {
		// let node: any;
		// Start at first id
		while (this.currentToken.type !== TokenType.id) {
			if (this.currentToken.type === TokenType.EOF) {
				return [];
			}
			this.eat(this.currentToken.type);
		}
		switch (this.currentToken.type) {
			case TokenType.id:
				if (this.tokenizer.currChar === '(') {
					return this.funcCall();
				} 
				else if (this.tokenizer.currChar === '.') {
					return this.classCall()
				}
				else {
					return this.assignment();
				}
				break;
		
			// default:
			// 	return []
			// 	break;
		}
	}
}