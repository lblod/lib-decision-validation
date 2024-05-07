import * as fs from 'fs';

import { Bindings } from '@comunica/types';

import { determineDocumentType, validatePublication } from '../validation';
import { fetchDocument, getBlueprintOfDocumentType, getExampleOfDocumentType, getMaturityProperties, getPublicationFromFileContent } from '../queries';
import { enrichValidationResultWithExample } from '../examples';

import { Store, Quad, Term } from "n3";

import { getElementById, getElementsByTagName, getName } from 'domutils';

import { DOMNode, Element } from 'html-dom-parser';

//const PROXY = 'https://corsproxy.io/?';
const PROXY = '';

import { AGENDA_LINK, AGENDA_LINK_2, AGENDA_LINK_3, AGENDA_LINK_4, BESLUITEN_LINK, BESLUITEN_LINK2, NOTULEN_LINK, TESTHTMLSTRING, TESTSTRING2 } from './data/testData';
import { testResult } from './data/result-ex';

import { getDOMfromUrl, getStoreFromSPOBindings, runQueryOverStore } from '../utils';

const MILLISECONDS = 7000;

function ensureDirectoryExistence(directoryPath: string) {
  if (fs.existsSync(directoryPath)) {
    return true;
  }
  fs.mkdirSync(directoryPath);
}

describe('As a vendor, I want the tool to automatically determine the type of the document (agenda, besluitenlijst, notulen)', () => {
  beforeAll(() => {
    return ensureDirectoryExistence('src/tests/logs/');
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
    fs.writeFileSync('src/tests/logs/agenda.json', `${JSON.stringify(actual)}`);

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
  test('Get the blueprint for the corresponding document type', async () => {
    const expected = `${fs.readFileSync('src/tests/data/blueprint-besluitenlijst.json')}`;
    const documentType: string = 'Besluitenlijst';
    const actual = `${await getBlueprintOfDocumentType(documentType)}`;

    expect(actual).toBe(expected);
  });

  test.skip('Validate `Besluitenlijst', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Besluitenlijst');    
    const publication: Bindings[] = await fetchDocument(BESLUITEN_LINK, PROXY);
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/besluitenlijst.json', `${JSON.stringify(actual)}`);
  });

  test('Validate `Besluitenlijst 2', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Besluitenlijst');
    const publication: Bindings[] = await fetchDocument(
      BESLUITEN_LINK2,
      PROXY,
    );
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/besluitenlijst2.json', `${JSON.stringify(actual)}`);
  });

  test('Validate Agenda', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Agenda');
    const publication: Bindings[] =  await fetchDocument(AGENDA_LINK, PROXY);
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/agenda.json', `${JSON.stringify(actual)}`);
  });

  test('Validate Agenda 2', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Agenda');
    const publication: Bindings[] = await fetchDocument(
      AGENDA_LINK_2,
      PROXY,
    );
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/agenda2.json', `${JSON.stringify(actual)}`);
  });

  test('Validate Agenda 3', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Agenda');
    const publication: Bindings[] = await fetchDocument(
      AGENDA_LINK_4,
      PROXY,
    );
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/agenda3.json', `${JSON.stringify(actual)}`);
  });

  test('Validate Notulen', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Notulen');
    const publication: Bindings[] = await fetchDocument(NOTULEN_LINK, PROXY);
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/notulen.json', `${JSON.stringify(actual)}`);
  }, MILLISECONDS);

  test('Get the maturity level', async () => {
    const actual = await getMaturityProperties('Niveau 1');
    fs.writeFileSync('src/tests/logs/maturitylevel.json', `${JSON.stringify(actual)}`);
  });


});

describe('As a vendor, I want to see a good example when something is not valid', () => {
  beforeAll(() => {
    return ensureDirectoryExistence('src/tests/logs/');
  });

  test('retrieve example URL for document type', async () => {
    const expected: string = 'https://raw.githubusercontent.com/lblod/poc-decision-source-harvester/master/examples/notulen.html';
    const actual: string = getExampleURLOfDocumentType('Notulen');
    expect(actual).toBe(expected);
  });

  test('retrieve example as html', async () => {
    const exampleLink: string = getExampleURLOfDocumentType('Notulen');
    const exampleHtml = await getDOMfromUrl(exampleLink);

    const expected: string = 'html';
    const actual: Element[] = getElementsByTagName(expected, exampleHtml, true, 1);
    expect(actual.length).toBeGreaterThan(0);
  });

  test('retrieving first element by id of example is not null', async () => {
    const exampleLink: string = getExampleURLOfDocumentType('Notulen');
    const exampleHtml = await getDOMfromUrl(exampleLink);

    const actual: Element | null = getElementById('1', exampleHtml);
    //const actual: HTMLElement | null = exampleHtml.getElementById('1');
    expect(actual).not.toBeNull();
  });

  test('convert spo bindings into store', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Notulen');
    const store: Store = getStoreFromSPOBindings(blueprint);
    const firstBinding: Bindings = blueprint[0];
    const firstBindingAsQuad: Quad = new Quad(<Term>firstBinding.get('s'),<Term>firstBinding.get('p'), <Term>firstBinding.get('o'));
    
    const actual: boolean = store.has(firstBindingAsQuad)
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

  test('enrich results with examples', async () => {
    const publication: Bindings[] = await fetchDocument(AGENDA_LINK, PROXY);
    const documentType = determineDocumentType(publication);
    const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
    const example: DOMNode[] = await getExampleOfDocumentType('Notulen');

    const validationResult = await validatePublication(publication, blueprint);
    const enrichedResults = await enrichValidationResultWithExample(validationResult, blueprint, example);

    let containsExample = false;
    for(let r of enrichedResults) {
      for (let p of r.properties) {
        if (p.example) containsExample = true;
      }
    }
    expect(containsExample).toBeTruthy();
  }, MILLISECONDS);

  test('demonstrate enriched validation result', async () => {
    // Laatste college zitting Sint-Lievens-Houtem
    const publicationLink = 'https://lblod.sint-lievens-houtem.be/LBLODWeb/Home/Overzicht/9522f42bdd7b46b3d5341b3cf196c9b6c981703022796b7af6e29746193bbf52/GetPublication?filename=BesluitenLijst_College_11-04-2024.html';
    const proxy = '';

    const publication: Bindings[] = await fetchDocument(publicationLink, proxy);
    const documentType = determineDocumentType(publication);
    const blueprint: Bindings[] = await getBlueprintOfDocumentType(documentType);
    const validationResult = await validatePublication(publication, blueprint);

    // NEW: get example and enrich results with specific examples
    const example: DOMNode[] = await getExampleOfDocumentType(documentType);
    const enrichedResults = await enrichValidationResultWithExample(validationResult, blueprint, example);

    expect(enrichedResults.length).toBeGreaterThan(0);
    fs.writeFileSync('src/tests/logs/enrichedResults-demonstrator.json', `${JSON.stringify(enrichedResults)}`);
  }, MILLISECONDS*2);
});
