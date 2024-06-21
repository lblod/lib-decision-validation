import * as fs from 'fs';

import { Bindings } from '@comunica/types';

import HttpRequestMock from 'http-request-mock';

import { determineDocumentType, validatePublication } from '../src/validation';
import {
  fetchDocument,
  getBlueprintOfDocumentType,
  getExampleOfDocumentType,
  getExampleURLOfDocumentType,
  getPublicationFromFileContent,
} from '../src/queries';

import { Store, Quad, Term } from 'n3';

import { getElementById, getElementsByTagName } from 'domutils';

import { DOMNode, Element } from 'html-dom-parser';

//const PROXY = 'https://corsproxy.io/?';
const PROXY = '';

import {
  AGENDA_LINK,
  AGENDA_LINK_2,
  AGENDA_LINK_3,
  AGENDA_LINK_4,
  BESLUITEN_LINK,
  BESLUITEN_LINK2,
  NOTULEN_LINK,
  TESTHTMLSTRING,
  TESTSTRING2,
} from './data/testData';
import { testResult } from './data/result-ex';

import { getDOMfromString, getStoreFromSPOBindings, runQueryOverStore } from '../src/utils';
import { ensureDirectoryExistence } from '../src/node-utils';
import { getHTMLExampleOfDocumentType } from 'lib-decision-shapes';

const MILLISECONDS = 7000;

describe('As a vendor, I want the tool to automatically determine the type of the document (agenda, besluitenlijst, notulen)', () => {
  beforeAll(() => {
    const mocker = HttpRequestMock.setup();

    mocker.mock({
      url: `${PROXY}${AGENDA_LINK}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(AGENDA_LINK)}`),
    });

    mocker.mock({
      url: `${PROXY}${AGENDA_LINK_2}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(AGENDA_LINK_2)}`),
    });

    mocker.mock({
      url: `${PROXY}${AGENDA_LINK_4}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(AGENDA_LINK_4)}`),
    });

    mocker.mock({
      url: `${PROXY}${BESLUITEN_LINK}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(BESLUITEN_LINK)}`),
    });

    mocker.mock({
      url: `${PROXY}${BESLUITEN_LINK2}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(BESLUITEN_LINK2)}`),
    });

    mocker.mock({
      url: `${PROXY}${NOTULEN_LINK}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(NOTULEN_LINK)}`),
    });
    return ensureDirectoryExistence('./logs/');
  });

  test('determine the type of a document using a link to fetch the publication', async () => {
    const expected: string = 'Besluitenlijst';
    const document: Bindings[] = await fetchDocument(BESLUITEN_LINK2, PROXY);
    const actual: string = await determineDocumentType(document);

    expect(actual).toBe(expected);
  });

  test('determine the type of a document using a link to fetch the publication', async () => {
    const expected: string = 'Agenda';
    const document: Bindings[] = await fetchDocument(AGENDA_LINK, PROXY);

    const actual: string = await determineDocumentType(document);
    fs.writeFileSync('./logs/agenda.json', `${JSON.stringify(actual)}`);

    expect(actual).toBe(expected);
  });

  test('determine the type of a document using a string to fetch the document', async () => {
    const expected: string = 'Besluitenlijst';
    const document = await getPublicationFromFileContent(TESTHTMLSTRING);
    const actual: string = await determineDocumentType(document);

    expect(actual).toBe(expected);
  });

  test('detect when the type of a document is unknown', async () => {
    const expected: string = 'unknown document type';
    const document = await getPublicationFromFileContent(TESTSTRING2);
    const actual: string = await determineDocumentType(document);

    expect(actual).toBe(expected);
  });

  // TODO: fix mock data
  test.skip('Get the blueprint for the corresponding document type', async () => {
    const expected = `${fs.readFileSync('tests/data/blueprint-Besluitenlijst.json')}`;
    const documentType: string = 'Besluitenlijst';
    const actual = `${await getBlueprintOfDocumentType(documentType)}`;
    // Add following line to up4date the expected blueprint
    // fs.writeFileSync('./logs/blueprint-Besluitenlijst.json', `${actual}`);

    expect(actual).toBe(expected);
  });

  test('Validate `Besluitenlijst', async () => {
      const documentType: string = 'Besluitenlijst';
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const publication: Bindings[] = await fetchDocument(BESLUITEN_LINK, PROXY);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);

      const actual = await validatePublication(publication, blueprint, example);
    fs.writeFileSync('./logs/besluitenlijst.json', `${JSON.stringify(actual)}`);
  }, 10000);

  test('Validate `Besluitenlijst 2', async () => {
      const documentType: string = 'Besluitenlijst';
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const publication: Bindings[] = await fetchDocument(BESLUITEN_LINK2, PROXY);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);

      const actual = await validatePublication(publication, blueprint, example);
    fs.writeFileSync('./logs/besluitenlijst2.json', `${JSON.stringify(actual)}`);
  });

  test('Validate Agenda', async () => {
      const documentType: string = 'Agenda';
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const publication: Bindings[] = await fetchDocument(AGENDA_LINK, PROXY);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);

      const actual = await validatePublication(publication, blueprint, example);
    fs.writeFileSync('./logs/agenda.json', `${JSON.stringify(actual)}`);
  });

  test('Validate Agenda 2', async () => {
      const documentType: string = 'Agenda';
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const publication: Bindings[] = await fetchDocument(AGENDA_LINK_3, PROXY);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);

      const actual = await validatePublication(publication, blueprint, example);
    fs.writeFileSync('./logs/agenda2.json', `${JSON.stringify(actual)}`);
  });

  test('Validate Agenda 3', async () => {
      const documentType: string = 'Agenda';
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const publication: Bindings[] = await fetchDocument(AGENDA_LINK_4, PROXY);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);

      const actual = await validatePublication(publication, blueprint, example);
    fs.writeFileSync('./logs/agenda3.json', `${JSON.stringify(actual)}`);
  });

  test(
    'Validate Notulen',
    async () => {
      const documentType: string = 'Notulen'
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const publication: Bindings[] = await fetchDocument(NOTULEN_LINK, PROXY);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);

      const actual = await validatePublication(publication, blueprint, example);
      fs.writeFileSync('./logs/notulen.json', `${JSON.stringify(actual)}`);
    },
    MILLISECONDS,
  );


});

