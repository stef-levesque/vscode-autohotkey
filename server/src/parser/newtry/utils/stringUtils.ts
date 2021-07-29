export const joinLines = (separator: string, ...lines: string[][]): string[] => {
    if (lines.length === 1) {
        return lines[0];
    }

    if (lines.every(t => t.length === 1)) {
        return [lines.map(l => l[0]).join(separator)];
    }

    const [first, ...rest] = lines;
    const result = first;
    for (const restLines of rest) {
        result[result.length - 1] = `${result[result.length - 1]}${separator}${restLines[0]}`;

        for (let i = 1; i < restLines.length; i += 1) {
            result.push(restLines[i]);
        }
    }

    return result;
};