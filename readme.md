# Open Packaging Format

[![npm version](https://badge.fury.io/js/open-packaging-format.svg)](https://badge.fury.io/js/open-packaging-format) [![Build Status](https://travis-ci.org/e-e-e/open-packaging-format.svg?branch=master)](https://travis-ci.org/e-e-e/open-packaging-format) [![dependencies Status](https://david-dm.org/e-e-e/open-packaging-format/status.svg)](https://david-dm.org/e-e-e/open-packaging-format) [![Coverage Status](https://coveralls.io/repos/github/e-e-e/open-packaging-format/badge.svg?branch=master)](https://coveralls.io/github/e-e-e/open-packaging-format?branch=master) [![Code Climate](https://codeclimate.com/github/e-e-e/open-packaging-format/badges/gpa.svg)](https://codeclimate.com/github/e-e-e/open-packaging-format)

An simple parser for opf metadata files. This is an incomplete implementation of the [OPF specification](http://www.idpf.org/epub/20/spec/OPF_2.0.1_draft.htm).

## Install

```bash
npm install open-packaging-format;
```

## Simple Use:

```js
import { readOPF } from 'open-packaging-format';

readOPF('some/dir/to/metadata.opf')
  .then((opf) => {
    console.log(opf.title);
    console.log(opf.description);
    for (const id of opf.identifiers) {
      console.log(id);
    }
  })
  .catch(console.error);
```

demonstrating writing data to an OPF and then that data to a file:

```js
import OPF, { writeOPF } from 'open-packaging-format';

const opf = new OPF();
opf.title = 'This is a good title';
o.writeOPF('/path/to/your.xml', opf)
  .catch(console.error);

```
