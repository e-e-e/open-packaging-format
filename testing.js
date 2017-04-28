xml2js = require('xml2js')
var o = require('./')

const opf = new o.OPF();
opf.title = 'This is a good title';
o.writeOPF('testing.xml', opf)
  .catch(console.error);

/*
o.readOPF('test/samples/metadata.opf')
  .then((opf) => {
    opf.title = 'A BRAND NEW TITLE!';
    o.writeOPF('testing.xml', opf);
    // console.log(opf.title);
    // console.log(opf.description);
    // for (const id of opf.identifiers) {
    //  console.log(id);
    // }
    // var str = JSON.stringify(opf, null, 4);
    // console.log(str);

  })
  .catch(console.error);
*/
