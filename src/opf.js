/*
 * OPF metadata handling
 * Ability to do basic reading and writing of Calibre's opf (xml) metadata format
 */
import Promise from 'bluebird';
import xml2js from 'xml2js';
import _ from 'lodash';

import * as fs from './fsAsync';
import { OPF_ROLES, OPF_DEFAULT, NAME_TO_OPF_CODE } from './constants';

const parseStringAsync = Promise.promisify(xml2js.parseString);

const builder = new xml2js.Builder();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// returns only the child value of the xml element
const defaultXMLIteratee = t => (typeof t === 'object' ? t._ : t);

// returns object representing the xml element
export const opfIteratee = (t) => {
  if (typeof t !== 'object') {
    return { value: t };
  }
  const data = Object.keys(t.$).reduce((p, attr) => {
    const value = t.$[attr];
    const result = attr.match(/^(\w+):(\S+)/);
    if (result === null) {
      if (!p.defaults) p.defaults = { [attr]: value };
      else p.defaults[attr] = value;
      return p;
    }
    const namespace = result[1];
    const attribute = _.camelCase(result[2]);
    if (namespace === 'opf') {
      p[attribute] = attribute === 'role' ? OPF_ROLES[value].name : value;
    } else if (!p[namespace]) {
      p[namespace] = { [attribute]: value };
    } else {
      p[namespace][attribute] = value;
    }
    return p;
  }, { value: t._ });
  return data;
};

export const inverseOpfIterattee = (t) => {
  const data = { _: t.value };
  data.$ = Object.keys(t).reduce((p, v) => {
    if (v === 'value') return p;
    const value = t[v];
    if (typeof value === 'object' && value !== undefined) {
      const namespace = (v === 'defaults') ? '' : `${v}:`;
      Object.keys(value).forEach((attr) => { p[`${namespace}${_.kebabCase(attr)}`] = value[attr]; });
    } else {
      p[`opf:${_.kebabCase(v)}`] = (v === 'role') ? (NAME_TO_OPF_CODE[value] || 'aut') : value;
    }
    return p;
  }, {});
  return data;
};

// Extracted Opf metadata gets packaged into an OPF
export class OPF {
  constructor(parsedXmlData) {
    const parsedXmlDataToUse = parsedXmlData || _.cloneDeep(OPF_DEFAULT);
    this.data = parsedXmlDataToUse;
    this.metadata = this.data.package.metadata[0];
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

  set authors(authors) {
    assert(Array.isArray(authors) && authors.every(e => typeof e === 'string' || (typeof e === 'object' && typeof e.value === 'string')), 'authors must be set with an array of strings and/or objects { value, role }!');
    // expect array of objects, or strings,
    this.metadata['dc:creator'] = authors.map((author) => {
      if (typeof author === 'string') {
        return { $: { 'opf:role': 'aut' }, _: author.value };
      }
      return inverseOpfIterattee(author);
    });
  }

  get contributors() {
    return this.getList('dc:contributor', opfIteratee);
  }

  set contributors(contributors) {
    // TODO: abstract code from authors for reuse here.
    console.log(contributors);
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

  get date() {
    // TO DO:
    // opf-event data should be fetched as well.
    // detect and convert to date object (YYYY[-MM[-DD]])
    return this.getField('dc:date');
  }

  set date(date) {
    // TO DO:
    // opf-event data should be fetched as well.
    // detect and convert to date object (YYYY[-MM[-DD]])
    this.metadata['dc:date'] = [date];
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
    // TODO: need to assert that one of these has an id and that that id is equal to packas's unique-identifier attr.
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

// Attach getter and setters to OPF programmatically based on expected metadata;

const simpleDublinCoreProperties = ['title', 'description', 'type', 'format', 'coverage', 'rights', 'source'];

simpleDublinCoreProperties.forEach((property) => {
  const dcProperty = `dc:${property}`;
  function set(value) {
    assert(typeof value === 'string', `${dcProperty} must be set with a string!`);
    if (!Array.isArray(this.metadata[dcProperty])) {
      this.metadata[dcProperty] = [value];
    } else {
      this.metadata[dcProperty][0] = value;
    }
  }
  function get() {
    return this.getField(dcProperty);
  }
  Object.defineProperty(OPF.prototype, property, { get, set });
});

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
