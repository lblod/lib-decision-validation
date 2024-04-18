import * as fs from 'fs';

import { Bindings } from '@comunica/types';
import { checkMaturity, determineDocumentType, validatePublication } from '../validation';
import { fetchDocument, getBlueprintOfDocumentType, getMaturityProperties, getPublicationFromFileContent, glue } from '../queries';

const PROXY = 'https://corsproxy.io/?';

import { AGENDA_LINK, AGENDA_LINK_2, BESLUITEN_LINK, NOTULEN_LINK, TESTHTMLSTRING, TESTSTRING2 } from './data/testData';
import { testResult } from './data/result-ex';

describe('As a vendor, I want the tool to automatically determine the type of the document (agenda, besluitenlijst, notulen)', () => {
  test.skip('determine the type of a document using a link to fetch the publication', async () => {
    const expected: string = 'Besluitenlijst';
    const document: Bindings[] = await fetchDocument(BESLUITEN_LINK, PROXY);
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
  test.skip('Validate Besluitenlijst', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Besluitenlijst');
    const publication: Bindings[] = await fetchDocument(BESLUITEN_LINK, PROXY);
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/besluitenlijst.json', `${JSON.stringify(actual)}`);
  });

  // TODO: fix any types
  test('Validate Agenda', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Agenda');
    const publication: Bindings[] = await fetchDocument(AGENDA_LINK, PROXY);
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/agenda.json', `${JSON.stringify(actual)}`);
  });

  // TODO: fix any types
  test('Validate Agenda', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Agenda');
    const publication: Bindings[] = await fetchDocument(AGENDA_LINK_2, PROXY);
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/agenda2.json', `${JSON.stringify(actual)}`);
  });

  test('Validate Notulen', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Notulen');
    const publication: Bindings[] = await fetchDocument(NOTULEN_LINK, PROXY);
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/notulen.json', `${JSON.stringify(actual)}`);
  });

  test('Get the maturity level', async () => {
    const actual = await getMaturityProperties('Niveau 1');
    fs.writeFileSync('src/tests/logs/maturitylevel.json', `${JSON.stringify(actual)}`);
  });

  test.skip('Get the maturity level', async () => {
    const expected: any[] = testResult;

    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Notulen');
    const publication: Bindings[] = await fetchDocument(NOTULEN_LINK, PROXY);
    const result: any = await validatePublication(publication, blueprint);

    const properties = await getMaturityProperties('Niveau 3');
    const actual = checkMaturity(result, properties);

    fs.writeFileSync('src/tests/logs/getMaturityLevel.json', `${JSON.stringify(actual)}`);
    expect(actual).toStrictEqual(expected);
  });
});
