import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';

import * as fs from '../src/fsAsync';
import { OPF_DEFAULT } from '../src/constants';
import { readOPF, OPF } from '../src/opf';

chai.should();
chai.use(chaiAsPromised);
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

    it('has property identifiers which is an array of objects {scheme, value, id(optional) } where id is truthy if it is equal to the packages unique-identifier', () => {
      expect(opf.identifiers).to.deep.equal([
        {
          defaults: {
            id: 'calibre_id',
          },
          scheme: 'calibre',
          value: '20',
        }, {
          defaults: {
            id: 'uuid_id',
          },
          id: 'uuid_id',
          scheme: 'uuid',
          value: 'fb308377-e17b-4d7b-8f77-cf0657a86c11',
        }, {
          scheme: 'ARG',
          value: '51c584186c3a0ed90bcd0800.1',
        },
      ]);

      it('the date property returns a single js date object', () => {
        expect(opf.date).to.be.instanceOf(Date);
        expect(opf.date.getFullYear()).to.eql(2016);
      });
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
        'identifiers',
        'date',
      ];
      properties.forEach(property => expect(opf[property]).to.eql(undefined));
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
      opf.titles = titles;
      expect(opf.title).to.eql(titles[0]);
      expect(opf.titles).to.eql(titles);
    });

    it('primary title can be set directly, this will not effect subtitles', () => {
      const opf = new OPF();
      const titles = ['This is a good title', 'and an ok subtitle'];
      opf.titles = titles;
      opf.title = titles[0];
      expect(opf.title).to.eql(titles[0]);
      expect(opf.titles).to.eql(titles);
    });

    it('sets authors with an array of strings or objects: { value, role, fileAs }', () => {
      const opf = new OPF();
      const authors = [{
        value: 'Judith Butler',
        fileAs: 'Butler, Judith',
        role: 'Author',
      }];
      opf.authors = authors;
      expect(opf.authors).to.eql(authors);
    });

    it('sets description with string', () => {
      const opf = new OPF();
      const description = `
        this is my long description,
        it is a few lines of text.
      `;
      opf.description = description;
      expect(opf.description).to.eql(description);
    });

    it('sets multiple custom identifiers with for array [{scheme, value, id:true (optional)}]', () => {
      const opf = new OPF();
      opf.identifiers = [{
        scheme: 'calibre',
        value: '2341455',
      }, {
        id: true,
        scheme: 'ARG',
        value: 'sa234324',
      }];
      expect(opf.identifiers).to.be.instanceOf(Array);
      expect(opf.identifiers).to.have.length(2);
      expect(opf.identifiers).to.deep.equal([{
        scheme: 'calibre',
        value: '2341455',
      }, {
        defaults: {
          id: 'ARG_id',
        },
        id: 'ARG_id',
        scheme: 'ARG',
        value: 'sa234324',
      }]);
    });

    it('sets date when passed a new Date object', () => {
      const opf = new OPF();
      opf.date = new Date(2016, 11);
      expect(opf.date.getFullYear()).to.equal(2016);
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

  it('throws error if you try and set titles as anything but array', () => {
    const opf = new OPF();
    const erroredTypes = ['ok', 1, [3, {}], {}, null, undefined, NaN];
    erroredTypes.forEach(t => expect(() => { opf.titles = t; }).to.throw(Error, /must be set with an array of strings!/));
  });

  it('throws error if no id is set with identifiers', () => {
    const opf = new OPF();
    const fn = () => {
      opf.identifiers = [{
        scheme: 'calibre',
        value: '2341455',
      }, {
        scheme: 'ARG',
        value: 'sa234324',
      }];
    };
    expect(fn).to.throw(Error, /At least one identifier must contain truthy id key/);
  });

  it('throws error identifiers are set with anything other than array of objects with scheme and value keys', () => {
    const opf = new OPF();
    const badArgs = [
      [{ value: '2341455' }],
      [{ scheme: 'ARG' }],
      2,
      'this',
      {},
      NaN,
    ];
    badArgs.forEach(v =>
      expect(() => { opf.identifiers = v; }).to.throw(Error, /identifiers must be set with an array of objects with scheme and value keys/),
    );
  });
  describe('opf#merge function', () => {
    it('takes an object and assigns its values to the opf', () => {
      const obj = {
        uniqueIdentifierKey: 'uuid',
        title: 'Gender Trouble',
        authors: ['Judith Butler', 'Ann Marsh'],
      };
      const opf = new OPF();
      opf.merge(obj);
      expect(opf.uniqueIdentifierKey).to.eql('uuid');
      expect(opf.title).to.eql('Gender Trouble');
      expect(opf.authors).to.eql([{
        value: 'Judith Butler',
        role: 'Author',
      },
      {
        value: 'Ann Marsh',
        role: 'Author',
      }]);
    });

    it('does not merge attributes that are not settable on OPF', () => {
      const obj = {
        thisIsNotValid: 'uuid',
        title: 'but this is',
      };
      const opf = new OPF();
      opf.merge(obj);
      expect(opf.thisIsNotValid).to.eql(undefined);
      expect(opf.title).to.eql('but this is');
    });
  });
});
