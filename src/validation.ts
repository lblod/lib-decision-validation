import { Bindings } from '@comunica/types';
import * as fs from 'fs';

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

export function parsePublication(publication: Bindings[]) {
  const subjectKeys: string[] = [...new Set(publication.map((p) => p.get('s')!.value))];
  const result: any[] = [];
  const seenSubjects = []
  subjectKeys.forEach((subjectKey) => {
    const subject: Bindings[] = publication.filter((p) => p.get('s')!.value === subjectKey);
    const parsedSubject = parseSubject(subject, publication, seenSubjects)
    if(parsedSubject != null) {
      result.push(parsedSubject)
    }
  })
  fs.writeFileSync("parsed.json", JSON.stringify(result))
  return result
}

function parseSubject(subject: Bindings[], publication: Bindings[], seenSubjects: any[]) {
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
            predicate: b.get('p')!.value,
            object: b.get('o')!.value
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
                predicate: b.get('p')!.value,
                object: parsedSubject
              })
            }
          } else {
            properties.push({
              predicate: b.get('p')!.value,
              object: b.get('o')!.value,
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


/* function to validate the properties of a subject
  param:
  - subject: object to be validated
  returns:
  - one of the following values: [besluitenlijst, notulen, agenda]
*/
function validateProperty(subject, propertyShape: Bindings[], blueprint): any {
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

  result.actualValue = subject.properties
    .filter((p) => p.predicate === result.path)
    .map((s) => {
      if(s.object.type != undefined) {
        return validateSubject(s.object, blueprint);
      } 
      return {
        path: s.url,
        actualValue: s.object
      }
    });
  result.actualCount = result.actualValue.length;
  result.valid =
    (result.minCount === undefined || result.actualCount >= result.minCount) &&
    (result.maxCount === undefined || result.actualCount <= result.maxCount);

  return result;
}

function validateSubject(subject, blueprint: Bindings[]) {
  console.log(`subject ${JSON.stringify(subject)}`)
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
  };
}

/* function to validate a publication 
  param:
  - publication: object to be validated
  returns:
  - contains a report of all missing requirements for a publication
*/
export function validatePublication(publication: Bindings[], blueprint: Bindings[]) {
  const parsedPublication = parsePublication(publication)
  const result: any[] = [];

  parsedPublication.forEach((subject) => {
    const resultSubject = validateSubject(subject, blueprint)
    result.push(resultSubject);
    
  });
  return result;
}

export function checkMaturity(result: any[], properties: void | Bindings[]) {
  let valid: boolean = true;
  (properties as Bindings[]).forEach((property) => {
    return result.forEach((subject) => {
      const found = subject.validatedProperties.find((p) => p.path === property.get('path')!.value);
      if (found && !found.valid) {
        valid = false
      }
    });
  });
  return valid
}

