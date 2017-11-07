/*
 * OPF metadata handling
 * Ability to do basic reading and writing of Calibre's opf (xml) metadata format
 */
import Promise from 'bluebird';
import xml2js from 'xml2js';
import _ from 'lodash';

import * as fs from './fsAsync';
import assert from './assert';
import { simpleTransform, opfTransform, metaTagsMap } from './transforms';

import { OPF_DEFAULT } from './constants';

const parseStringAsync = Promise.promisify(xml2js.parseString);

const builder = new xml2js.Builder();

// Extracted Opf metadata gets packaged into an OPF
export class OPF {
  constructor(parsedXmlData) {
    const parsedXmlDataToUse = parsedXmlData || _.cloneDeep(OPF_DEFAULT);
    this.data = parsedXmlDataToUse;
    this.metadata = this.data.package.metadata[0];
    this.guide = _.get(this.data, 'package.guide[0]');
    this.metaTags = undefined;
  }

  get cover() {
    if (!this.guide || !this.guide.reference) return undefined;
    const v = this.guide.reference.find(ref => typeof ref.$.type === 'string' && ref.$.type.toLowerCase() === 'cover');
    return v.$.href;
    // return;
  }

  set cover(src) {
    if (!this.guide) {
      this.guide = {};
    }
    if (!this.guide.reference) {
      this.guide.reference = [];
    }
    const v = this.guide.reference.find(ref => typeof ref.$.type === 'string' && ref.$.type.toLowerCase() === 'cover');
    if (v) v.$.href = src;
    else {
      this.guide.reference.push({ $: {
        type: 'cover',
        title: 'Cover',
        href: src,
      } });
    }
  }

  merge(obj) {
    _.each(obj, (value, key) => {
      const description = Object.getOwnPropertyDescriptor(OPF.prototype, key);
      if (description && description.set) {
        this[key] = value;
      } else {
        console.warn('Can’t set', key, 'because OPF has no setter method associated with that key');
      }
    });
  }

  get meta() {
    if (this.metaTags) return this.metaTags;
    if (this.metadata.meta === undefined) return undefined;
    this.metaTags = metaTagsMap.toObject(this.metadata.meta);
    return this.metaTags;
  }

  set meta(obj) {
    // modify internal state
    this.metaTags = obj;
  }

  get uniqueIdentifierKey() {
    return this.data.package.$['unique-identifier'];
  }

  set uniqueIdentifierKey(value) {
    if (!this.data.package.$) this.data.package.$ = { 'unique-identifier': value };
    else this.data.package.$['unique-identifier'] = value;
  }

  get date() {
    // TODO:
    // opf-event data should be fetched as well.
    // detect and convert to date object (YYYY[-MM[-DD]])
    const field = this.metadata['dc:date'];
    return field ? new Date(this.metadata['dc:date'][0]) : undefined;
  }

  set date(date) {
    // TODO:
    // opf-event data should be fetched as well.
    // detect and convert to date object (YYYY[-MM[-DD]])
    this.metadata['dc:date'] = [date.toISOString()];
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

  toXML() {
    if (this.metaTags) {
      // reinject metaTags back into xml structure before building
      this.metadata.meta = metaTagsMap.fromObject(this.metaTags);
    }
    if (this.metadata) this.data.package.metadata = [this.metadata];
    if (this.guide) this.data.package.guide = [this.guide];
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

// TODO: add simple cache for gotten item that is updated on set
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
