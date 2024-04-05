import { Bindings } from '@comunica/types';
import * as fs from 'fs';
import type { ValidatedSubject, ValidatedProperty, ParsedSubject, ParsedProperty } from './types'

/* function to validate a publication 
  param:
  - publication: object to be validated
  returns:
  - one of the following valuesL: [besluitenlijst, notulen, agenda]
*/
export function determineDocumentType(bindings: Bindings[]): string {
  // Look for document type predicate if it is present
  for (const b of bindings) {
    if (
      b.get('p')!.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
      b.get('o')!.value.includes('https://data.vlaanderen.be/id/concept/BesluitDocumentType/')
    ) {
      switch (b.get('o')!.value) {
        case 'https://data.vlaanderen.be/id/concept/BesluitDocumentType/8e791b27-7600-4577-b24e-c7c29e0eb773': {
          return 'Notulen';
        }
        case 'https://data.vlaanderen.be/id/concept/BesluitDocumentType/3fa67785-ffdc-4b30-8880-2b99d97b4dee': {
          return 'Besluitenlijst';
        }
        case 'https://data.vlaanderen.be/id/concept/BesluitDocumentType/13fefad6-a9d6-4025-83b5-e4cbee3a8965': {
          return 'Agenda';
        }
      }
    }
  }
  return 'unknown document type';
}


/* function to parse a publication 
  param:
  - publication: object to be parsed as Comunica bindings 
  returns:
  - the publication as a JSON object structured like a tree
*/
export function parsePublication(publication: Bindings[]): ParsedSubject[] {
  const subjectKeys: string[] = [...new Set(publication.map((p) => p.get('s')!.value))];
  const result: ParsedSubject[] = [];
  const seenSubjects = []
  subjectKeys.forEach((subjectKey) => {
    const subject: Bindings[] = publication.filter((p) => p.get('s')!.value === subjectKey);
    const parsedSubject = parseSubject(subject, publication, seenSubjects)
    if(parsedSubject != null) {
      result.push(parsedSubject)
    }
  })
  return result
}


