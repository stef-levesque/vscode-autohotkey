/**
 * basic set operations, from MDN
 */



/**
 * Is supper set of subset
 * @param set 
 * @param subset 
 */
export function isSuperset<T>(set: Set<T>, subset: Set<T>): boolean {
    for (let elem of subset) {
        if (!set.has(elem)) {
            return false
        }
    }
    return true
}

/**
 * Return union set of setA and setB
 * @param setA 
 * @param setB 
 */
export function union<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    let _union = new Set(setA)
    for (let elem of setB) {
        _union.add(elem)
    }
    return _union
}

export function intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    let _intersection: Set<T> = new Set()
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem)
        }
    }
    return _intersection
}

export function symmetricDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    let _difference: Set<T> = new Set(setA)
    for (let elem of setB) {
        if (_difference.has(elem)) {
            _difference.delete(elem)
        } else {
            _difference.add(elem)
        }
    }
    return _difference
}

export function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    let _difference = new Set(setA)
    for (let elem of setB) {
        _difference.delete(elem)
    }
    return _difference
}