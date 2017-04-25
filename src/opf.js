/*
 * OPF metadata handling
 * Ability to do basic reading and writing of Calibre's opf (xml) metadata format
 */
import fs from 'fs';
import Promise from 'bluebird';
import xml2js from 'xml2js';
import _ from 'lodash';

import { OPF_ROLES } from './constants.js';

const readFileAsync = Promise.promisify(fs.readFile);
const parseStringAsync = Promise.promisify(xml2js.parseString);

const defaultXMLIteratee = t => (typeof t === 'object' ? t._ : t);

const opfIteratee = (t) => {
  if (typeof t !== 'object') {
    return { value: t };
  }
  const data = { value: t._ };
  const opfAttrs = typeof t.$ === 'object' ? Object.keys(t.$).filter(key => /^opf:/.test(key)) : [];
  opfAttrs.forEach((attr) => {
    const name = _.camelCase(attr.slice(4));
    const value = t.$[attr];
    data[name] = name === 'role' ? OPF_ROLES[value].name : value;
  });
  return data;
};

// Extracted Opf metadata gets packaged into an OPF
export class OPF {
  constructor(parsedXmlData) {
    this.data = parsedXmlData;
    this.obj = parsedXmlData.package.metadata[0];
  }

  get title() {
    return this.getField('dc:title');
  }

  get allTitles() {
    return this.getList('dc:title');
  }

  get authors() {
    return this.getList('dc:creator', opfIteratee);
  }

  get contributors() {
    return this.getList('dc:contributor', opfIteratee);
  }

  get description() {
    return this.getField('dc:description');
  }

  get publishers() {
    return this.getList('dc:publishers');
  }

  get subjects() {
    return this.getList('dc:subject');
  }

  get languages() {
    return this.getList('dc:language');
  }

  get format() {
    return this.getField('dc:format');
  }

  get type() {
    return this.getField('dc:type');
  }

  get date() {
    // TO DO:
    // opf-event data should be fetched as well.
    // detect and convert to date object (YYYY[-MM[-DD]])
    return this.getField('dc:date');
  }

  get source() {
    return this.getField('dc:source');
  }

  get coverage() {
    return this.getField('dc:coverage');
  }

  get rights() {
    return this.getField('dc:rights');
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

  getList(name, iteratee = defaultXMLIteratee) {
    if (Array.isArray(this.obj[name])) {
      return this.obj[name].map(iteratee);
    }
    return undefined;
  }

  getField(name, index = 0) {
    const field = this.obj[name];
    if (field && Array.isArray(field) && field.length > index) {
      return this.obj[name][index];
    }
    return undefined;
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
