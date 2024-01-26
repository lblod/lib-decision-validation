
import * as fs from 'fs';
import { Bindings } from '@comunica/types';
import { determineDocumentType } from '../processMunicipality';
import { fetchDocument, getPublicationFromFileContent } from '../queries'; 

import { AGENDA_LINK, DOC_LINK, NOTULEN_LINK, TESTHTMLSTRING, TESTSTRING2 } from './testData';
const proxy = "https://proxy.linkeddatafragments.org/";

describe('As a vendor, I want the tool to automatically determine the type of the document (agenda, besluitenlijst, notulen)', () => {
  test("determine the type of a document using a link to fetch the publication", async () => {
    const expected: string = "Besluitenlijst";

    const document: Bindings[] = await fetchDocument(
      DOC_LINK,
      proxy
    );
    const actual: string = await determineDocumentType(document);
    console.log(`VALUE ${actual}`);

    expect(actual).toBe(expected);
  });


  test("determine the type of a document using a link to fetch the publication", async () => {
    const expected: string = "Agenda";

    const document: Bindings[] = await fetchDocument(AGENDA_LINK, proxy);
    const actual: string = await determineDocumentType(document);
    console.log(`VALUE ${actual}`);

    expect(actual).toBe(expected);
  });


  test('determine the type of a document using a string to fetch the document', async () => {
    const expected: string= "Besluitenlijst";

    const document = await getPublicationFromFileContent(TESTHTMLSTRING);
    const actual: string= await determineDocumentType(document)
    console.log(`VALUE ${actual}`);
    expect(actual).toBe(expected);
  });

    test("determine the type of a document using a string to fetch the document", async () => {
      const expected: string = "unknown document type";

      const document = await getPublicationFromFileContent(TESTSTRING2);
      const actual: string = await determineDocumentType(document);
      console.log(`VALUE ${actual}`);
      expect(actual).toBe(expected);
    });
});
