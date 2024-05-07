import { ProxyHandlerStatic } from '@comunica/actor-http-proxy';
import { QueryEngine } from '@comunica/query-sparql';
import { Bindings, BindingsStream } from '@comunica/types';

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
          type: 'stringSource',
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
  const blueprintLink = {
    Notulen: 'https://raw.githubusercontent.com/lblod/validation-monitoring-module/fix/tests/files/notulen.ttl',
    Besluitenlijst:
      'https://raw.githubusercontent.com/lblod/poc-decision-source-harvester/master/shapes/decision-list.ttl',
    Agenda: 'https://raw.githubusercontent.com/lblod/poc-decision-source-harvester/master/shapes/basic-agenda.ttl',
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
    'https://raw.githubusercontent.com/lblod/validation-monitoring-module/master/files/notulen.ttl';

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