/* function to parse a subject
  param:
  - publication: subject to be parsed
  returns:
  - a parsed subject
*/
function parseSubject(subject: Bindings[], publication: Bindings[], seenSubjects: any[]): ParsedSubject {
  const subjectURL: string = subject[0].get('s')!.value
  if(seenSubjects.find(s => s === subjectURL) == undefined) {
    seenSubjects.push(subjectURL)
    const subjectType: string | undefined = subject
      .find((s) => s.get('p')!.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
      ?.get('o')!.value;
    const properties: any[] = []
    subject.forEach(b => {
      if (b.get('p')!.value !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        const termType: string = b.get('o')!.termType;
        if(termType === "Literal") {
          properties.push({
            path: b.get('p')!.value,
            value: b.get('o')!.value
          });
        }
        if(termType === "NamedNode") {
          const foundRelationKey: string = publication
            .find((p) => p.get('s')!.value === b.get('o')!.value)
            ?.get('s')!.value;
          if(foundRelationKey != undefined) {
            const foundRelation: Bindings[] = publication
              .filter((p) => p.get('s')!.value === foundRelationKey)

            const parsedSubject = parseSubject(foundRelation, publication, seenSubjects);
            if(parsedSubject != undefined) {
              properties.push({
                path: b.get('p')!.value,
                value: parsedSubject
              })
            }
          } else {
            properties.push({
              path: b.get('p')!.value,
              value: b.get('o')!.value,
            });
          }
        }
      }
    })
    return {
      url: subjectURL,
      type: subjectType,
      properties: properties,
    }
  }
}


/* function to validate a publication 
  param:
  - publication: object to be validated
  returns:
  - contains a report of all missing requirements for a publication
*/
export function validatePublication(publication: Bindings[], blueprint: Bindings[]): ValidatedSubject[] {
  const parsedPublication = parsePublication(publication)
  const result: any[] = [];

  parsedPublication.forEach((subject) => {
    const resultSubject = validateSubject(subject, blueprint)
    result.push(resultSubject);
    
  });
  return result;
}


/* function to validate a publication 
  param:
  - publication: object to be validated
  returns:
  - contains a report of all missing requirements for a publication
*/
export function checkMaturity(result: any[], properties: void | Bindings[]) {
  let valid: boolean = true;
  (properties as Bindings[]).forEach((property) => {
    return result.forEach((subject) => {
      const found = subject.properties.find((p) => p.path === property.get('path')!.value);
      if (found && !found.valid) {
        valid = false
      }
    });
  });
  return valid
}


/* function to validate the properties of a subject
  param:
  - subject: subject to be validated
  returns:
  - validated subject
*/
function validateSubject(subject, blueprint: Bindings[]): ValidatedSubject {
  const regex: RegExp = /[^#]+$/;

  const blueprintShapeKey: string | undefined = blueprint
    .find((b) => b.get('p')!.value === 'http://www.w3.org/ns/shacl#targetClass' && b.get('o')!.value === subject.type)
    ?.get('s')!.value;
    
  if (blueprintShapeKey != undefined) {
    const blueprintShape: Bindings[] = blueprint.filter((b) => b.get('s')!.value === blueprintShapeKey);
    const propertyKeys: string[] = blueprintShape
      .filter((b) => b.get('p')!.value === 'http://www.w3.org/ns/shacl#property')
      .map((b) => b.get('o')!.value);
    
    const validatedProperties = []
    let validCount = 0
    propertyKeys.forEach((propertyKey) => {
      const propertyShape: Bindings[] = blueprint.filter((b) => b.get('s')!.value === propertyKey);
      const validatedProperty: any = validateProperty(subject, propertyShape, blueprint);
      if (validatedProperty.valid) validCount++;
      validatedProperties.push(validatedProperty);
    });

    return {
      url: subject.url,
      type: subject.type,
      typeName: regex.exec(subject.type!) ? regex.exec(subject.type!)![0] : 'Unknown type',
      usedShape: blueprintShapeKey,
      name: regex.exec(blueprintShapeKey!) ? regex.exec(blueprintShapeKey!)![0] : 'Unknown shape',
      totalCount: propertyKeys.length,
      validCount: validCount,
      properties: validatedProperties,
    };
    
  }
  return {
    url: subject.url,
    type: subject.type,
    typeName: regex.exec(subject.type!) ? regex.exec(subject.type!)![0] : 'Unknown type',
    properties: subject.properties,
    totalCount: subject.properties.length
  };
}


/* function to validate the properties of a subject
  param:
  - subject: array of properties to be validated
  - propertyShape: the blueprint shape of the validated property
  - blueprint: complete blueprint
  returns:
  - subject with validated properties
*/
function validateProperty(subject, propertyShape: Bindings[], blueprint): ValidatedProperty {
  const result: any = {};
  propertyShape.forEach((p) => {
    switch (p.get('p')!.value) {
      case 'http://www.w3.org/ns/shacl#name': {
        result.name = p.get('o')!.value;
        break;
      }
      case 'http://www.w3.org/ns/shacl#class': {
        result.targetClass = p.get('o')!.value;
        break;
      }
      case 'http://www.w3.org/ns/shacl#description': {
        result.description = p.get('o')!.value;
        break;
      }
      case 'http://www.w3.org/ns/shacl#path': {
        result.path = p.get('o')!.value;
        break;
      }
      case 'http://www.w3.org/ns/shacl#minCount': {
        result.minCount = p.get('o')!.value;
        break;
      }
      case 'http://www.w3.org/ns/shacl#maxCount': {
        result.maxCount = p.get('o')!.value;
        break;
      }
      default: {
        // console.log(`default ${p.get('p')!.value}`);
      }
    }
  });

  result.value = subject.properties
    .filter((p) => p.path === result.path)
    .map((s) => {
      if(s.value.type != undefined) {
        return validateSubject(s.value, blueprint);
      } else return s.value
    });

  result.actualCount = result.value.length;
  result.valid =
    (result.minCount === undefined || result.actualCount >= result.minCount) &&
    (result.maxCount === undefined || result.actualCount <= result.maxCount) &&
    (result.value.type === undefined || result.value.type === result.targetClass);
  
  return result;
}