describe('As a vendor, I want to see a good example when something is not valid', () => {
  beforeAll(() => {
    return ensureDirectoryExistence('./logs/');
  });

  test('retrieve example URL for document type', async () => {
    const expected: string = 'https://raw.githubusercontent.com/lblod/lib-decision-shapes/master/examples/notulen.html';
    const actual: string = getExampleURLOfDocumentType('Notulen');
    expect(actual).toBe(expected);
  });

  test('retrieve example as html', async () => {
    const exampleLink: string = getHTMLExampleOfDocumentType('Notulen');
    const exampleHtml = getDOMfromString(exampleLink);

    const expected: string = 'html';
    const actual: Element[] = getElementsByTagName(expected, exampleHtml, true, 1);
    expect(actual.length).toBeGreaterThan(0);
  });

  test('retrieving first element by id of example is not null', async () => {
    const exampleHtml: DOMNode[] = getExampleOfDocumentType('Notulen');

    const actual: Element | null = getElementById('1', exampleHtml);
    //const actual: HTMLElement | null = exampleHtml.getElementById('1');
    expect(actual).not.toBeNull();
  });

  test('convert spo bindings into store', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Notulen');
    const store: Store = getStoreFromSPOBindings(blueprint);
    const firstBinding: Bindings = blueprint[0];
    const firstBindingAsQuad: Quad = new Quad(
      <Term>firstBinding.get('s'),
      <Term>firstBinding.get('p'),
      <Term>firstBinding.get('o'),
    );

    const actual: boolean = store.has(firstBindingAsQuad);
    expect(actual).toBeTruthy();
  });

  test('run a SPARQL query over a store', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Notulen');
    const store: Store = getStoreFromSPOBindings(blueprint);
    const query = 'SELECT ?s ?p ?o WHERE { ?s ?p ?o . } LIMIT 1';

    const actual = (await runQueryOverStore(query, store)).length;
    expect(actual).toBe(1);
  });

  test('retrieve targetClass, property path and usage note with SPARQL', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Notulen');
    const store: Store = getStoreFromSPOBindings(blueprint);
    const query = `
      PREFIX sh: <http://www.w3.org/ns/shacl#>
      PREFIX lblodBesluit: <http://lblod.data.gift/vocabularies/besluit/>
      
      SELECT ?targetClass ?path ?usageNote
      WHERE {
          ?s a sh:NodeShape ;
            sh:targetClass ?targetClass .
        
        # Simple property path
        {
          ?s sh:property [
              sh:path ?path ;
              lblodBesluit:usageNote ?usageNote 
          ] .
        } 
        UNION
        # list of alternative property paths
        {
          ?s sh:property [
              sh:path/sh:alternativePath/(rdf:first|rdf:rest)* ?path ;
              lblodBesluit:usageNote ?usageNote
          ] .
          FILTER(?path NOT IN (rdf:nil))
        }
        
        FILTER (!isBlank(?path))
      }
    `;

    const actual = await runQueryOverStore(query, store);

    expect(actual.length).toBeGreaterThan(0);
    expect(actual[0].has('targetClass')).toBeTruthy();
    expect(actual[0].has('path')).toBeTruthy();
    expect(actual[0].has('usageNote')).toBeTruthy();
    expect(actual[0].has('usageNote')).not.toEqual('');
  });

  test(
    'enrich results with examples',
    async () => {
      const publication: Bindings[] = await fetchDocument(AGENDA_LINK, PROXY);
      const documentType = determineDocumentType(publication);
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const example: DOMNode[] = getExampleOfDocumentType('Notulen');

      const validationResult = await validatePublication(publication, blueprint, example);
      const enrichedResults = validationResult.classes;

      let containsExample = false;
      for (let r of enrichedResults) {
        for (let o of r.objects) {
          for (let p of o.properties) {
            if (p.example) containsExample = true;
          }
        }
      }
      expect(containsExample).toBeTruthy();
    },
    MILLISECONDS,
  );

  test(
    'demonstrate enriched validation result',
    async () => {
      // Laatste college zitting Sint-Lievens-Houtem
      const publicationLink =
        'https://lblod.sint-lievens-houtem.be/LBLODWeb/Home/Overzicht/9522f42bdd7b46b3d5341b3cf196c9b6c981703022796b7af6e29746193bbf52/GetPublication?filename=BesluitenLijst_College_11-04-2024.html';
      const proxy = '';

      const publication: Bindings[] = await fetchDocument(publicationLink, proxy);
      const documentType = determineDocumentType(publication);
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);
      const validationResult = await validatePublication(publication, blueprint, example);

      // NEW: get example and enrich results with specific examples
      const enrichedResults = validationResult.classes;

      expect(enrichedResults.length).toBeGreaterThan(0);
      fs.writeFileSync('./logs/enrichedResults-demonstrator.json', `${JSON.stringify(enrichedResults)}`);
    },
    MILLISECONDS * 2,
  );
});
