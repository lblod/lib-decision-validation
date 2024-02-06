
import * as q from './queries';
import { Bindings } from "@comunica/types";
import { RDFShape, RDFProperty } from './types';

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

export function validateProperty(property: Bindings[]): any {
  // 
  console.log(`proper ei ${property}`)
  let result: any = {}
  property.forEach(p => {
    switch(p.get('p')!.value) {
        case "http://www.w3.org/ns/shacl#name": {
          result.name = p.get('o')!.value;
          break;
        }
        case "http://www.w3.org/ns/shacl#class": {
          result.targetClass = p.get('o')!.value;
          break;
        }
        case "http://www.w3.org/ns/shacl#description": {
          result.description = p.get('o')!.value;
          break;
        }
        case "http://www.w3.org/ns/shacl#path": {
          result.path = p.get('o')!.value;
          break;
        }
        case "http://www.w3.org/ns/shacl#minCount": {
          result.minCount = p.get('o')!.value;
          break;
        }
        case "http://www.w3.org/ns/shacl#maxCount": {
          result.maxCount = p.get('o')!.value;
          break;
        }
        default: {
          console.log(`default ${p.get('p')!.value}`)
        }
      }
  });
  return result;
}

/* function to validate a publication 
  param:
  - publication: object to be validated
  returns:
  - contains a report of all missing requirements for a publication

*/
export async function validatePublication(publication: Bindings[], blueprint: Bindings[]) {
  // check if the publication has all the necessary annotations
  // it should possess all the right shapes and properties
  // we start by collecting every shape 
  const shapes: Bindings[] = blueprint
    .filter(b => 
      b.get("p")!.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" &&
        b.get("o")!.value === "http://www.w3.org/ns/shacl#NodeShape")

  const result: RDFShape[] = [];
  // we should save the counts of properties per subject
  shapes.forEach(shape => {
    switch(shape.get('p')!.value) {
      case "http://www.w3.org/ns/shacl#property": {
        const newProperty = blueprint
          .filter(b => b.get('s')!.value === shape.get('o')!.value)
        const validatedProperty = validateProperty(newProperty)
        console.log(`validated property ${JSON.stringify(validatedProperty)}`)
        break;
      }
      case "http://www.w3.org/ns/shacl#targetClass": {
        break;
      }
      default: {
        console.log(`default ${shape.get('p')!.value}`)
      }
    }
  });
  // and reflect whether or not it exceeds or subceeds the required counts
  // This in turn will be saved in a 'status' attribute

}
