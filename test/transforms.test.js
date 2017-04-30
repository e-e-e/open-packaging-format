import chai from 'chai';
import { opfTransform } from '../src/transforms.js';

chai.should();
const expect = chai.expect;

describe('opfTransform', () => {
  describe('iteratee', () => {
    it('takes an xml2js object and returns an object with opf attributes as camelCased keys', () => {
      const inputs = [{
        $: {},
        _: 'value',
      },
      {
        $: {
          'opf:name': 'Judith, Butler',
          'opf:file-as': 'Butler, Judith',
        },
        _: 'value',
      }];
      const output = [{
        value: 'value',
      },
      {
        name: 'Judith, Butler',
        fileAs: 'Butler, Judith',
        value: 'value',
      }];
      inputs.forEach((input, index) => expect(opfTransform.iteratee(input)).to.eql(output[index]));
    });

    it('returns other attributes as nested objects keyed with their namespace', () => {
      const input = {
        $: {
          'test:name': 'Judith, Butler',
          'dc:file-as': 'Butler, Judith',
          id: 'test',
          class: 'extra',
        },
        _: 'value',
      };
      const output = {
        test: {
          name: 'Judith, Butler',
        },
        dc: {
          fileAs: 'Butler, Judith',
        },
        defaults: {
          id: 'test',
          class: 'extra',
        },
        value: 'value',
      };
      expect(opfTransform.iteratee(input)).to.eql(output);
    });

    it('converts opf:role codes into human readable explainations from the OPF spec', () => {
      const input = {
        $: {
          'opf:name': 'Judith, Butler',
          'opf:file-as': 'Butler, Judith',
          'opf:role': 'aui',
        },
        _: 'value',
      };
      const output = {
        name: 'Judith, Butler',
        fileAs: 'Butler, Judith',
        value: 'value',
        role: 'Author of introduction, etc.',
      };
      expect(opfTransform.iteratee(input)).to.eql(output);
    });

    it('returns a simple object { value: x } when not passed an object', () => {
      const simpleValues = ['test', 1];
      simpleValues.forEach(v => expect(opfTransform.iteratee(v)).to.eql({ value: v }));
    });

    it('it breaks if given an array as an argument', () => {
      expect(() => opfTransform.iteratee([])).to.throw(Error);
    });
  });

  describe('inverseIteratee', () => {
    it('returns the input of iteratee when passed the output as an argument', () => {
      const inputs = [{
        $: {},
        _: 'value',
      },
      {
        $: {
          'opf:name': 'Judith, Butler',
          'opf:file-as': 'Butler, Judith',
        },
        _: 'value',
      },
      {
        $: {
          'test:name': 'Judith, Butler',
          'dc:file-as': 'Butler, Judith',
          id: 'test',
          class: 'extra',
        },
        _: 'value',
      }, {
        $: {
          'opf:name': 'Judith, Butler',
          'opf:file-as': 'Butler, Judith',
          'opf:role': 'aui',
        },
        _: 'value',
      }];
      const outputs = [{
        value: 'value',
      },
      {
        name: 'Judith, Butler',
        fileAs: 'Butler, Judith',
        value: 'value',
      },
      {
        test: {
          name: 'Judith, Butler',
        },
        dc: {
          fileAs: 'Butler, Judith',
        },
        defaults: {
          id: 'test',
          class: 'extra',
        },
        value: 'value',
      },
      {
        name: 'Judith, Butler',
        fileAs: 'Butler, Judith',
        value: 'value',
        role: 'Author of introduction, etc.',
      }];
      outputs.forEach((output, index) => expect(opfTransform.inverseIteratee(output)).to.eql(inputs[index]));
    });
  });
});
