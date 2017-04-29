import fs from 'fs';
import Promise from 'bluebird';

export const readFile = Promise.promisify(fs.readFile);
export const writeFile = Promise.promisify(fs.writeFile);
