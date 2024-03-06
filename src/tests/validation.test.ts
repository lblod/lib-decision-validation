import * as fs from 'fs';

import { Bindings } from '@comunica/types';
import { determineDocumentType, validateGeneralConnection, validatePublication } from '../validation';
import { fetchDocument, getBlueprintOfDocumentType, getPublicationFromFileContent } from '../queries';

const PROXY = 'https://proxy.linkeddatafragments.org/';

import { AGENDA_LINK, BESLUITEN_LINK, NOTULEN_LINK, TESTHTMLSTRING, TESTSTRING2 } from './data/testData';
import { testResult } from './data/result-ex';

describe('As a vendor, I want the tool to automatically determine the type of the document (agenda, besluitenlijst, notulen)', () => {
  test('determine the type of a document using a link to fetch the publication', async () => {
    const expected: string = 'Besluitenlijst';
    const document: Bindings[] = await fetchDocument(
      `https://raadpleeg-aalst.onlinesmartcities.be/zittingen/20.0527.2714.7668/notulen`,
      PROXY,
    );
    const actual: string = await determineDocumentType(document);

    expect(actual).toBe(expected);
  });

  test('determine the type of a document using a link to fetch the publication', async () => {
    const expected: string = 'Agenda';
    const document: Bindings[] = await fetchDocument(AGENDA_LINK, PROXY);
    const actual: string = await determineDocumentType(document);

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
    const expected = `${fs.readFileSync('src/tests/data/blueprint.json')}`;
    const documentType: string = 'BesluitenLijst';
    const actual = `${await getBlueprintOfDocumentType(documentType)}`;

    expect(actual).toBe(expected);
  });

  // TODO: fix any types
  test('Validate the publication', async () => {
    const expected: any[] = testResult;
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('BesluitenLijst');
    const publication: Bindings[] = await fetchDocument(BESLUITEN_LINK, PROXY);
    const actual: any[] = await validatePublication(publication, blueprint);
    // fs.writeFileSync("resultaat.json", `${JSON.stringify(actual)}`)
    
    expect(actual).toStrictEqual(expected);
  });
  
  test.only('Shallom', async () => {
    const expected: any[] = testResult;
    const publication: Bindings[] = await fetchDocument(NOTULEN_LINK, PROXY);
    const actual = await validateGeneralConnection(publication);
    console.log(`shallom:  ${JSON.stringify(actual)}`);
    fs.writeFileSync('resultaat.json', `${JSON.stringify(publication)}`);

    expect(actual).toStrictEqual(expected);
  });
});
