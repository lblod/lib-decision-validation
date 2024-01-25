
import * as fs from 'fs';
import { Bindings } from '@comunica/types';
import { determineDocumentType } from '../processMunicipality';
import { fetchDocument, getPublicationFromFileContent } from '../queries'; 

import { DOC_LINK, TESTHTMLSTRING } from './testData';
const proxy = "https://proxy.linkeddatafragments.org/";

describe('As a vendor, I want the tool to automatically determine the type of the document (agenda, besluitenlijst, notulen)', () => {
  // TODO: Find a better way to mock these documents
  // test.skip('fetch the data of the document through comunica', async () => {
  //   const expected: Bindings[] = TEST_DOC;
  //   const actual: Bindings[] = await fetchDocument(DOC_LINK, proxy);
  //   expect(actual.toString()).toBe(expected);
  // });

  test("determine the type of a document using a link to fetch the publication", async () => {
    const expected: string = "Besluitenlijst";
    const document: Bindings[] = await fetchDocument(DOC_LINK, proxy)
    const actual: string = await determineDocumentType(document);
    expect(actual).toBe(expected);
  });

  test('determine the type of a document using a string to fetch the document', async () => {
    const expected: string= "Besluitenlijst";
    const document = await getPublicationFromFileContent(TESTHTMLSTRING);
    const actual: string= await determineDocumentType(document)
    expect(actual).toBe(expected);
  });
});


describe('As a vendor, I want to upload a html document instead of a link', () => {
  // TODO: Find a better way to mock these documents
  // test.skip("parse the stringified html content through comunica", async () => {
  //   const expected: Bindings[] = TEST_DOC;
  //   const actual = await getPublicationFromFileContent(TESTHTMLSTRING);
  //   expect(actual.toString()).toBe(expected);
  // });
}) 
