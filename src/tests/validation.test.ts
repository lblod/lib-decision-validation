import * as fs from 'fs';

import { Bindings } from '@comunica/types';
import { determineDocumentType, validatePublication } from '../validation';
import { fetchDocument, getBlueprintOfDocumentType, getMaturityProperties, getPublicationFromFileContent } from '../queries';

const PROXY = 'https://corsproxy.io/?';

import { AGENDA_LINK, AGENDA_LINK_2, BESLUITEN_LINK, BESLUITEN_LINK2, NOTULEN_LINK, TESTHTMLSTRING, TESTSTRING2 } from './data/testData';
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
    const document: Bindings[] = await fetchDocument("https://validation-monitoring-tool-git-fix-c-397055-senne-bels-projects.vercel.app/validation-results?documentType=Agenda&url=https%3A%2F%2Fpublicatie.gelinkt-notuleren.vlaanderen.be%2FEssen%2FGemeente%2Fzittingen%2Fa3c147f0-905f-11ee-ae1d-77c537c8924c%2Fagenda", PROXY);

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
    const expected = `${fs.readFileSync('src/tests/data/blueprint.json')}`;
    const documentType: string = 'BesluitenLijst';
    const actual = `${await getBlueprintOfDocumentType(documentType)}`;

    expect(actual).toBe(expected);
  });

  test('Validate `Besluitenlijst', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('BesluitenLijst');    
    const publication: Bindings[] = await fetchDocument(BESLUITEN_LINK, PROXY);
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/besluitenlijst.json', `${JSON.stringify(actual)}`);
  });

  test.only('Validate `Besluitenlijst', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('BesluitenLijst');
    const publication: Bindings[] = await fetchDocument(
      BESLUITEN_LINK2,
      PROXY,
    );
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/besluitenlijst2.json', `${JSON.stringify(actual)}`);
  });

  test('Validate Agenda', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Agenda');
    const publication: Bindings[] = await fetchDocument(
      'https://publicatie.gelinkt-notuleren.vlaanderen.be/Essen/Gemeente/zittingen/a3c147f0-905f-11ee-ae1d-77c537c8924c/agenda',
      PROXY,
    );
    const actual = await validatePublication(publication, blueprint);
    fs.writeFileSync('src/tests/logs/agenda.json', `${JSON.stringify(actual)}`);
  });

  test('Validate Agenda', async () => {
    const blueprint: Bindings[] = await getBlueprintOfDocumentType('Agenda');
    const publication: Bindings[] = await fetchDocument(
      'https://anzegem-echo.cipalschaubroeck.be/raadpleegomgeving/zittingen/ddc7b84d-1314-48e0-a3a7-110c116d3e7e/agenda',
      PROXY,
    );
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
