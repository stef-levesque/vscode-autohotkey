/**
 * reference: kos-language-server
 */

import { readFile, readdirSync, existsSync, lstatSync, statSync } from 'fs';
import { dirname, join } from 'path';

/**
 * What kind of entity is this
 */
export enum IoKind {
    /**
     * The io entity is a file
     */
    file,
  
    /**
     * The io entity is a directory
     */
    folder,
}
  
/**
 * What is the io entity that is found
 */
export interface IoEntity {
    /**
     * What is the path of this entity
     */
    path: string;
  
    /**
     * WHat is the kind of this entity
     */
    kind: IoKind;
}

function readFileAsync(path: string, encoding: string) :Promise<string> {
    return new Promise((resolve, reject) => {
        readFile(path, { encoding }, (err, data) => {
            if (err) {
                reject(err);
            }
    
            resolve(data);
        });
    });
}


/**
 * A small set of functionality for loading files and directory of files
 */
export class IoService {
    constructor() {}
  
    /**
     * Load a file from a given path
     * @param path the system path
     */
    public load(path: string): Promise<string> {
      return readFileAsync(path, 'utf-8');
    }

    /**
     * What entities are in the relevant directory
     * @param path The full path of the request
     */
    public statDirectory(path: string): IoEntity[] {
        const isDirectory = existsSync(path) && lstatSync(path).isDirectory();
        if (!isDirectory) {
            return [];
        }
        const directory = path;

        // check if file exists then
        if (!existsSync(directory)) {
            return [];
        }

        const files = readdirSync(directory);
        let entities: IoEntity[] = []
        for (const file of files) {
            const path = join(directory, file);

            // in case of permition denied
            try {
                entities.push({
                    path: file,
                    kind: statSync(path).isDirectory() ? IoKind.folder : IoKind.file
                });
            } catch (error) {
                // pass, just skip it
                continue;
            }
        }
        return entities;
    }
}