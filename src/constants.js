export const OPF_DEFAULT = {
  data: {
    package: {
      $: {
        xmlns: 'http://www.idpf.org/2007/opf',
        version: '2.0',
      },
      metadata: [
        {
          $: {
            'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
            'xmlns:opf': 'http://www.idpf.org/2007/opf',
          },
        },
      ],
    },
  },
};

export const OPF_DATE_EVENTS = [
  'creation',
  'publication',
  'modification',
];

export const OPF_ROLES = {
  adp: {
    name: 'Adapter',
    description: 'Use for a person who 1) reworks a musical composition, usually for a different medium, or 2) rewrites novels or stories for motion pictures or other audiovisual medium.',
  },
  ann: {
    name: 'Annotator',
    description: 'Use for a person who writes manuscript annotations on a printed item.',
  },
  arr: {
    name: 'Arranger',
    description: 'Use for a person who transcribes a musical composition, usually for a different medium from that of the original; in an arrangement the musical substance remains essentially unchanged.',
  },
  art: {
    name: 'Artist',
    description: 'Use for a person (e.g., a painter) who conceives, and perhaps also implements, an original graphic design or work of art, if specific codes (e.g., [egr], [etr]) are not desired. For book illustrators, prefer Illustrator [ill].',
  },
  asn: {
    name: 'Associated name',
    description: 'Use as a general relator for a name associated with or found in an item or collection, or which cannot be determined to be that of a Former owner [fmo] or other designated relator indicative of provenance.',
  },
  aut: {
    name: 'Author',
    description: 'Use for a person or corporate body chiefly responsible for the intellectual or artistic content of a work. This term may also be used when more than one person or body bears such responsibility.',
  },
  aqt: {
    name: 'Author in quotations or text extracts',
    description: 'Use for a person whose work is largely quoted or extracted in a works to which he or she did not contribute directly. Such quotations are found particularly in exhibition catalogs, collections of photographs, etc.',
  },
  aft: {
    name: 'Author of afterword, colophon, etc.',
    description: 'Use for a person or corporate body responsible for an afterword, postface, colophon, etc. but who is not the chief author of a work.',
  },
  aui: {
    name: 'Author of introduction, etc.',
    description: 'Use for a person or corporate body responsible for an introduction, preface, foreword, or other critical matter, but who is not the chief author.',
  },
  ant: {
    name: 'Bibliographic antecedent',
    description: 'Use for the author responsible for a work upon which the work represented by the catalog record is based. This can be appropriate for adaptations, sequels, continuations, indexes, etc.',
  },
  bkp: {
    name: 'Book producer',
    description: 'Use for the person or firm responsible for the production of books and other print media, if specific codes (e.g., [bkd], [egr], [tyd], [prt]) are not desired.',
  },
  clb: {
    name: 'Collaborator',
    description: 'Use for a person or corporate body that takes a limited part in the elaboration of a work of another author or that brings complements (e.g., appendices, notes) to the work of another author.',
  },
  cmm: {
    name: 'Commentator',
    description: 'Use for a person who provides interpretation, analysis, or a discussion of the subject matter on a recording, motion picture, or other audiovisual medium. Compiler [com] Use for a person who produces a work or publication by selecting and putting together material from the works of various persons or bodies.',
  },
  dsr: {
    name: 'Designer',
    description: 'Use for a person or organization responsible for design if specific codes (e.g., [bkd], [tyd]) are not desired.',
  },
  edt: {
    name: 'Editor',
    description: 'Use for a person who prepares for publication a work not primarily his/her own, such as by elucidating text, adding introductory or other critical matter, or technically directing an editorial staff.',
  },
  ill: {
    name: 'Illustrator',
    description: 'Use for the person who conceives, and perhaps also implements, a design or illustration, usually to accompany a written text.',
  },
  lyr: {
    name: 'Lyricist',
    description: 'Use for the writer of the text of a song.',
  },
  mdc: {
    name: 'Metadata contact',
    description: 'Use for the person or organization primarily responsible for compiling and maintaining the original description of a metadata set (e.g., geospatial metadata set).',
  },
  mus: {
    name: 'Musician',
    description: 'Use for the person who performs music or contributes to the musical content of a work when it is not possible or desirable to identify the function more precisely.',
  },
  nrt: {
    name: 'Narrator',
    description: 'Use for the speaker who relates the particulars of an act, occurrence, or course of events.',
  },
  oth: {
    name: 'Other',
    description: 'Use for relator codes from other lists which have no equivalent in the MARC list or for terms which have not been assigned a code.',
  },
  pht: {
    name: 'Photographer',
    description: 'Use for the person or organization responsible for taking photographs, whether they are used in their original form or as reproductions.',
  },
  prt: {
    name: 'Printer',
    description: 'Use for the person or organization who prints texts, whether from type or plates.',
  },
  red: {
    name: 'Redactor',
    description: 'Use for a person who writes or develops the framework for an item without being intellectually responsible for its content.',
  },
  rev: {
    name: 'Reviewer',
    description: 'Use for a person or corporate body responsible for the review of book, motion picture, performance, etc.',
  },
  spn: {
    name: 'Sponsor',
    description: 'Use for the person or agency that issued a contract, or under whose auspices a work has been written, printed, published, etc.',
  },
  ths: {
    name: 'Thesis advisor',
    description: 'Use for the person under whose supervision a degree candidate develops and presents a thesis, memoir, or text of a dissertation.',
  },
  trc: {
    name: 'Transcriber',
    description: 'Use for a person who prepares a handwritten or typewritten copy from original material, including from dictated or orally recorded material.',
  },
  trl: {
    name: 'Translator',
    description: 'Use for a person who renders a text from one language into another, or from an older form of a language into the modern form.',
  },
};
