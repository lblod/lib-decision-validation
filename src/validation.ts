import { Bindings } from '@comunica/types';
import * as fs from 'fs';
import type { ValidatedSubject, ValidatedProperty, ParsedSubject, ParsedProperty, ClassCollection } from './types';
import {filterTermsByValue, findTermByValue, getUniqueValues, formatURI} from './utils'


/* determines the document type based on a specific term
  param:
  - bindings: array of bindings, generally a publication that contains the desired term
  returns:
  - whether one of the known document types has been found and if so, which one
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
  const seenSubjects: string[] = [];
  preProcess(publication, subjectKeys, seenSubjects);

  subjectKeys.forEach((subjectKey) => {
    const subject: Bindings[] = publication.filter((p) => p.get('s')!.value === subjectKey);
    const parsedSubject = parseSubject(subject, publication, seenSubjects);
    if (parsedSubject != null) {
      result.push(parsedSubject);
    }
  });
  return result;
}


/* function to parse a subject
  param:
  - publication: subject to be parsed
  returns:
  - a parsed subject
*/
function parseSubject(subject: Bindings[], publication: Bindings[], seenSubjects: string[]): ParsedSubject {
  const subjectURI: string = subject[0].get('s')!.value;
  if(seenSubjects.includes(subjectURI)) return

  seenSubjects.push(subjectURI);
  const subjectClass: string = findTermByValue(subject, 'o', 'p', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  const properties: ParsedProperty[] = [];
  subject.forEach((b) => {
    if (b.get('p')!.value !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
      const termType: string = b.get('o')!.termType;
      if (termType === 'Literal') {
        properties.push({
          path: b.get('p')!.value,
          value: b.get('o')!.value,
        }); 
      }
      if (termType === 'NamedNode') {
        const foundRelationKey: string = findTermByValue(publication, 's', 's', b.get('o')!.value);
        if (foundRelationKey != undefined) {
          const foundRelation: Bindings[] = publication.filter((p) => p.get('s')!.value === foundRelationKey);

          const parsedSubject = parseSubject(foundRelation, publication, seenSubjects);
          if (parsedSubject != undefined) {
            properties.push({
              path: b.get('p')!.value,
              value: parsedSubject,
            });
          }
        } else {
          properties.push({
            path: b.get('p')!.value,
            value: b.get('o')!.value,
          });
        }
      }
    }
  });
  return {
    uri: subjectURI,
    class: subjectClass,
    properties: properties,
  };
}


/* function to validate a publication 
  param:
  - publication: object to be validated
  returns:
  - contains a report of all missing requirements for a publication
*/
export function validatePublication(publication: Bindings[], blueprint: Bindings[]): ClassCollection[] {
  const parsedPublication = parsePublication(publication);
  const result: ValidatedSubject[] = [];

  parsedPublication.forEach((subject) => {
    const resultSubject = validateSubject(subject, blueprint);
    result.push(resultSubject);
  });

  return postProcess(result)
}


/* function to validate the properties of a subject
  param:
  - subject: subject to be validated
  returns:
  - validated subject
*/
function validateSubject(subject, blueprint: Bindings[]): ValidatedSubject {

  const blueprintShapeKey: string | undefined = blueprint
    .find((b) => b.get('p')!.value === 'http://www.w3.org/ns/shacl#targetClass' && b.get('o')!.value === subject.class)
    ?.get('s')!.value;

  if (blueprintShapeKey != undefined) {
    const blueprintShape: Bindings[] = blueprint.filter((b) => b.get('s')!.value === blueprintShapeKey);
    const propertyKeys: string[] = filterTermsByValue(blueprintShape, 'o', 'p', "http://www.w3.org/ns/shacl#property")

    const validatedProperties = [];
    let validCount = 0;
    propertyKeys.forEach((propertyKey) => {
      const propertyShape: Bindings[] = blueprint.filter((b) => b.get('s')!.value === propertyKey);
      const validatedProperty: ValidatedProperty = validateProperty(subject, propertyShape, blueprint);
      if (validatedProperty.valid) validCount++;
      validatedProperties.push(validatedProperty);
    });

    return {
      uri: subject.uri,
      class: subject.class,
      className: subject.class ? formatURI(subject.class!) : 'Unknown class',
      usedShape: blueprintShapeKey,
      shapeName: blueprintShapeKey ? formatURI(blueprintShapeKey!) : 'Unknown shape',
      totalCount: propertyKeys.length,
      validCount: validCount,
      properties: validatedProperties,
    };
  }

  return {
    uri: subject.uri,
    class: subject.class,
    className: subject.class ? formatURI(subject.class!) : 'Unknown class',
    properties: subject.properties,
    totalCount: subject.properties.length,
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
  // instantiate default value
  let validatedProperty: ValidatedProperty = {
    name: "Naam niet gevonden",
    description: "Beschrijving niet gevonden",
    path: "Pad niet gevonden",
    value: ["Waarde niet gevonden"],
    minCount: 0,
    actualCount: 0,
    valid: false
  };
  propertyShape.forEach((p) => {
    switch (p.get('p')!.value) {
      case 'http://www.w3.org/ns/shacl#name': {
        validatedProperty.name = p.get('o')!.value;
        break;
      }
      case 'http://www.w3.org/ns/shacl#class': {
        validatedProperty.targetClass = p.get('o')!.value;
        break;
      }
      case 'http://www.w3.org/ns/shacl#description': {
        validatedProperty.description = p.get('o')!.value;
        break;
      }
      case 'http://www.w3.org/ns/shacl#path': {
        validatedProperty.path = p.get('o')!.value;
        break;
      }
      case 'http://www.w3.org/ns/shacl#minCount': {
        validatedProperty.minCount = parseInt(p.get('o')!.value);
        break;
      }
      case 'http://www.w3.org/ns/shacl#maxCount': {
        validatedProperty.maxCount = parseInt(p.get('o')!.value);
        break;
      }
      default: {
      }
    }
  });

  if(validatedProperty.path === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
    validatedProperty.value = [ subject.class ]
  } else {
    validatedProperty.value = subject.properties
      .filter((p) => p.path === validatedProperty.path)
      .map((s) => {
        if (s.value.class != undefined) {
          return validateSubject(s.value, blueprint);
        } else return s.value;
      });
  }

  validatedProperty.actualCount = validatedProperty.value.length;
  validatedProperty.valid =
    (validatedProperty.minCount === undefined || validatedProperty.actualCount >= validatedProperty.minCount) &&
    (validatedProperty.maxCount === undefined || validatedProperty.actualCount <= validatedProperty.maxCount) &&
    (validatedProperty.targetClass === undefined || validatedProperty.value === undefined || 
      !validatedProperty.value.some(v => {
        v.class !== validatedProperty.targetClass
      }) 
    )
  return validatedProperty;
}

  
/* preprocessing function, currently it finds subjects that have no RDF type linked to it and adds them to seenSubjects. 
  Causing them to be skipped during parsing and validation.
  param:
  - publication: publication to be preprocessed, 
  - subjectKeys: array of keys of distinct subjects
  returns:
  - an aggregated document
*/
function preProcess(publication: Bindings[], subjectKeys: string[], seenSubjects: string[]): void {

  const typedSubjectKeys: string[] = getUniqueValues(
    filterTermsByValue(publication, 's', 'p', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
  ) as string[];
  subjectKeys.forEach(b => {
    if(!typedSubjectKeys.includes(b)) seenSubjects.push(b)
  })
}

  
/* function to aggregate a document
  param:
  - validatedSubjects: subjects that have gone through validation
  returns:
  - an array of collections, a collection contains all the root objects in the publication that share the same RDF class
*/
function postProcess(validatedSubjects: ValidatedSubject[]): ClassCollection[] {
  const result: ClassCollection[] = []
  // Combine all Root objects with the same type into one collection
  const distinctClasses: string[] = getUniqueValues((validatedSubjects.map((p) => p.class))) as string[]
  distinctClasses.forEach(c => {
    const objects: ValidatedSubject[] = validatedSubjects.filter(s => s.class === c)
    result.push({
      classURI: c,
      className: formatURI(c),
      count: objects.length, 
      objects: objects
    })
  })
  return result
}
