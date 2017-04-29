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
});

