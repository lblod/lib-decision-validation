
import * as fs from 'fs';
import { Bindings } from '@comunica/types';
import { determineDocumentType, validatePublication } from '../processMunicipality';
import { fetchDocument, getBlueprintOfDocumentType, getPublicationFromFileContent } from '../queries'; 

import { AGENDA_LINK, DOC_LINK, NOTULEN_LINK, TESTHTMLSTRING, TESTSTRING2 } from './testData';
const PROXY = "https://proxy.linkeddatafragments.org/";




describe('As a vendor, I want the tool to automatically determine the type of the document (agenda, besluitenlijst, notulen)', () => {
  test("determine the type of a document using a link to fetch the publication", async () => {
    const expected: string = "Besluitenlijst";

    const document: Bindings[] = await fetchDocument(
      DOC_LINK,
      PROXY
    );
    const actual: string = await determineDocumentType(document);
    console.log(`VALUE ${document}`);
    fs.writeFileSync("decision-list-ex.json", `${document}` )
    expect(actual).toBe(expected);
  });


  test("determine the type of a document using a link to fetch the publication", async () => {
    const expected: string = "Agenda";

    const document: Bindings[] = await fetchDocument(AGENDA_LINK, PROXY);
    const actual: string = await determineDocumentType(document);

    expect(actual).toBe(expected);
  });


  test("determine the type of a document using a string to fetch the document", async () => {
    const expected: string= "Besluitenlijst";

    const document = await getPublicationFromFileContent(TESTHTMLSTRING);
    const actual: string= await determineDocumentType(document)
    expect(actual).toBe(expected);
  });

  test("detect when the type of a document is unknown", async () => {
    const expected: string = "unknown document type";

    const document = await getPublicationFromFileContent(TESTSTRING2);
    const actual: string = await determineDocumentType(document);
    expect(actual).toBe(expected);
  });
  
  test("Get the blueprint for the corresponding document type", async () => {
      const expected: string = "blueprint for document type";

      const documentType: string = "BesluitenLijst"
      const actual = await getBlueprintOfDocumentType(documentType);
      // console.log(`VALUE ${actual}`);
      expect(actual).toBe(expected);
  })

  test.only("Validate the publication", async () => {
    const expected: string = "blueprint for document type";

    const blueprint: Bindings[]= await getBlueprintOfDocumentType("BesluitenLijst");
    const publication: Bindings[]= await fetchDocument(DOC_LINK, PROXY);
    const actual = await validatePublication(publication, blueprint);
    // console.log(`VALUE ${actual}`);
    expect(actual).toBe(expected);
  });

  
});
