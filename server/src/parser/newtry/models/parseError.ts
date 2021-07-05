import { Position, Range } from 'vscode-languageserver-types';
import { Token } from '../types';
import { IParseError } from "../types";

export class ParseError implements IParseError {
	public readonly token: Token;
	public readonly message: string;

	constructor(token: Token, message: string) {
		this.token = token;
		this.message = message;
	}

	get start(): Position {
		return this.token.start;
	}

	get end(): Position {
		return this.token.end;
	}
}