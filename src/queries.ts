import { ProxyHandlerStatic } from '@comunica/actor-http-proxy';
import { QueryEngine } from '@comunica/query-sparql';
import { Bindings, BindingsStream } from '@comunica/types';
import { DocumentType } from './types';
const { getHTMLExampleOfDocumentType, getShapeOfDocumentType } = require('lib-decision-shapes');
import { getDOMfromString } from './utils';
import { DOMNode } from 'html-dom-parser';

export * from './queries';

const engine = new QueryEngine();

export async function getPublicationFromFileContent(content: string): Promise<Bindings[]> {
  const bindingsStream: BindingsStream = await engine.queryBindings(
    `
        SELECT ?s ?p ?o 
        WHERE {
            ?s ?p ?o .
        }
    `,
    {
      sources: [
        {
          type: 'serialized',
          value: content,
          mediaType: 'text/html',
          baseIRI: 'http://example.org/',
        },
      ],
    },
  );

  return bindingsStream.toArray();
}

export async function getBindingsFromTurtleContent(content: string): Promise<Bindings[]> {
  console.log('get bindings');
  const bindingsStream: BindingsStream = await engine.queryBindings(
    `
      SELECT ?s ?p ?o
      WHERE {
        ?s ?p ?o .
      }
    `,
    {
      sources: [
        {
          type: 'serialized',
          value: content,
          mediaType: 'text/turtle',
          baseIRI: 'http://example.org/',
        },
      ],
    },
  );

  return bindingsStream.toArray();
}

export async function fetchDocument(publicationLink: string, proxy?: string): Promise<Bindings[]> {
  let proxyHandler;
  if (proxy) proxyHandler = new ProxyHandlerStatic(proxy);

  const bindingsStream: BindingsStream = await engine.queryBindings(
    `
        SELECT ?s ?p ?o 
        WHERE {
            ?s ?p ?o .
        }
    `,
    {
      sources: [publicationLink],
      httpProxyHandler: proxyHandler,
    },
  );
  return bindingsStream.toArray();
}

export async function getBlueprintOfDocumentType(documentType: string): Promise<Bindings[]> {
  const shape = getShapeOfDocumentType(documentType);

  const bindingsStream: BindingsStream = await engine.queryBindings(
    `
        SELECT ?s ?p ?o 
        WHERE {
            ?s ?p ?o .
        }    
        `,
    {
      sources: [
        {
          type: 'serialized',
          value: shape,
          mediaType: 'text/turtle',
          baseIRI: 'http://example.org/',
        },
      ],
    },
  );
  return bindingsStream.toArray();
}

export function getDocumentTypes(): DocumentType[] {
  return [
    {
      id: 'https://data.vlaanderen.be/id/concept/BesluitDocumentType/8e791b27-7600-4577-b24e-c7c29e0eb773',
      label: 'Notulen',
    },
    {
      id: 'https://data.vlaanderen.be/id/concept/BesluitDocumentType/3fa67785-ffdc-4b30-8880-2b99d97b4dee',
      label: 'Besluitenlijst',
    },
    {
      id: 'https://data.vlaanderen.be/id/concept/BesluitDocumentType/13fefad6-a9d6-4025-83b5-e4cbee3a8965',
      label: 'Agenda',
    },
  ];
}

export function getExampleURLOfDocumentType(documentType: string): string {
  const HOST = 'https://raw.githubusercontent.com/lblod/lib-decision-shapes/master/examples/';

  const exampleLink = {
    Notulen: HOST + 'notulen.html',
    Besluitenlijst: HOST + 'decision-list.html',
    Agenda: HOST + 'basic-agenda.html',
  };

  return exampleLink[documentType];
}

export function getExampleOfDocumentType(documentType: string): DOMNode[] {
  const example: string = getHTMLExampleOfDocumentType(documentType);
  return getDOMfromString(example);
}
