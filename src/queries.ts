import { ProxyHandlerStatic } from '@comunica/actor-http-proxy';
import { QueryEngine } from '@comunica/query-sparql';
import { Bindings, BindingsStream } from '@comunica/types';

const engine = new QueryEngine();

const NUMBER_OF_RETRY_COUNTS = 2;
const proxy = 'https://corsproxy.io/? ';
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

export async function fetchDocument(publicationLink: string, proxyOveride?: string): Promise<Bindings[]> {
  const bindingsStream: BindingsStream = await engine.queryBindings(
    `
        SELECT ?s ?p ?o 
        WHERE {
            ?s ?p ?o .
        }
    `,
    {
      sources: [publicationLink],
      ...(proxyOveride
        ? { httpProxyHandler: new ProxyHandlerStatic(proxyOveride) }
        : {
            httpProxyHandler: new ProxyHandlerStatic(proxy),
          }),
    },
  );
  return bindingsStream.toArray();
}

export async function getBlueprintOfDocumentType(documentType: string): Promise<Bindings[]> {
  const blueprintLink: any = {
    Notulen: 'https://raw.githubusercontent.com/lblod/notulen-prepublish-service/master/test/shapes/meeting.ttl',
    BesluitenLijst:
      'https://raw.githubusercontent.com/lblod/notulen-prepublish-service/master/test/shapes/decision-list.ttl',
    Agenda: 'https://raw.githubusercontent.com/lblod/notulen-prepublish-service/master/test/shapes/basic-agenda.ttl',
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

export function getBlueprintOfApplicationProfile() {
  const AP = 'https://raw.githubusercontent.com/lblod/notulen-prepublish-service/master/test/shapes/basic-agenda.ttl';
  return new Promise((resolve, reject) => {
    try {
      const blueprint: any[] = [];
      engine
        .queryBindings(
          `
            SELECT ?s ?p ?o 
            WHERE {
                ?s ?p ?o .
            }    
        `,
          {
            sources: [AP],
            httpRetryCount: NUMBER_OF_RETRY_COUNTS,
            httpRetryDelay: 2000,
            httpRetryOnServerError: true,
          },
        )
        .then(function (bindingsStream) {
          bindingsStream.on('data', function (data) {
            const v: any = {};
            v['propertyUri'] = data.get('propertyUri') ? data.get('propertyUri').value : '';
            v['classUri'] = data.get('classUri') ? data.get('classUri').value : '';
            v['propertyName'] = data.get('propertyName') ? data.get('propertyName').value : '';
            v['className'] = data.get('className') ? data.get('className').value : '';
            v['name'] = data.get('name') ? data.get('name').value : '';
            v['niveau'] = data.get('niveau') ? data.get('niveau').value : '';

            blueprint.push(v);
          });
          bindingsStream.on('end', function () {
            resolve(blueprint);
          });
          bindingsStream.on('error', function (error) {
            console.log(error);
            reject(error);
          });
        });
    } catch (e) {
      reject(e);
    }
  });
}

export async function getMaturityProperties(maturityLevel: string) {
  const source: string =
    'https://raw.githubusercontent.com/snenenenenenene/validation-monitoring-module/master/files/notulen.ttl';

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
