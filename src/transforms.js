import _ from 'lodash';
import assert from './assert';
import { OPF_ROLES, NAME_TO_OPF_CODE } from './constants';

export const simpleTransform = {
  assert: values => assert(
    Array.isArray(values) && values.every(e => typeof e === 'string'),
    `${values} must be set with an array of strings!`,
  ),
  iteratee: t => (typeof t === 'object' ? t._ : t),
  inverseIteratee: (t, defaultAttrs) => (defaultAttrs ? { $: defaultAttrs, _: t } : t),
};

export const metaTagsMap = {
  toObject: meta => (
    meta.reduce((p, v) => {
      const { name, content } = v.$;
      const result = name.match(/^(\w+):(\S+)/);
      let namespace = 'defaults';
      let attr = name;
      if (result !== null) {
        namespace = result[1];
        attr = _.camelCase(result[2]);
      }
      if (p[namespace]) {
        p[namespace][attr] = content;
      } else {
        p[namespace] = { [attr]: content };
      }
      return p;
    }, {})
  ),
  fromObject: meta => (
    _.flatMap(meta, (attrs, namespace) => {
      const namespaced = (namespace === 'defaults') ? '' : `${namespace}:`;
      return _.map(attrs, (value, attr) => ({
        $: {
          name: `${namespaced}${_.snakeCase(attr)}`,
          content: JSON.stringify(value),
        },
      }));
    })
  ),
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
    if (typeof t === 'string') return { _: t, $: defaultAttrs };
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
