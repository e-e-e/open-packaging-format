/*
 * OPF metadata handling
 * Ability to do basic reading and writing of Calibre's opf (xml) metadata format
 */
import Promise from 'bluebird';
import xml2js from 'xml2js';
import _ from 'lodash';

import * as fs from './fsAsync';
import { OPF_ROLES, OPF_DEFAULT } from './constants';

const parseStringAsync = Promise.promisify(xml2js.parseString);

const builder = new xml2js.Builder();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

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
    const parsedXmlDataToUse = parsedXmlData || _.cloneDeep(OPF_DEFAULT);
    this.data = parsedXmlDataToUse;
    this.metadata = this.data.package.metadata[0];
  }

  get title() {
    return this.getField('dc:title');
  }

  set title(title) {
    assert(typeof title === 'string', 'title must be set with a string!');
    if (!Array.isArray(this.metadata['dc:title'])) {
      this.metadata['dc:title'] = [title];
    } else {
      this.metadata['dc:title'][0] = title;
    }
  }

  get allTitles() {
    return this.getList('dc:title');
  }

  set allTitles(titles) {
    assert(Array.isArray(titles) && titles.every(e => typeof e === 'string'), 'allTitles must be set with an array of strings!');
    this.metadata['dc:title'] = titles;
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
    const obj = this.metadata;
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

  set identifiers(ids) {
    assert(typeof ids === 'object', 'identifiers to be set as a key, value object, eg. { scheme: id }');
    this.metadata['dc:identifier'] = _.map(ids, (id, scheme) => ({
      $: {
        'opf:scheme': scheme,
      },
      _: id,
    }));
  }

  getList(name, iteratee = defaultXMLIteratee) {
    if (Array.isArray(this.metadata[name])) {
      return this.metadata[name].map(iteratee);
    }
    return undefined;
  }

  getField(name, index = 0) {
    const field = this.metadata[name];
    if (field && Array.isArray(field) && field.length > index) {
      return this.metadata[name][index];
    }
    return undefined;
  }

  toXML() {
    this.data.package.metadata = [this.metadata];
    return builder.buildObject(this.data);
  }
}

// Parses an opf file
export function readOPF(fileLoc, encoding = 'utf-8') {
  return fs.readFile(fileLoc, encoding)
    .then(data => parseStringAsync(data))
    .then(xml => new OPF(xml));
}

// Writes an opf file from an OPF object
export function writeOPF(fileLoc, opf) {
  return fs.writeFile(fileLoc, opf.toXML());
}
