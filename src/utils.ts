import { Bindings } from '@comunica/types';
import * as fs from 'fs';

import { Store, Quad, Term } from "n3";
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
  return source
    .find((s) => s.get(givenTerm)!.value === termValue)
    ?.get(desiredTerm)!.value;
}


/* function to filter triples by a certain condition and then get the value of a certain term
  param:
  - source: source of triples to filter on
  - desiredTerm: term that we want to find the value for
  - givenTerm: term that should contains the value we have been given
  - termValue: the value for givenTerm that we filter on
  returns:
  - an array containing the values of the desired terms
*/
export function filterTermsByValue(source: Bindings[], desiredTerm: string, givenTerm: string, termValue: string): string[] {
    return source
      .filter((b) => b.get(givenTerm)!.value === termValue)
      .map((b) => b.get(desiredTerm)!.value);
}


/* Removes duplicate values from an array
  param:
  - array: input array
  returns:
  - an array containing
*/
export function getUniqueValues(array: unknown[]): unknown[] {
  return [ ... new Set(array) ]
}


/* function to format the uris into names
  param:
  - uri to be formatted
  returns:
  - the last term in the uri as a more legible name
  eg: 'http://xmlns.com/foaf/0.1/Document' would be formatted into 'Document'
*/
export function formatURI(uri: string): string {
  const result1: string = /[^#]+$/.exec(uri)[0]  
  const result2: string = /[^\/]+$/.exec(uri)[0];
  return result1.length < result2.length ? result1 : result2
}

export function ensureDirectoryExistence(directoryPath: string) {
    if (fs.existsSync(directoryPath)) {
      return true;
    }
    fs.mkdirSync(directoryPath);
}

export async function getDOMfromUrl(url: string): Promise<Document> {
  const res: Response = await fetch(url);
  const resText: string = await res.text();
  const { document } = (new JSDOM(resText)).window;
  return document;
}

export function getStoreFromSPOBindings(bindings: Bindings[]): Store {
  const s: Store = new Store();
  bindings.map((b) => {
    s.add(new Quad(<Term>b.get('s'),<Term>b.get('p'), <Term>b.get('o')));
  });
  return s;
}

export async function runQueryOverStore(query: string, store: Store): Promise<Bindings[]> {
  const bindingsStream = await myEngine.queryBindings(query, {
    sources: [store],
  });
  return await bindingsStream.toArray();
}