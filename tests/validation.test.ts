import * as fs from 'fs';

import {inspect} from 'util';

import { Bindings } from '@comunica/types';

import HttpRequestMock from 'http-request-mock';

import { determineDocumentType, validatePublication, validateDocument } from '../src/validation';

import {
  fetchDocument,
  getBlueprintOfDocumentType,
  getExampleOfDocumentType,
  getExampleURLOfDocumentType,
  getPublicationFromFileContent,
  getBindingsFromTurtleContent,
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
  BESLUITEN_LINK3,
  BESLUITEN_LINK4,
  NOTULEN_LINK,
  NOTULEN_LINK_2,
  TESTHTMLSTRING,
  TESTSTRING2,
} from './data/testData';

import { genericExampleBlueprint, genericExampleData } from './data/genericTestData';

import { getDOMfromString, getStoreFromSPOBindings, runQueryOverStore } from '../src/utils';
import { ensureDirectoryExistence } from '../src/node-utils';
import { getHTMLExampleOfDocumentType } from 'lib-decision-shapes';
import { ValidatedProperty } from '../src/types';

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
      url: `${PROXY}${BESLUITEN_LINK3}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(BESLUITEN_LINK3)}`),
    });

    mocker.mock({
      url: `${PROXY}${BESLUITEN_LINK4}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(BESLUITEN_LINK4)}`),
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
    fs.writeFileSync('./logs/agenda-document.json', `${JSON.stringify(document)}`);
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
    // Add following line to update the expected blueprint
    // fs.writeFileSync('./logs/blueprint-Besluitenlijst.json', `${actual}`);

    expect(actual).toBe(expected);
  });

  test('Validate Besluitenlijst', async () => {
      const documentType: string = 'Besluitenlijst';
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const publication: Bindings[] = await fetchDocument(BESLUITEN_LINK, PROXY);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);

      const actual = await validatePublication(publication, blueprint, example);
    fs.writeFileSync('./logs/besluitenlijst.json', `${JSON.stringify(actual)}`);
  }, MILLISECONDS * 10);

  test('Validate Besluitenlijst 2', async () => {
      const documentType: string = 'Besluitenlijst';
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const publication: Bindings[] = await fetchDocument(BESLUITEN_LINK2, PROXY);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);

      const actual = await validatePublication(publication, blueprint, example);
    fs.writeFileSync('./logs/besluitenlijst2.json', `${JSON.stringify(actual)}`);
  }, MILLISECONDS * 5);

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
    MILLISECONDS * 20,
  );

  test(
    'Validate Notulen 2',
    async () => {
      const publication: Bindings[] = await fetchDocument(NOTULEN_LINK_2, PROXY);
      const documentType: string = determineDocumentType(publication);
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);

      const actual = await validatePublication(publication, blueprint, example);
      fs.writeFileSync('./logs/notulen2.json', `${JSON.stringify(actual)}`);
    },
    MILLISECONDS * 10,
  );

  test('Validate generic document', async () => {
    const document: Bindings[] = await getBindingsFromTurtleContent(genericExampleData);
    const blueprint: Bindings[] = await getBindingsFromTurtleContent(genericExampleBlueprint);

    const validationReport = await validateDocument(document, blueprint);

    const personClass = validationReport.classes.find((item) => item.classURI === 'http://xmlns.com/foaf/0.1/Person');

    const subject3 = validationReport.classes[0].objects.find((obj) => obj.uri === 'http://example.org/subject3');

    const nameProperty = subject3?.properties.find((prop) => prop.path === 'http://xmlns.com/foaf/0.1/name') as
      | ValidatedProperty
      | undefined;

    const ageProperty = subject3?.properties.find((prop) => prop.path === 'http://xmlns.com/foaf/0.1/age') as
      | ValidatedProperty
      | undefined;

    expect(personClass?.objects.length).toBe(3);
    expect(nameProperty?.valid).toBe(false);
    expect(ageProperty?.valid).toBe(true);
    expect(ageProperty?.valid).toBe(true);
  });

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
                
          ?s sh:property [
              sh:path ?path ;
              lblodBesluit:usageNote ?usageNote 
          ] .
        
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
    MILLISECONDS * 5,
  );

  test(
    'Zitting should have a value for isGehoudenDoor',
    async () => {
      const publication: Bindings[] = await fetchDocument(BESLUITEN_LINK3, PROXY);
      const documentType = determineDocumentType(publication);
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);
      const validationResult = await validatePublication(publication, blueprint, example);

      const zittingResult = validationResult.classes.find((r) => r.className === 'Zitting');
      let isGehoudenDoorValueFound = false;
      for(let o of zittingResult!.objects) {
        const isGehoudenDoorProperty = o.properties.find((p) => p.path === 'http://data.vlaanderen.be/ns/besluit#isGehoudenDoor');
        isGehoudenDoorValueFound = isGehoudenDoorProperty?.value != undefined && isGehoudenDoorProperty?.value.length > 0;
      }
      expect(isGehoudenDoorValueFound).toBeTruthy;
      fs.writeFileSync('./logs/isGehoudenDoor.json', `${JSON.stringify(validationResult)}`);
    },
    MILLISECONDS * 2,
  );
  test(
    'Zitting should have a value for heeftSecretaris',
    async () => {
      const publication: Bindings[] = await fetchDocument(BESLUITEN_LINK4, PROXY);
      const documentType = determineDocumentType(publication);
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);
      const validationResult = await validatePublication(publication, blueprint, example);

      const zittingResult = validationResult.classes.find((r) => r.className === 'Zitting');
      let valueFound = false;
      for(let o of zittingResult!.objects) {
        const foundProperty = o.properties.find((p) => p.path === 'http://data.vlaanderen.be/ns/besluit#heeftSecretaris');
        valueFound = foundProperty?.value != undefined && foundProperty?.value.length > 0;
      }
      expect(valueFound).toBeTruthy;
      fs.writeFileSync('./logs/heeftSecretaris.json', `${JSON.stringify(validationResult)}`);
    },
    MILLISECONDS * 2,
  );
  test(
    'Document should have a value for document type (notulen, besluitenlijst, agenda) and is not foaf:Document',
    async () => {
      const publication: Bindings[] = await fetchDocument(BESLUITEN_LINK4, PROXY);
      const documentType = determineDocumentType(publication);
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);
      const validationResult = await validatePublication(publication, blueprint, example);

      const result = validationResult.classes.find((r) => r.className === 'Document');
      let valueFound = false;
      for(let o of result!.objects) {
        const foundProperty = o.properties.find((p) => p.path === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
        valueFound = foundProperty?.value != undefined && foundProperty?.value.length > 0 && (foundProperty?.value as string[]).includes('https://data.vlaanderen.be/id/concept/BesluitDocumentType/8e791b27-7600-4577-b24e-c7c29e0eb773');
      }
      expect(valueFound).toBeTruthy;
      fs.writeFileSync('./logs/heeftDocumentType.json', `${JSON.stringify(validationResult)}`);
    },
    MILLISECONDS * 2,
  );
  test(
    'The shape of besluitenlijst should contain heeftOnderwerp',
    async () => {
      const blueprint: Bindings[] = await getBlueprintOfDocumentType("Besluitenlijst");
      expect(blueprint.toString().indexOf('heeftOnderwerp')).toBeGreaterThan(0);
  },
    MILLISECONDS * 2,
  );
 test(
    'The shape of besluitenlijst should contain geeftAanleidingTot',
    async () => {
      const blueprint: Bindings[] = await getBlueprintOfDocumentType("Besluitenlijst");
      expect(blueprint.toString().indexOf('geeftAanleidingTot')).toBeGreaterThan(0);
  },
    MILLISECONDS * 2,
  );
  test(
    'Location of a publication should be enriched with name and werkingsgebiedniveau',
    async () => {
      const publication: Bindings[] = await fetchDocument(NOTULEN_LINK_2, PROXY);
      const documentType = determineDocumentType(publication);
      const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
      const example: DOMNode[] = await getExampleOfDocumentType(documentType);
      const validationResult = await validatePublication(publication, blueprint, example);
      
      let naamIngevuld = false;
      let werkingsgebiedNiveauIngevuld = false;

      for (let c of validationResult.classes) {
        if(c.className === 'Location') {
          if (c.objects.length) {
            const firstObject = c.objects[0];
            for (let p of firstObject.properties) {
              if (p.name === 'naam' && p.value.length) naamIngevuld = true;
              if (p.name === 'werkingsgebiedNiveau' && p.value.length) werkingsgebiedNiveauIngevuld = true;
            }
          }
        }
      }

      expect(naamIngevuld).toBeTruthy;
      expect(werkingsgebiedNiveauIngevuld).toBeTruthy;
    },
    MILLISECONDS * 20);
});
