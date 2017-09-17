const opf = require('./dist/opf.cjs.js');

const o = new opf.OPF();
o.title = 'hello';
o.authors = [{
  value: 'Judith Butler',
  fileAs: 'Butler, Judith',
  role: 'Author',
}];
return opf.writeOPF('example.opf', o);
