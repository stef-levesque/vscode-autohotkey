/**
 * reference: kos-language-server
 */

import { readFile } from 'fs';

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
}