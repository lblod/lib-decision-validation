import { ProxyHandlerStatic } from '@comunica/actor-http-proxy';
import { QueryEngine } from '@comunica/query-sparql';
import { Bindings, BindingsStream } from '@comunica/types';

export * from './queries';

const engine = new QueryEngine();

const NUMBER_OF_RETRY_COUNTS = 2;
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

export function getBlueprintOfApplicationProfile(): Promise<Bindings[]> {
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

 export async function glue(publication: string) {
  const bindingsStream: BindingsStream = await engine.queryBindings(
    `
PREFIX eli: <http://data.europa.eu/eli/ontology#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX mandaat: <http://data.vlaanderen.be/ns/mandaat#>

select DISTINCT ?storyAgendapuntGevonden ?storyAgendapuntBeschrijving ?storyAgendapuntTitel ?storyAgendapuntVerbondenMetZitting ?storyAgendapuntVerbondenMetZittingMetTijd ?storyAgendapuntVerbondenMetBestuursorgaanInBestuursperiode ?storyBehandelingVanAgendapuntGevonden ?storyBehandelingVanAgendapuntOpenbaar ?storyAgendapuntVerbondenMetBesluit ?storyBesluitTitelBeschrijvingEnInhoud ?storyArtikelTitelBeschrijvingEnInhoud ?storyBehandelingVanAgendapuntVerbondenMetStemming ?storyStemmingMetVoorstanders ?storyStemmingMetTegenstanders ?storyStemmingMetOnthouders

where {
  ?agendapunt a besluit:Agendapunt .
  BIND (concat("agendapunt gevonden met URI: ", str(?agendapunt)) as ?storyAgendapuntGevonden)
      
  OPTIONAL {
    ?agendapunt <http://purl.org/dc/terms/description> ?agendapuntBeschrijving .
  }
  BIND (if(bound(?agendapuntBeschrijving), concat("met als beschrijving: ",?agendapuntBeschrijving), "agendapuntbeschrijving niet gevonden") as ?storyAgendapuntBeschrijving)

  OPTIONAL {
    ?agendapunt <http://purl.org/dc/terms/title> ?agendapuntTitel .
  }
  BIND (if(bound(?agendapuntTitel), concat("met als titel: ",?agendapuntTitel), "agendapunttitel niet gevonden") as ?storyAgendapuntTitel)

  OPTIONAL {
  ?zitting a besluit:Zitting ;
           besluit:behandelt ?agendapunt .
  }
  BIND (if(bound(?zitting), concat("verbonden met Zitting met als URI: ", str(?zitting)), "niet verbonden met zitting") as ?storyAgendapuntVerbondenMetZitting)
  
  OPTIONAL {
    ?zitting a besluit:Zitting ;
           besluit:behandelt ?agendapunt ;
           besluit:geplandeStart ?geplandeStart .
    OPTIONAL {
      ?zitting <http://www.w3.org/ns/prov#startedAtTime> ?start ;
        <http://www.w3.org/ns/prov#endedAtTime> ?einde .
    }
  }
  BIND (if(bound(?zitting), concat("verbonden met Zitting gepland op ", str(?geplandeStart), if(bound(?start), concat(" en vond plaats tussen ", str(?start), " en " , str(?einde)), " en is nog niet gestart")), "is niet verbonden met zitting met geplande start") as ?storyAgendapuntVerbondenMetZittingMetTijd)
  
  OPTIONAL {
    ?zitting a besluit:Zitting ;
           besluit:behandelt ?agendapunt ;
           besluit:isGehoudenDoor ?bestuursorgaan .
    ?bestuursorgaan generiek:isTijdspecialisatieVan|mandaat:isTijdspecialisatieVan ?bestuursorgaanZonderTijd .
    
    ?bestuursorgaanZonderTijd skos:prefLabel ?bestuursorgaanNaam .
           #  <http://www.w3.org/ns/org#classification>/skos:prefLabel ?bestuursorgaanClassificatie .
  }
  BIND (if(bound(?bestuursorgaanZonderTijd), concat("verbonden met bestuursorgaan (in bestuursperiode) ", ?bestuursorgaanNaam), "niet verbonden met bestuursorgaan (in bestuursperiode)") as ?storyAgendapuntVerbondenMetBestuursorgaanInBestuursperiode)
  
  OPTIONAL {
   ?behandelingVanAgendapunt a besluit:BehandelingVanAgendapunt ;
                             dcterms:subject ?agendapunt . 
    OPTIONAL {
     ?behandelingVanAgendapunt besluit:openbaar ?openbaar . 
    }
  }
  
  BIND (if(bound(?behandelingVanAgendapunt), concat("verbonden met behandeling van agendapunt met URI: ", str(?behandelingVanAgendapunt)), "Niet verbonden met behandeling van agendapunt") as ?storyBehandelingVanAgendapuntGevonden)
  BIND (if(bound(?openbaar), concat("behandeling van agendapunt - openbaar: ", str(?openbaar)), "behandeling van agendapunt - openbaar: niet gevonden") as ?storyBehandelingVanAgendapuntOpenbaar)
  
  OPTIONAL {
   	?behandelingVanAgendapunt a besluit:BehandelingVanAgendapunt ;
                             dcterms:subject ?agendapunt .
    ?besluit a besluit:Besluit .
    {
      ?behandelingVanAgendapunt prov:generated ?besluit .
    } 
    UNION
    {
      ?besluit prov:wasGeneratedBy ?behandelingVanAgendapunt . 
    }
    
    OPTIONAL {
     ?besluit eli:description ?besluitBeschrijving . 
    }
    
    OPTIONAL {
     ?besluit eli:title ?besluitTitel .
    }
    
    OPTIONAL {
     ?besluit prov:value ?besluitInhoud . 
    }
    BIND(concat("verbonden met besluit \n met titel: \n  ", if(bound(?besluitTitel), str(?besluitTitel), " onbekend "), "  \n en beschrijving: \n ", if(bound(?besluitBeschrijving), str(?besluitBeschrijving), " onbekend "), " en inhoud: \n ", if(bound(?besluitInhoud), str(?besluitInhoud), " onbekend.")) as ?storyBesluitTitelBeschrijvingEnInhoud)
  }
  BIND(if(bound(?besluit), concat("verbonden met besluit met URI: ", str(?besluit)), "Niet verbonden met besluit") as ?storyAgendapuntVerbondenMetBesluit)
  
  OPTIONAL {
  	?besluit eli:has_part ?artikel .
    ?artikel a besluit:Artikel .
    BIND(concat("besluit is vebonden met artikel met URI: ", str(?artikel)) as ?storyBesluitVerbondenMetArtikel)

    OPTIONAL {
     ?artikel eli:number ?artikelNummer . 
    }
    
    OPTIONAL {
     ?artikel eli:description ?artikelBeschrijving . 
    }
    
    OPTIONAL {
     ?artikel eli:title ?artikelTitel .
    }
    
    OPTIONAL {
     ?artikel prov:value ?artikelInhoud . 
    }

    BIND(concat("besluit is verbonden met artikel met nummer: ", if(bound(?artikelNummer), ?artikelNummer, " onbekend ") ," en titel: ", if(bound(?artikelTitel), ?artikelTitel, " onbekend "), " en beschrijving: ", if(bound(?artikelBeschrijving), ?artikelBeschrijving, " onbekend "), " en inhoud: ", if(bound(?artikelInhoud), ?artikelInhoud, " onbekend.")) as ?storyArtikelTitelBeschrijvingEnInhoud)
  }
  
  OPTIONAL {
    ?behandelingVanAgendapunt a besluit:BehandelingVanAgendapunt ;
                             dcterms:subject ?agendapunt ;
                             besluit:heeftStemming ?stemming .
    OPTIONAL {
     ?stemming besluit:aantalVoorstanders ?aantalVoorstanders . 
    }
    OPTIONAL {
     ?stemming besluit:aantalTegenstanders ?aantalTegenstanders . 
    }
    OPTIONAL {
     ?stemming besluit:aantalOnthouders ?aantalOnthouders . 
    }
    
    OPTIONAL {
      SELECT DISTINCT ?stemming (group_concat(str(?voorstander);separator=' ') as ?voorstanders)
         WHERE {
        	?stemming besluit:heeftVoorstander ?voorstander .
         } 
          GROUP BY ?stemming
    }
    OPTIONAL {
      SELECT DISTINCT ?stemming (group_concat(str(?tegenstander);separator=' ') as ?tegenstanders)
         WHERE {
        	?stemming besluit:heeftTegenstander ?tegenstander .
         } 
          GROUP BY ?stemming
    }
    OPTIONAL {
      SELECT DISTINCT ?stemming (group_concat(str(?onthouder);separator=' ') as ?onthouders)
         WHERE {
        	?stemming besluit:heeftOnthouder ?onthouder .
         } 
          GROUP BY ?stemming
    }    
  }
  BIND(if(bound(?stemming), concat("verbonden met stemming met URI: ", str(?stemming)), "niet verbonden met stemming") as ?storyBehandelingVanAgendapuntVerbondenMetStemming)
  BIND(concat("Totaal: ", if(bound(?aantalVoorstanders), str(?aantalVoorstanders), "onbekend"), "\n", if(bound(?voorstanders), ?voorstanders, "geen voorstanders gevonden")) as ?storyStemmingMetVoorstanders)
  BIND(concat("Totaal: ", if(bound(?aantalTegenstanders), str(?aantalTegenstanders), "onbekend"), "\n", if(bound(?tegenstanders), ?tegenstanders, "geen tegenstanders gevonden")) as ?storyStemmingMetTegenstanders)
  BIND(concat("Totaal: ", if(bound(?aantalOnthouders), str(?aantalOnthouders), "onbekend"), "\n", if(bound(?onthouders), ?onthouders, "geen onthouders gevonden")) as ?storyStemmingMetOnthouders)
}
    `,
    {
      sources: ['https://centrale.vindplaats.lblod.info/sparql', publication],
    },
  );

  return bindingsStream.toArray();
 }
