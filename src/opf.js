/*
 * OPF metadata handling
 * Ability to do basic reading and writing of Calibre's opf (xml) metadata format
 */
import fs from 'fs';
import Promise from 'bluebird';
import xml2js from 'xml2js';

const readFileAsync = Promise.promisify(fs.readFile);
const parseStringAsync = Promise.promisify(xml2js.parseString);

// Extracted Opf metadata gets packaged into an OPF
export class OPF {
  constructor(parsedXmlData) {
    this.data = parsedXmlData;
    this.obj = parsedXmlData.package.metadata[0];
  }

  get title() {
    return this.getField('dc:title');
  }

  set title(s) {
    this.obj['dc:title'] = s;
  }

  get authors() {
    return this.getList('dc:creator');
  }

  get description() {
    return this.getField('dc:description');
  }

  get subjects() {
    return this.getList('dc:subject');
  }

  getList(name, id = '_') {
    if (name in this.obj) {
      if (Array.isArray(this.obj[name])) {
        return this.obj[name].map(c => c[id]);
      }
    }
    return undefined;
  }

  getField(name, idx = 0) {
    if (name in this.obj) {
      if (Array.isArray(this.obj[name]) && this.obj[name].length > idx) {
        return this.obj[name][idx];
      }
    }
    return undefined;
  }

  get identifiers() {
    const ids = {};
    const obj = this.obj;
    ids[Symbol.iterator] = function* () {
      if (Array.isArray(obj['dc:identifier'])) {
        for (const i of obj['dc:identifier']) {
          if ('$' in i && '_' in i && 'opf:scheme' in i.$) {
            const id = {};
            id[i.$['opf:scheme']] = i._;
            yield id;
          }
        }
      }
    };
    return ids;
  }
}

// Parses an opf file
export function readOPF(fileLoc, encoding = 'utf-8') {
  return readFileAsync(fileLoc, encoding)
    .then(data => parseStringAsync(data))
    .then(xml => new OPF(xml));
}

// Writes an opf file from an OPF object
export function writeOPF(fileLoc, obj) {
  console.log(`Writing OPFs is not implemented yet: ${obj}`);
}
