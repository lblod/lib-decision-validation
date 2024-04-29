import * as fs from 'fs';

import { Bindings } from '@comunica/types';
import { determineDocumentType, validatePublication } from '../validation';
import { fetchDocument, getBlueprintOfDocumentType, getMaturityProperties, getPublicationFromFileContent } from '../queries';

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

  test('Validate `Besluitenlijst', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('BesluitenLijst');    
    const publication: Bindings[] = await fetchDocument("https://boutersem.meetingburger.net/gr/e58b6bf6-6e52-4ed5-b478-4866f39c96c3/agenda", PROXY);
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/besluitenlijst.json', `${JSON.stringify(actual)}`);
  });

  test.only('Validate Agenda', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Agenda');
    const publication: Bindings[] = await fetchDocument("https://raadpleeg-ham.onlinesmartcities.be/zittingen/23.1127.1873.5981/agenda", PROXY);
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/agenda.json', `${JSON.stringify(actual)}`);
  });

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


});
