import { ProxyHandlerStatic } from '@comunica/actor-http-proxy';
import { QueryEngine } from '@comunica/query-sparql';
import { Bindings, BindingsStream } from '@comunica/types';
import { DocumentType } from './types';
import { getDOMfromUrl } from './utils';
import { DOMNode } from 'html-dom-parser';

export * from './queries';

const engine = new QueryEngine();

const default_proxy = 'https://corsproxy.io/?';

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


export async function fetchDocument(publicationLink: string, proxy: string = default_proxy): Promise<Bindings[]> {
  const bindingsStream: BindingsStream = await engine.queryBindings(
    `
        SELECT ?s ?p ?o 
        WHERE {
            ?s ?p ?o .
        }
    `,
    {
      sources: [publicationLink],
      httpProxyHandler: new ProxyHandlerStatic(proxy),
    },
  );
  return bindingsStream.toArray();
}

export async function getBlueprintOfDocumentType(documentType: string): Promise<Bindings[]> {
  const HOST = 'https://raw.githubusercontent.com/lblod/poc-decision-source-harvester/master/shapes/';
  const blueprintLink = {
    Notulen: HOST + 'notulen.ttl',
    Besluitenlijst: HOST + 'decision-list.ttl',
    Agenda: HOST + 'basic-agenda.ttl'
  };
  
  const bindingsStream: BindingsStream = await engine.queryBindings(
    `
        SELECT ?s ?p ?o 
        WHERE {
            ?s ?p ?o .
        }    
        `,
    {
      sources: [blueprintLink[documentType]],
    },
  );
  return bindingsStream.toArray();
}

// TODO: review and update
export async function getMaturityProperties(maturityLevel: string): Promise<Bindings[]> {
  const source: string =
  'https://raw.githubusercontent.com/lblod/poc-decision-source-harvester/master/shapes/notulen.ttl';

  const bindingsStream: BindingsStream = await engine.queryBindings(
    `
      PREFIX lblodBesluit: <http://lblod.data.gift/vocabularies/besluit/>
      PREFIX sh: <http://www.w3.org/ns/shacl#>
      SELECT ?path
      WHERE {
          ?s lblodBesluit:maturiteitsniveau "${maturityLevel}" ;
            sh:path ?path .
      }    
      `,
    {
      sources: [source],
    },
  );

  return bindingsStream.toArray();
}

export function getDocumentTypes(): DocumentType[] {
  return [
    {
      id: 'https://data.vlaanderen.be/id/concept/BesluitDocumentType/8e791b27-7600-4577-b24e-c7c29e0eb773',
      label: 'Notulen'
    },
    {
      id: 'https://data.vlaanderen.be/id/concept/BesluitDocumentType/3fa67785-ffdc-4b30-8880-2b99d97b4dee',
      label: 'Besluitenlijst'
    },
    {
      id: 'https://data.vlaanderen.be/id/concept/BesluitDocumentType/13fefad6-a9d6-4025-83b5-e4cbee3a8965',
      label: 'Agenda'
    }
  ];
}

export function getExampleURLOfDocumentType(documentType: string): string {
  const HOST = 'https://raw.githubusercontent.com/lblod/poc-decision-source-harvester/master/examples/';

  const exampleLink = {
    Notulen: HOST + 'notulen.html',
    Besluitenlijst: HOST + 'decision-list.html',
    Agenda: HOST + 'basic-agenda.html'
  };
  
  return exampleLink[documentType];
}

export async function getExampleOfDocumentType(documentType: string): Promise<DOMNode[]> {
  const exampleLink: string = getExampleURLOfDocumentType(documentType);
  return await getDOMfromUrl(exampleLink);
}