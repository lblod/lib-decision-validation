import { Bindings } from '@comunica/types';
import { Store, Quad, Term } from 'n3';
import parse, { DOMNode } from 'html-dom-parser';

import { QueryEngine } from '@comunica/query-sparql';
import { fetchDocument } from './queries';
import { ParsedSubject, ValidationResult } from './types';

/* function to filter triples by a certain condition and then get the value of a certain term
  param:
  - source: source of triples to filter on
  - desiredTerm: term that we want to find the value for
  - givenTerm: term that should contains the value we have been given
  - termValue: the value for givenTerm that we filter on
  returns:
  - value of the desired term
*/
export function findTermByValue(source: Bindings[], desiredTerm: string, givenTerm: string, termValue: string): string {
  return source.find((s) => s.get(givenTerm)!.value === termValue)?.get(desiredTerm)!.value;
}

/* function to filter triples by a certain condition and then get ALL the values of a certain term
  param:
  - source: source of triples to filter on
  - desiredTerm: term that we want to find the value for
  - givenTerm: term that should contains the value we have been given
  - termValue: the value for givenTerm that we filter on
  returns:
  - values of the desired term
*/
export function findTermsByValue(source: Bindings[], desiredTerm: string, givenTerm: string, termValue: string): string[] {
  return source.filter((s) => s.get(givenTerm)!.value === termValue).map((s) => s.get(desiredTerm)!.value);
}

/* function to filter triples by a certain condition and then get the value of a certain term
  param:
  - source: source of triples to filter on
  - desiredTerm: term that we want to find the value for
  - givenTerm: term that should contains the value we have been given
  - termValue: the value for givenTerm that we filter on
  returns:
  - an array containing the values of the desired terms
  example: 
    filterTermsByValue(blueprintShape, 'o', 'p', "http://www.w3.org/ns/shacl#property")
*/
export function filterTermsByValue(
  source: Bindings[],
  desiredTerm: string,
  givenTerm: string,
  termValue: string,
): string[] {
  return source.filter((b) => b.get(givenTerm)!.value === termValue).map((b) => b.get(desiredTerm)!.value);
}

/* Removes duplicate values from an array
  param:
  - array: input array
  returns:
  - an array containing
*/
export function getUniqueValues<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/* function to format the uris into names
  param:
  - uri to be formatted
  returns:
  - the last term in the uri as a more legible name
  eg: 'http://xmlns.com/foaf/0.1/Document' would be formatted into 'Document'
*/
export function formatURI(uri: string): string {
  const result1: string = /[^#]+$/.exec(uri)[0];
  const result2: string = /[^\/]+$/.exec(uri)[0];
  return result1.length < result2.length ? result1 : result2;
}

export async function getDOMfromUrl(url: string): Promise<DOMNode[]> {
  const res: Response = await fetch(url);
  const resText: string = await res.text();
  const document = parse(resText);
  return document;
}

export function getDOMfromString(res: string): DOMNode[] {
  return parse(res);
}

export function getStoreFromSPOBindings(bindings: Bindings[]): Store {
  const s: Store = new Store();
  bindings.map((b) => {
    s.add(new Quad(b.get('s') as Term, b.get('p') as Term, b.get('o') as Term));
  });
  return s;
}

export async function runQuery(query: string, context: any): Promise<Bindings[]> {
  try {
    const myEngine = new QueryEngine();
    const bindingsStream = await myEngine.queryBindings(query, context);
    return await bindingsStream.toArray();
  } catch (e) {
    return [];
  }
}

export async function getLblodURIsFromBindings(b: Bindings[]): Promise<Bindings[]> {
  const store: Store = getStoreFromSPOBindings(b);
  const query = `
      select distinct ?id
      where {
        {
          select distinct ?idWithoutHttp
          where {
            ?idWithoutHttp ?p ?o .
            filter(regex(str(?idWithoutHttp), "data.lblod.info/id/(mandatarissen|personen|persoon|functionarissen|bestuursorganen|bestuurseenheden|werkingsgebieden)", "i"))
          }
        }
        UNION {
          select distinct ?idWithoutHttp
          where {
            ?s ?p ?idWithoutHttp .
            filter(regex(str(?idWithoutHttp), "data.lblod.info/id/(mandatarissen|personen|persoon|functionarissen|bestuursorganen|bestuurseenheden|werkingsgebieden)", "i"))
          }
        }
        BIND(replace(str(?idWithoutHttp), 'http://', 'https://') as ?id)
      }
    `;

  return await runQuery(query, {
    sources: [store]
  });
}

export async function processLblodUris(lblodUris: Bindings[], destination: Bindings[]) {
  for (const u of lblodUris) {
    const uri = u.get('id').value;
    const dereferencedLblodUri = await fetchDocument(uri.split(/[?#]/)[0]);
    for (const b of dereferencedLblodUri) {
      // Only add binding when not already exists
      if (destination.filter((element) => element.equals(b)).length === 0) {
        destination.push(b);
      }
    }
  }
}

export async function validateSubjectWithSparqlConstraint(subject: ParsedSubject, sparqlConstraintBindings: Bindings[], publicationStore: Store, path?: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  const selectBinding = sparqlConstraintBindings.filter((b) => b.get('p')!.value === 'http://www.w3.org/ns/shacl#select');
  if (!selectBinding.length) return results;
  const select = selectBinding[0].get('o').value;

  const messageBinding = sparqlConstraintBindings.filter((b) => b.get('p')!.value === 'http://www.w3.org/ns/shacl#message');
  if (!messageBinding.length) return results;
  const message = messageBinding[0].get('o').value;

  let rewrittenSelect = select;
  // Rewrite select query so $this is filled in with subject URI
  // We expect a sparql constraint query to return ?this, ?path and ?value
  // Check if subject URI is not a blank node
  if(subject.uri.startsWith('http')) {
    rewrittenSelect = select.replaceAll('$this', `<${subject.uri}>`);
    rewrittenSelect = rewrittenSelect.replaceAll('\t', '').replaceAll('\n', ' ');
    // Fill in $path when sparql constraint on property shape
    if (path) rewrittenSelect = rewrittenSelect.replaceAll('$path', `<${path}>`);

    const queryResults: Bindings[] = await runQuery(rewrittenSelect, {
      sources: [publicationStore]
    });
    // We expect that the query contains ?this, ?path and ?value bindings
    for (const r of queryResults) {
      results.push({
        'focusNode': r.get('this').value,
        'resultPath': path ? path : r.get('path').value,
        'value': r.get('value').value,
        'resultMessage': message
      });
    }
  } else {
    // subject is blank node and cannot be used in the format of SHACL-SPARQL queries
    results.push({
      'focusNode': subject.uri,
      'resultMessage': 'Blank nodes mogen niet gebruikt worden.'
    });
  }
  return results;
}
