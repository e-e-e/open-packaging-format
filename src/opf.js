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

const simpleTransform = {
  assert: values => assert(
    Array.isArray(values) && values.every(e => typeof e === 'string'),
    `${values} must be set with an array of strings!`,
  ),
  iteratee: t => (typeof t === 'object' ? t._ : t),
  inverseIteratee: (t, defaultAttrs) => (defaultAttrs ? { $: defaultAttrs, _: t } : t),
};

// returns object representing the xml element
export const opfTransform = {
  assert: values => assert(
    Array.isArray(values) && values.every(e => typeof e === 'string' || (typeof e === 'object' && typeof e.value === 'string')),
    `${values} must be set with an array of strings and/or objects { value, attrs... }!`,
  ),
  iteratee: (t) => {
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
  },
  inverseIteratee: (t, defaultAttrs) => {
    const data = { _: t.value };
    const attributes = Object.keys(t).reduce((p, v) => {
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
    data.$ = { ...defaultAttrs, ...attributes };
    return data;
  },
};

// Extracted Opf metadata gets packaged into an OPF
export class OPF {
  constructor(parsedXmlData) {
    const parsedXmlDataToUse = parsedXmlData || _.cloneDeep(OPF_DEFAULT);
    this.data = parsedXmlDataToUse;
    this.metadata = this.data.package.metadata[0];
  }

  get uniqueIdentifierKey() {
    return this.data.package.$['unique-identifier'];
  }

  set uniqueIdentifierKey(value) {
    if (!this.data.package.$) this.data.package.$ = { 'unique-identifier': value };
    else this.data.package.$['unique-identifier'] = value;
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
    const field = this.metadata['dc:identifier'];
    return (field)
      ? field.map((v) => {
        const transformed = opfTransform.iteratee(v);
        if (v.$.id === this.uniqueIdentifierKey) transformed.id = this.uniqueIdentifierKey;
        return transformed;
      })
      : undefined;
  }

  set identifiers(ids) {
    assert(
      Array.isArray(ids) &&
      ids.every(id => (typeof id === 'object' && id.scheme !== undefined && id.value !== undefined)),
      'identifiers must be set with an array of objects with scheme and value keys',
    );
    const uuidIndex = ids.findIndex(id => id.id); // find id with id key
    assert(uuidIndex !== -1, 'At least one identifier must contain truthy id key');
    console.log(uuidIndex, ids[uuidIndex]);
    this.uniqueIdentifierKey = `${ids[uuidIndex].scheme}_id`;
    this.metadata['dc:identifier'] = ids.map((v, i) => {
      if (i === uuidIndex) {
        delete v.id;
        if (v.defaults) v.defaults.id = this.uniqueIdentifierKey;
        else v.defaults = { id: this.uniqueIdentifierKey };
      }
      return opfTransform.inverseIteratee(v);
    });
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

const simpleDublinCoreProperties = [
  'title',
  'description',
  'type',
  'format',
  'coverage',
  'rights',
  'source',
];

const multipleDublinCoreProperties = [{
  property: 'title',
  alias: 'titles',
}, {
  property: 'creator',
  alias: 'authors',
  transform: opfTransform,
  defaultAttrs: { 'opf:role': 'aut' },
}, {
  property: 'contributor',
  alias: 'contributors',
  transform: opfTransform,
  defaultAttrs: { 'opf:role': 'clb' },
}, {
  property: 'subject',
  alias: 'subjects',
}, {
  property: 'publisher',
  alias: 'publishers',
}, {
  property: 'language',
  alias: 'languages',
}];

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
    const field = this.metadata[dcProperty];
    return (field) ? field[0] : undefined;
  }
  Object.defineProperty(OPF.prototype, property, { get, set });
});

multipleDublinCoreProperties.forEach(({ property, alias, transform = simpleTransform, defaultAttrs }) => {
  const dcProperty = `dc:${property}`;
  function set(values) {
    transform.assert(values);
    this.metadata[dcProperty] = values.map(v => transform.inverseIteratee(v, defaultAttrs));
  }
  function get() {
    const field = this.metadata[dcProperty];
    return (field) ? field.map(transform.iteratee) : undefined;
  }
  Object.defineProperty(OPF.prototype, alias, { get, set });
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
