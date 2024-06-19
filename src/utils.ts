import { Bindings } from '@comunica/types';
import { Store, Quad, Term } from 'n3';
import parse, { DOMNode } from 'html-dom-parser';

import { QueryEngine } from '@comunica/query-sparql';
const myEngine = new QueryEngine();

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
  const result1: string = /[^#]+$/.exec(uri)![0];
  const result2: string = /[^/]+$/.exec(uri)![0];
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

export async function runQueryOverStore(query: string, store: Store): Promise<Bindings[]> {
  const bindingsStream = await myEngine.queryBindings(query, {
    sources: [store],
  });
  return await bindingsStream.toArray();
}
