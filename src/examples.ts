import type { ValidatedSubject, ValidatedProperty, ParsedSubject, ParsedProperty, ClassCollection } from './types';
import { getStoreFromSPOBindings, runQueryOverStore } from './utils';
import { Store } from 'n3';
import { Bindings } from '@comunica/types';
import { DOMNode, Element } from 'html-dom-parser';
import { getElementById } from 'domutils';
import { render } from 'dom-serializer';

async function getTargetClassPropertyPathAndUsageNotesFromBlueprint(blueprint: Bindings[]): Promise<Bindings[]> {
  const store: Store = getStoreFromSPOBindings(blueprint);
  const query = `
      PREFIX sh: <http://www.w3.org/ns/shacl#>
      PREFIX lblodBesluit: <http://lblod.data.gift/vocabularies/besluit/>
      
      SELECT ?targetClass ?path ?usageNote
      WHERE {
          ?s a sh:NodeShape ;
            sh:targetClass ?targetClass .
                
          ?s sh:property [
              sh:path ?path ;
              lblodBesluit:usageNote ?usageNote 
          ] .
        
        FILTER (!isBlank(?path))
      }
    `;

  return await runQueryOverStore(query, store);
}

function getUsageNoteFromBindings(bindings: Bindings[], targetClass: string, propertyPath: string) {
  for (const b of bindings) {
    if (b.get('targetClass').value === targetClass && b.get('path').value === propertyPath)
      return b.get('usageNote').value;
  }
  return '';
}

export async function enrichClassCollectionsWithExample(
  classCollections: ClassCollection[],
  blueprint: Bindings[],
  example: DOMNode[],
): Promise<ClassCollection[]> {
  const enrichedClassCollections: ClassCollection[] = classCollections;

  for (const c of enrichedClassCollections) {
    c.objects = await enrichValidationResultWithExample(c.objects, blueprint, example);
  }

  return enrichedClassCollections;
}

async function enrichValidationResultWithExample(
  results: ValidatedSubject[],
  blueprint: Bindings[],
  example: DOMNode[],
  usageNotes?: Bindings[],
): Promise<ValidatedSubject[]> {
  const enrichedResults: ValidatedSubject[] = results;
  if (!usageNotes) usageNotes = await getTargetClassPropertyPathAndUsageNotesFromBlueprint(blueprint);

  for (let result of enrichedResults) {
    if (result.class) {
      const targetClass = result.class;
      for (const p of result.properties) {
        const propertyPath = p.path;
        const usageNote = getUsageNoteFromBindings(usageNotes, targetClass, propertyPath);
        if (usageNote !== '') {
          const exampleElement: Element | null = getElementById(usageNote, example);
          if (exampleElement != null) {
            p.example = render(exampleElement);
          }
        }
        if (p.value.length > 0 && typeof p.value[0] === 'object') {
          result = (
            await enrichValidationResultWithExample(p.value as ValidatedSubject[], blueprint, example, usageNotes)
          )[0];
        }
      }
    }
  }

  return enrichedResults;
}
