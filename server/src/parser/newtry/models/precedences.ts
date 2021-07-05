import { TokenType } from '../tokenTypes';

/**
 * Precedences for all operators
 * total 14 level. 
 * Same order as TokenType
 */
export const Precedences: number[] = [
    14, 14,
    13,
    12, 12,
    11, 11, 11,
    10, 10,
    9, 9,
    8, 8, 8,
    7,
    6,
    5, 5, 5, 5,
    4, 4, 4, 4,
    3,
    2, 2,
    1, 1,
    0,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
];

export const UnaryPrecedence = 12;
