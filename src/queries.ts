
import { ProxyHandlerStatic } from "@comunica/actor-http-proxy";
import { QueryEngine } from "@comunica/query-sparql";
import { Bindings, BindingsStream } from "@comunica/types";

const engine = new QueryEngine();

const NUMBER_OF_RETRY_COUNTS = 2; 


export async function getPublicationFromFileContent(content: string): Promise<Bindings[]> {
    const bindingsStream: BindingsStream = await engine.queryBindings(`
        SELECT DISTINCT ?s ?p ?o 
        WHERE {
            ?s ?p ?o .
        }
    `, {
        sources: [{
            type: 'stringSource',
            value: content,
            mediaType: 'text/html',
            baseIRI: 'http://example.org/',
        }],
    })

    return bindingsStream.toArray();
}


export async function fetchDocument(publicationLink: string, proxy: string): Promise<Bindings[]> {
    const bindingsStream: BindingsStream = await engine.queryBindings(`
        SELECT DISTINCT ?s ?p ?o 
        WHERE {
            ?s ?p ?o .
        }
    `, {
        sources: [ publicationLink ],
        httpProxyHandler: new ProxyHandlerStatic(proxy)
    });
    
    return bindingsStream.toArray();
}
 

export function getBlueprintOfApplicationProfile() {
    const AP = "https://raw.githubusercontent.com/brechtvdv/demo-data/master/besluit-publicatie-SHACL.ttl";
    return new Promise((resolve, reject) => {
        try {
        const blueprint: any[] = [];
        engine.queryBindings(`
        PREFIX sh: <http://www.w3.org/ns/shacl#>
        PREFIX lblodBesluit: <http://lblod.data.gift/vocabularies/besluit/>
        SELECT DISTINCT ?classUri ?propertyUri ?className ?propertyName ?name ?niveau
        WHERE {
            {
                ?s sh:targetClass ?classUri .
                OPTIONAL {
                    ?s sh:name ?name .
                }
                OPTIONAL {
                    ?s lblodBesluit:maturiteitsniveau ?niveau .
                }
                }
                UNION
                {
                ?node sh:targetClass ?classUri ;
                        sh:property ?s ;
                        sh:name ?className .
                ?s sh:path ?propertyUri .
                OPTIONAL {
                    ?s sh:name ?propertyName .
                }
                OPTIONAL {
                    ?s lblodBesluit:maturiteitsniveau ?niveau .
                }
                BIND (concat(?className, ' - ', ?propertyName) AS ?name)
            }
        }
        `, {
            sources: [ AP ],
            httpRetryCount: NUMBER_OF_RETRY_COUNTS,
            httpRetryDelay: 2000,
            httpRetryOnServerError: true
        }).then(function (bindingsStream) {
            bindingsStream.on('data', function (data) {
                const v: any = {};
                v["propertyUri"] = data.get('propertyUri') ? data.get('propertyUri').value : "";
                v["classUri"] = data.get('classUri') ? data.get('classUri').value : "";
                v["propertyName"] = data.get('propertyName') ? data.get('propertyName').value : "";
                v["className"] = data.get('className') ? data.get('className').value : "";
                v["name"] = data.get('name') ? data.get('name').value : "";
                v["niveau"] = data.get('niveau') ? data.get('niveau').value : "";

                blueprint.push(v);
            });
            bindingsStream.on('end', function() {
                resolve(blueprint);
            });
            bindingsStream.on('error', function(error) {
                console.log(error);
                reject(error);
            });
        });
        } catch (e) {
            reject(e);
        }
    });
}

