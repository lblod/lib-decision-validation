import type { ValidatedSubject, ValidatedProperty, ParsedSubject, ParsedProperty } from './types';
import { ensureDirectoryExistence, getDOMfromUrl, getStoreFromSPOBindings, runQueryOverStore } from './utils';
import { Store } from "n3";
import { Bindings } from "@comunica/types";

async function getTargetClassPropertyPathAndUsageNotesFromBlueprint(blueprint: Bindings[]): Promise<Bindings[]> {
    const store: Store = getStoreFromSPOBindings(blueprint);
    const query = `
      PREFIX sh: <http://www.w3.org/ns/shacl#>
      PREFIX lblodBesluit: <http://lblod.data.gift/vocabularies/besluit/>
      
      SELECT ?targetClass ?path ?usageNote
      WHERE {
          ?s a sh:NodeShape ;
            sh:targetClass ?targetClass .
        
        # Simple property path
        {
          ?s sh:property [
              sh:path ?path ;
              lblodBesluit:usageNote ?usageNote 
          ] .
        } 
        UNION
        # list of alternative property paths
        {
          ?s sh:property [
              sh:path/sh:alternativePath/(rdf:first|rdf:rest)* ?path ;
              lblodBesluit:usageNote ?usageNote
          ] .
          FILTER(?path NOT IN (rdf:nil))
        }
        
        FILTER (!isBlank(?path))
      }
    `;

    return await runQueryOverStore(query, store);
}

function enrichValidatedProperty(validatedProperty: ValidatedProperty, example: HTMLElement): ValidatedProperty {
    return validatedProperty;
}

function getUsageNoteFromBindings(bindings: Bindings[], targetClass: string, propertyPath: string) {
    for (const b of bindings) {
        if (b.get('targetClass').value === targetClass && b.get('path').value === propertyPath) return b.get('usageNote').value;
    }
    return '';
}

export async function enrichValidationResultWithExample(results: ValidatedSubject[], blueprint: Bindings[], example: Document): Promise<ValidatedSubject[]> {
    let enrichedResults: ValidatedSubject[] = results;
    const usageNotes = await getTargetClassPropertyPathAndUsageNotesFromBlueprint(blueprint);
    for (let result of enrichedResults) {
        const targetClass = result.type;
        for (let p of result.properties) {
            const propertyPath = p.path;
            const usageNote = getUsageNoteFromBindings(usageNotes, targetClass, propertyPath);
            console.log(usageNote);
            if (usageNote != '') {
                const exampleElement: HTMLElement | null = example.getElementById(usageNote);
                if (exampleElement != null) p.example = exampleElement.outerHTML;
            }
        };
    };

    return results;
}