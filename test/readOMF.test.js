import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiIterator from 'chai-iterator';
import path from 'path';

import { readOPF, OPF } from '../src/opf.js';

chai.should();
chai.use(chaiAsPromised);
chai.use(chaiIterator);
const expect = chai.expect;

describe('readOPF', () => {
  it('accepts a filename and returns a promise that resolves to a new OMF object', () => {
    const promise = readOPF(path.join(__dirname, './samples/metadata.opf'));
    expect(promise).to.eventually.be.an.instanceof(OPF);
  });

  it('should return a rejected promise if the file does not exist', () => {
    const promise = readOPF(path.join(__dirname, './samples/notafile.opf'));
    return promise.should.eventually.be.rejected;
  });

  it('should return a rejected promise if the file is malformed', () => {
    const promise = readOPF(path.join(__dirname, './samples/malformed.opf'));
    return promise.should.eventually.be.rejected;
  });

  it('should return a OMF object even if metadata is empty', () => {
    const promise = readOPF(path.join(__dirname, './samples/empty.opf'));
    expect(promise).to.eventually.be.an.instanceof(OPF);
  });

  context('with successfully returned OPF object', () => {
    let opf;
    before(() => readOPF(path.join(__dirname, './samples/metadata.opf')).then((obj) => { opf = obj; }));

    it('has the title "After Colonialism: Imperial Histories and Postcolonial Displacements"', () => {
      expect(opf.title).to.eql('After Colonialism: Imperial Histories and Postcolonial Displacements');
    });

    it('has a description with type string', () => {
      expect(opf.description).to.be.a('string');
    });

    it('has an array of languages, including "en"', () => {
      expect(opf.languages).to.be.a('array');
      expect(opf.languages).to.include('en');
    });

    it('has a list of authors', () => {
      expect(opf.authors).to.be.a('array');
    });

    it('has a list of contributors', () => {
      expect(opf.contributors).to.be.a('array');
    });

    it('has format value equal to "application/pdf"', () => {
      expect(opf.format).to.eql('application/pdf');
    });

    it('has an array of subjects', () => {
      expect(opf.subjects).to.be.a('array');
      expect(opf.subjects).to.include('Philosophy');
    });

    it('has property identifiers which is an iterator', () => {
      expect(opf.identifiers).to.be.iterable;
      expect(opf.identifiers).to.iterate.for.lengthOf(3);
      expect(opf.identifiers).to.deep.iterate.from([
        { calibre: '20' },
        { uuid: 'fb308377-e17b-4d7b-8f77-cf0657a86c11' },
        { ARG: '51c584186c3a0ed90bcd0800.1' },
      ]);
    });
  });

  context('with successfully returned but empty OPF object', () => {
    let opf;

    before(() => readOPF(path.join(__dirname, './samples/empty.opf')).then((obj) => { opf = obj; }));

    it('has all properties as undefined', () => {
      const properties = [
        'title',
        'format',
        'subjects',
        'authors',
        'description',
        'contributors',
        'languages',
        'source',
        'type',
      ];
      for (const property in properties) {
        expect(opf[property]).to.eql(undefined);
      }
    })

    it('has identifiers which is an empty iterator', () => {
      expect(opf.identifiers).to.be.iterable;
      expect(opf.identifiers).to.iterate.for.lengthOf(0);
    });
  });
});

