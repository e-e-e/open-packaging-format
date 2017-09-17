import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

import * as fs from '../src/fsAsync';
import { OPF, writeOPF } from '../src/opf';

chai.should();
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('writeOPF', () => {
  let sandbox;
  beforeEach(() => {
    // stub out the `hello` method
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    // completely restore all fakes created through the sandbox
    sandbox.restore();
  });

  it('calls fs.writeFile promise when passed a filename and new OPF', async () => {
    const writeFileStub = sandbox.stub(fs, 'writeFile').resolves();
    await writeOPF('./test.opf', new OPF());
    sinon.assert.calledOnce(writeFileStub);
  });

  it('fails if no OMF object is passed to the function and no file is written', async () => {
    const writeFileStub = sandbox.stub(fs, 'writeFile').resolves();
    expect(() => writeOPF('./test.opf')).to.throw(Error);
    sinon.assert.notCalled(writeFileStub);
  });

  it('fails if it cannot write the file', async () => {
    const writeFileStub = sandbox.stub(fs, 'writeFile').rejects();
    await writeOPF('./invalid/file/path/test.opf', new OPF()).should.eventually.be.rejected;
    sinon.assert.calledOnce(writeFileStub);
  });
});
