/**
 * Precedences for all operators
 * total 14 level. 
 * Same order as TokenType
 */
export const Precedences: number[] = [
    15, 15,
    14,
    13, 13,
    12, 12, 12,
    11, 11,
    10, 10,
    9, 9, 9,
    8,
    7,
    6, 6, 6, 6,
    5, 5, 5, 5,
    4,
    3, 3,
    2, 2,
    1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

export const UnaryPrecedence = 12;
