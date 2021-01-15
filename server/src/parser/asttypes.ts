import { Token } from "../utilities/types";

export type Expr = INodeResult<IBinOp|IUnaryOperator|ILiteral|IVariable|IFunctionCall|IMethodCall|IPropertCall|INoOpt>; 

/**
 * Range in form of offset
 */
export interface IOffRange {
	/**
	 * Start offset
	 */
	start: number
	/**
	 * End offset
	 */
	end: number
}

export class Offrange implements IOffRange {
	start: number;
	end: number;
	constructor(start: number, end: number) {
		this.start = start;
		this.end = end;
	}
}

export interface IASTNode {
	offrange: IOffRange
}

export interface INoOpt extends IASTNode {
}

export interface IAPair {
	key: Expr
	value: Expr
}

export interface ILiteral extends IASTNode {
	token: Token
	value: string
}

export interface IAssociativeArray extends IASTNode {
	Pairs: IAPair[]
}

export interface IArray extends IASTNode {
	items: Expr[]
}

export interface IUnaryOperator extends IASTNode {
	operator: Token
	expr: Expr
}

export interface IBinOp extends IASTNode {
	left: Expr
	operator: Token
	right: Expr
}

export interface IVariable extends IASTNode {
	name: string
	token: Token
}

export interface IAssign extends IASTNode {
	left: INodeResult<IVariable|IPropertCall>
	operator: Token
	right: Expr
}

export interface IFunctionCall extends IASTNode {
	name: string
	actualParams: Expr[]
	token: Token
}

export interface IMethodCall extends IFunctionCall {
	/**
	 * reference class of a method
	 */
	ref: Token[]
}

export interface IPropertCall extends IASTNode {
	name: string
	token: Token
	ref: Token[]
}

export interface INodeResult<T> {
	errors: boolean;
	value: T;
}

export class FunctionCall implements IFunctionCall {
	name: string;
	actualParams: Expr[];
	token: Token;
	offrange: IOffRange;
	constructor(name: string, actualParams: Expr[], token: Token, offrange: IOffRange) {
		this.name = name;
		this.actualParams = actualParams;
		this.token = token;
		this.offrange = offrange;
	}
}

export class MethodCall extends FunctionCall implements IMethodCall {
	ref: Token[];
	constructor(name: string, actualParams: any[], token: Token, ref: Token[], offrange: IOffRange) {
		super(name, actualParams, token, offrange);
		this.ref = ref;
	}
}

export class PropertCall implements IPropertCall {
	name: string;
	token: Token;
	ref: Token[];
	offrange: IOffRange;
	constructor(name: string, token: Token, ref: Token[], offrange: IOffRange) {
		this.name = name;
		this.token = token;
		this.ref = ref;
		this.offrange = offrange;
	}
}

export class NoOption implements INoOpt {
	offrange: IOffRange;
	none = null;
	constructor(offrange: IOffRange) {
		this.offrange = offrange;
	}
}