import { INodeResult } from '../../types';
import { ParseError } from '../models/parseError';

export const nodeResult = <T>(
    stmt: T,
    errors: ParseError[],
): INodeResult<T> => {
    return {
        errors,
        value: stmt,
    };
};
