import { Bindings } from '@comunica/types';
import type {
  ValidatedSubject,
  ValidatedProperty,
  ParsedSubject,
  ParsedProperty,
  ProcessedProperty,
  ClassCollection,
  ValidatedPublication,
} from './types';
import { filterTermsByValue, findTermByValue, getUniqueValues, formatURI, findTermsByValue, getLblodURIsFromBindings } from './utils';
import { enrichClassCollectionsWithExample } from './examples';
import { DOMNode } from 'html-dom-parser';
import { fetchDocument } from './queries';

let BLUEPRINT: Bindings[] = [];
let EXAMPLE: DOMNode[] = [];

const MATURITY_LEVEL: string[] = ['Niveau 0', 'Niveau 1', 'Niveau 2', 'Niveau 3'];
let FOUND_MATURITY = MATURITY_LEVEL[3];

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
  // TODO: Approach with Set returns typescript compilation error
  // const subjectKeys: string[] = [...new Set(publication.map((p) => p.get('s')!.value))];
  const tmp = publication.map((p) => p.get('s')!.value);
  const subjectKeys: string[] = tmp.filter((value, index, array) => array.indexOf(value) === index);

  const result: ParsedSubject[] = [];
  // Key: subject URI
  // Map: predicate URI -> array of object URIs that are processed
  // Map allows an object to be processed multiple times if different predicate is used
  const seenSubjects: {[key: string]: Map<string, string[]>} = {};
  const parsedSubjectsLookup: {[key: string]: ParsedSubject} = {}; // Key: subject URI - Value : ParsedSubject
  subjectKeys.forEach((subjectKey) => {
    seenSubjects[subjectKey] = new Map<string, string[]>;
  });

  subjectKeys.forEach((subjectKey) => {
    const subject: Bindings[] = publication.filter((p) => p.get('s')!.value === subjectKey);
    const parsedSubject = parseSubject(subject, publication, seenSubjects, parsedSubjectsLookup);
    if (parsedSubject !== null) {
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
function parseSubject(subject: Bindings[], publication: Bindings[], seenSubjects: {[key: string]: Map<string, string[]>}, parsedSubjectsLookup: {[key: string]: ParsedSubject}): ParsedSubject {
  const subjectURI: string = subject[0].get('s')!.value;
  if (parsedSubjectsLookup[subjectURI] !== undefined) return parsedSubjectsLookup[subjectURI];

  const tmpClasses: string[] = findTermsByValue(subject, 'o', 'p', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  if (!tmpClasses.length) return; // stop when no class(es) is found for this subject

  // Check if subject is a Document (note: documents can have multiple rdf:type for relating to specific types of documents)
  const isSubjectDocument = tmpClasses.includes('http://xmlns.com/foaf/0.1/Document');
  const subjectClass: string = isSubjectDocument ? 'http://xmlns.com/foaf/0.1/Document' : tmpClasses[0];

  const properties: ParsedProperty[] = [];
  subject.forEach((b) => {
    const predicate = b.get('p')!.value;

    // When rdf:type is not the class
    if (predicate !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
      const termType: string = b.get('o')!.termType;
      if (termType === 'Literal') {
        properties.push({
          path: predicate,
          value: b.get('o')!.value,
        });
      }
      if (termType === 'NamedNode') {
        const foundRelationKey: string = findTermByValue(publication, 's', 's', b.get('o')!.value);
        // Go deeper when this subject has not processed this object before 
        if (foundRelationKey !== undefined && (!seenSubjects[subjectURI].has(predicate) || seenSubjects[subjectURI].get(predicate).indexOf(foundRelationKey) === -1)) {
          if(!seenSubjects[subjectURI].has(predicate)) seenSubjects[subjectURI].set(predicate, [foundRelationKey]);
          else {
            const extendedKeys = seenSubjects[subjectURI].get(predicate).concat([foundRelationKey]);
            seenSubjects[subjectURI].set(predicate, extendedKeys);
          }
          const foundRelation: Bindings[] = publication.filter((p) => p.get('s')!.value === foundRelationKey);
          
          const parsedSubject = parseSubject(foundRelation, publication, seenSubjects, parsedSubjectsLookup);
          if (parsedSubject !== undefined) {
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
    } else if (isSubjectDocument && b.get('o')!.value !== subjectClass) {
      // rdf:type is used as property to indicate document type
      properties.push({
        path: b.get('p')!.value,
        value: b.get('o')!.value,
      });
    }
  });
  const res = {
    uri: subjectURI,
    class: subjectClass,
    properties,
  };
  parsedSubjectsLookup[subjectURI] = res;
  return res;
}

/* function to validate a publication 
  param:
  - publication: object to be validated
  returns:
  - contains a report of all missing requirements for a publication
*/
export async function validatePublication(
  publication: Bindings[],
  blueprint: Bindings[],
  example: DOMNode[],
): Promise<ValidatedPublication> {
  const enrichedPublication: Bindings[] = publication;
  const lblodUris: Bindings[] = await getLblodURIsFromBindings(publication);
  const retrievedUris: string[] = [];
  const dereferencedBestuursorgaanLblodUris: Bindings[] = [];

  for (const u of lblodUris) {
    const uri = u.get('id').value.split(/[?#]/)[0];
    const dereferencedLblodUri = await fetchDocument(uri);

    for (const b of dereferencedLblodUri) {
      // Only add binding when not already exists
      if (enrichedPublication.filter((element) => element.equals(b)).length === 0) {
        enrichedPublication.push(b);
      }

      if (uri.indexOf('bestuursorganen') !== -1) {
        dereferencedBestuursorgaanLblodUris.push(b);
      }
    }
    retrievedUris.push(uri);
  }

  // If bestuurseenheid is not contained in publication, then we need to go two levels deep in bestuursorgaan. Otherwise one level deep suffices
  const containsBestuurseenheden = lblodUris.filter((element) => element.get('id').value.indexOf('bestuurseenheden') !== -1).length > 0;
  if (!containsBestuurseenheden) {
    const lblodUrisFromBestuursorgaan: Bindings[] = await getLblodURIsFromBindings(dereferencedBestuursorgaanLblodUris);
    for (const ufromb of lblodUrisFromBestuursorgaan) {
      const urifromb = ufromb.get('id').value.split(/[?#]/)[0];
      if ((urifromb.indexOf('bestuursorganen') !== -1 || urifromb.indexOf('bestuurseenheden') !== -1) && retrievedUris.indexOf(urifromb) === -1) {
        const dereferencedBestuursOrgaanOrEenheidLblodUri = await fetchDocument(urifromb);
        for (const b of dereferencedBestuursOrgaanOrEenheidLblodUri) {
          // Only add binding when not already exists
          if (enrichedPublication.filter((element) => element.equals(b)).length === 0) {
            enrichedPublication.push(b);
          }
        }
        retrievedUris.push(urifromb);

        const lblodUrisFromBestuursorgaanOrEenheid: Bindings[] = await getLblodURIsFromBindings(dereferencedBestuursOrgaanOrEenheidLblodUri);
        for (const ufrombOrEenheid of lblodUrisFromBestuursorgaanOrEenheid) {
          const urifrombOrEenheid = ufrombOrEenheid.get('id').value.split(/[?#]/)[0];
          if (urifrombOrEenheid.indexOf('bestuurseenheden') !== -1 && retrievedUris.indexOf(urifrombOrEenheid) === -1) {
            const dereferencedBestuursEenheidLblodUri = await fetchDocument(urifrombOrEenheid);
            for (const b of dereferencedBestuursEenheidLblodUri) {
              // Only add binding when not already exists
              if (enrichedPublication.filter((element) => element.equals(b)).length === 0) {
                enrichedPublication.push(b);
              }
            }
            retrievedUris.push(urifrombOrEenheid);
          }
        }
      }
    }
  }

  const parsedPublication = await parsePublication(enrichedPublication);
  BLUEPRINT = blueprint;
  EXAMPLE = example;

  let validatedSubjects: ValidatedSubject[] = [];
  parsedPublication.forEach((subject) => {
    if (subject !== undefined) {
      const resultSubjects = validateSubject(subject);
      validatedSubjects = validatedSubjects.concat(...resultSubjects);
    }
  });

  return {
    classes: await postProcess(validatedSubjects),
    maturity: FOUND_MATURITY,
  } as ValidatedPublication;
}

/* function to validate the properties of a subject
  param:
  - subject: subject to be validated
  returns:
  - validated subject
*/
function validateSubject(subject): ValidatedSubject[] {
  const validatedSubjects: ValidatedSubject[] = [];

  // In case of Bestuursorgaan, multiple shapes can match the subject
  const blueprintShapeKeys = BLUEPRINT.filter(
    (b) => b.get('p')!.value === 'http://www.w3.org/ns/shacl#targetClass' && b.get('o')!.value === subject.class,
  );
    for (const b of blueprintShapeKeys) {
     const blueprintShapeKey = b.get('s')!.value;
    const blueprintShape: Bindings[] = BLUEPRINT.filter((b) => b.get('s')!.value === blueprintShapeKey);
    const propertyKeys: string[] = filterTermsByValue(blueprintShape, 'o', 'p', 'http://www.w3.org/ns/shacl#property');

    const validatedProperties = [];
    let validCount = 0;

    propertyKeys.forEach((propertyKey) => {
      const propertyShape: Bindings[] = BLUEPRINT.filter((b) => b.get('s')!.value === propertyKey);
      const validatedProperty: ValidatedProperty = validateProperty(subject, propertyShape);
      if (validatedProperty.valid) validCount++;
      validatedProperties.push(validatedProperty);
    });

    validatedSubjects.push({
      uri: subject.uri,
      class: subject.class,
      className: subject.class ? formatURI(subject.class!) : 'Unknown class',
      usedShape: blueprintShapeKey,
      shapeName: blueprintShapeKey ? formatURI(blueprintShapeKey!) : 'Unknown shape',
      totalCount: propertyKeys.length,
      validCount,
      properties: validatedProperties,
    });
  }
  if (validatedSubjects.length) return validatedSubjects;

  const propertyKeys: string[] = getUniqueValues(subject.properties.map((p) => p.path)) as string[];
  const processedProperties: ProcessedProperty[] = [];
  propertyKeys.forEach((p) => {
    processedProperties.push(processProperty(subject, p));
  });
  return [{
    uri: subject.uri,
    class: subject.class,
    className: subject.class ? formatURI(subject.class!) : 'Unknown class',
    properties: processedProperties,
    totalCount: subject.properties.length,
  }];
}

/* function to validate the properties of a subject
  param:
  - subject: array of properties to be validated
  - propertyShape: the blueprint shape of the validated property
  - blueprint: complete blueprint
  returns:
  - subject with validated properties
*/
function validateProperty(subject, propertyShape: Bindings[]): ValidatedProperty {
  // instantiate default value
  const validatedProperty: ValidatedProperty = {
    name: 'Naam niet gevonden',
    description: 'Beschrijving niet gevonden',
    path: 'URI niet gevonden',
    value: ['Waarde niet gevonden'],
    minCount: 0,
    actualCount: 0,
    valid: false,
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
        validatedProperty.minCount = parseInt(p.get('o')!.value, 10);
        break;
      }
      case 'http://www.w3.org/ns/shacl#maxCount': {
        validatedProperty.maxCount = parseInt(p.get('o')!.value, 10);
        break;
      }
      case 'http://lblod.data.gift/vocabularies/besluit/maturiteitsniveau': {
        validatedProperty.maturityLevel = p.get('o')!.value;
        break;
      }
      default: {
        break;
      }
    }
  });

  const values = [];
  const ps = subject.properties
    .filter((p) => p.path === validatedProperty.path);
  for (const s of ps) {
    if (s.value !== undefined && s.value.class !== undefined) {
      for (const v of validateSubject(s.value)) {
        values.push(v);
      }
    } else values.push(s.value);
  }
  
  // Overwrite default value "Waarde niet gevonden" when actual values are found
  if (values.length) {
    validatedProperty.value = values;
    validatedProperty.actualCount = validatedProperty.value.length;
  }

  // Count of isGehoudenDoor is based on distinct instances
  if (validatedProperty.path === 'http://data.vlaanderen.be/ns/besluit#isGehoudenDoor' || validatedProperty.path === 'https://data.vlaanderen.be/ns/generiek#isTijdspecialisatieVan' || validatedProperty.path === 'http://data.vlaanderen.be/ns/mandaat#isTijdspecialisatieVan') {
    const distinctBestuursorganen = [];
    for (const v of validatedProperty.value) {
       // typecast and check if the function exists
      if ((v as ValidatedSubject).uri) {
        const uri = (v as ValidatedSubject).uri;
        if (distinctBestuursorganen.indexOf(uri) === -1) distinctBestuursorganen.push(uri);
      }
    }
    validatedProperty.actualCount = distinctBestuursorganen.length;
  }

  validatedProperty.valid =
    (validatedProperty.minCount === undefined || validatedProperty.actualCount >= validatedProperty.minCount) &&
    (validatedProperty.maxCount === undefined || validatedProperty.actualCount <= validatedProperty.maxCount) &&
    ((validatedProperty.targetClass === undefined ||
      validatedProperty.value === undefined ||
      !validatedProperty.value.some((v) => v.class !== validatedProperty.targetClass
      )) ||
      (validatedProperty.targetClass === 'http://www.w3.org/ns/prov#Location' && validatedProperty.actualCount > 0) ||
      (validatedProperty.targetClass === 'http://data.lblod.info/vocabularies/leidinggevenden/Functionaris' 
        && validatedProperty.value.every((v) => {
          if(typeof v !== "string") {
            const vTyped = v as ValidatedSubject;
            return vTyped.class === validatedProperty.targetClass || vTyped.class === 'http://data.vlaanderen.be/ns/mandaat#Mandataris'
          } else {
            return false;
          }
      })) ||
      validatedProperty.value.every((v) => typeof v === 'string' && v.startsWith('http')) ||
      validatedProperty.actualCount === 0 && validatedProperty.minCount === 0
    );
  if (
    !validatedProperty.valid &&
    MATURITY_LEVEL.includes(validatedProperty.maturityLevel) &&
    validatedProperty.maturityLevel <= FOUND_MATURITY
  ) {
    FOUND_MATURITY = MATURITY_LEVEL[MATURITY_LEVEL.indexOf(validatedProperty.maturityLevel) - 1];
  }
  return validatedProperty;
}

/* function to process a property which has no shape for validation
  param:
  - subject: array of properties to be validated
  - propertyShape: the blueprint shape of the validated property
  - blueprint: complete blueprint
  returns:
  - subject with validated properties
*/
function processProperty(subject, propertyKey): ProcessedProperty {
  const processProperty: ProcessedProperty = {
    name: formatURI(propertyKey),
    path: propertyKey,
    value: ['Waarde niet gevonden'],
    actualCount: 0,
  };

  if (processProperty.path === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
    processProperty.value = [subject.class];
  } else {
    const values = [];
    const ps = subject.properties
      .filter((p) => p.path === processProperty.path);
    for (const s of ps) {
      if (s.value !== undefined && s.value.class !== undefined) {
        for (const v of validateSubject(s.value)) {
          values.push(v);
        }
      } else values.push(s.value);
    }

    // Overwrite default value "Waarde niet gevonden" when actual values are found
    if (values.length) {
      processProperty.value = values;
      processProperty.actualCount = processProperty.value.length;
    }
  };

  return processProperty;
}
  
/* function to aggregate a document
  param:
  - validatedSubjects: subjects that have gone through validation
  returns:
  - an array of collections, a collection contains all the root objects in the publication that share the same RDF class
*/
async function postProcess(validatedSubjects: ValidatedSubject[]): Promise<ClassCollection[]> {
  const classes: ClassCollection[] = []
  // Combine all Root objects with the same type into one collection
  const distinctClasses: string[] = getUniqueValues((validatedSubjects.map((p) => p.class))) as string[];
  const targetClasses: string[] = BLUEPRINT
    .filter((b) => b.get('p')!.value === 'http://www.w3.org/ns/shacl#targetClass')
    .filter((b) => b.get('o')!.value !== 'http://data.vlaanderen.be/ns/besluit#Bestuursorgaan')
    .map((b) => b.get('o')!.value);
  const rootClasses: string[] = distinctClasses.filter((c) => targetClasses.indexOf(c) !== -1);
  rootClasses.forEach(c => {
    const objects: ValidatedSubject[] = validatedSubjects.filter(s => s.class === c)
    classes.push({
      classURI: c,
      className: formatURI(c),
      count: objects.length,
      objects,
    });
  });
  const result: ClassCollection[] = await enrichClassCollectionsWithExample(classes, BLUEPRINT, EXAMPLE);
  return result;
}
