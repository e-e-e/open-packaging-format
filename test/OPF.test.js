import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiIterator from 'chai-iterator';
import path from 'path';

import * as fs from '../src/fsAsync.js';
import { OPF_DEFAULT } from '../src/constants.js';
import { readOPF, OPF } from '../src/opf.js';

chai.should();
chai.use(chaiAsPromised);
chai.use(chaiIterator);
const expect = chai.expect;

describe('OPF class', () => {
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

    it('has a list of authors as objects with value and opf attributes', () => {
      expect(opf.authors).to.be.a('array');
      expect(opf.authors).to.have.length(13);
      expect(opf.authors).to.include({
        value: 'Gyan Prakash',
        fileAs: 'Prakash, Gyan, , ,',
        role: 'Editor',
      });
      expect(opf.authors).to.include({
        value: 'Edward Said',
        fileAs: 'Prakash, Gyan, , ,',
        role: 'Author',
      });
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
    });

    it('has identifiers which is an empty iterator', () => {
      expect(opf.identifiers).to.be.iterable;
      expect(opf.identifiers).to.iterate.for.lengthOf(0);
    });
  });

  context('making an OPF file from scratch', () => {
    it('should return OPF_DEFAULT when constructed outside readOPF', () => {
      const opf = new OPF();
      expect(opf.data).to.eql(OPF_DEFAULT);
    });

    it('can have a multiple titles set', () => {
      const opf = new OPF();
      const titles = ['This is a good title', 'and an ok subtitle'];
      opf.allTitles = titles;
      expect(opf.title).to.eql(titles[0]);
      expect(opf.allTitles).to.eql(titles);
    });

    it('primary title can be set directly, this will not effect subtitles', () => {
      const opf = new OPF();
      const titles = ['This is a good title', 'and an ok subtitle'];
      opf.allTitles = titles;
      opf.title = titles[0];
      expect(opf.title).to.eql(titles[0]);
      expect(opf.allTitles).to.eql(titles);
    });

    it('custom identifiers can be set via key: value paired object', () => {
      const opf = new OPF();
      opf.identifiers = {
        calibre: '2341455',
        aaarg: 'sa234324',
      };
      expect(opf.identifiers).to.be.iterable;
      expect(opf.identifiers).to.iterate.for.lengthOf(2);
      expect(opf.identifiers).to.deep.iterate.from([
        { calibre: '2341455' },
        { aaarg: 'sa234324' },
      ]);
    });

    it('should return the default.opf XML with toXML() method', async () => {
      const defaultXML = await fs.readFile(path.join(__dirname, './samples/default.opf'));
      const opf = new OPF();
      expect(`${opf.toXML()}\n`).to.eql(defaultXML.toString());
    });
  });

  it('throws error if you try and set title as anything but string', () => {
    const opf = new OPF();
    const erroredTypes = [1, [], {}, null, undefined, NaN];
    erroredTypes.forEach(t => expect(() => { opf.title = t; }).to.throw(Error, /must be set with a string!/));
  });

  it('throws error if you try and set allTitles as anything but array', () => {
    const opf = new OPF();
    const erroredTypes = ['ok', 1, [3, {}], {}, null, undefined, NaN];
    erroredTypes.forEach(t => expect(() => { opf.allTitles = t; }).to.throw(Error, /must be set with an array of strings!/));
  });

});
