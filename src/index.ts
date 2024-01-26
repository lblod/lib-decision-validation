/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryEngine } from "@comunica/query-sparql";
const engine = new QueryEngine();
import { ProxyHandlerStatic } from "@comunica/actor-http-proxy";


import * as fs from "fs";
import { Bindings, BindingsStream } from "@comunica/types";


/* function to validate a publication 
  param:
  - publication: object to be validated
  returns:
  - one of the following valuesL: [besluitenlijst, notulen, agenda]

*/
export function determineDocumentType(bindings: Bindings[]): string {
  // Look for document type predicate if it is present
  for(const b of bindings) {
    if(b.get('p')!.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" &&
    b.get('o')!.value.includes("https://data.vlaanderen.be/id/concept/BesluitDocumentType/")) {
      switch(b.get("o")!.value) {
        case "https://data.vlaanderen.be/id/concept/BesluitDocumentType/8e791b27-7600-4577-b24e-c7c29e0eb773": {
          return "Notule";
        }
        case "https://data.vlaanderen.be/id/concept/BesluitDocumentType/3fa67785-ffdc-4b30-8880-2b99d97b4dee": {
          return "Besluitenlijst";
        }
        case 'https://data.vlaanderen.be/id/concept/BesluitDocumentType/13fefad6-a9d6-4025-83b5-e4cbee3a8965': {
          return "Agenda"
        }
      }
    }
  }
  return "unknown document type"
}



export async function getPublicationFromFileContent(
  content: string
): Promise<Bindings[]> {
  const bindingsStream: BindingsStream = await engine.queryBindings(
    `
        SELECT DISTINCT ?s ?p ?o 
        WHERE {
            ?s ?p ?o .
        }
    `,
    {
      sources: [
        {
          type: "stringSource",
          value: content,
          mediaType: "text/html",
          baseIRI: "http://example.org/",
        },
      ],
    }
  );

  return bindingsStream.toArray();
}

export async function fetchDocument(
  publicationLink: string,
  proxy: string
): Promise<Bindings[]> {
  const bindingsStream: BindingsStream = await engine.queryBindings(
    `
        SELECT DISTINCT ?s ?p ?o 
        WHERE {
            ?s ?p ?o .
        }
    `,
    {
      sources: [publicationLink],
      httpProxyHandler: new ProxyHandlerStatic(proxy),
    }
  );

  return bindingsStream.toArray();
}
 
