import * as vs from "vscode";

/**
 * Represents a line of text.
 */
export class ResultingTextLine {
    public constructor(public text: string, public location: vs.Location, public docs: string) {
    }
}
