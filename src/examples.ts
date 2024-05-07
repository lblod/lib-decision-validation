import type { ValidatedSubject, ValidatedProperty, ParsedSubject, ParsedProperty } from './types';
import { getDOMfromUrl, getStoreFromSPOBindings, runQueryOverStore } from './utils';
import { Store } from "n3";
import { Bindings } from "@comunica/types";
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

export async function enrichValidationResultWithExample(results: ValidatedSubject[], blueprint: Bindings[], example: DOMNode[], usageNotes?: Bindings[]): Promise<ValidatedSubject[]> {
    let enrichedResults: ValidatedSubject[] = results;
    if (!usageNotes) usageNotes = await getTargetClassPropertyPathAndUsageNotesFromBlueprint(blueprint);
    
    for (let result of enrichedResults) {
        const targetClass = result.type;
        for (let p of result.properties) {
            const propertyPath = p.path;
            const usageNote = getUsageNoteFromBindings(usageNotes, targetClass, propertyPath);
            if (usageNote != '') {
                const exampleElement: Element | null = getElementById(usageNote, example);
                if (exampleElement != null) {
                    p.example = render(exampleElement);
                }
            }
            if (p.value.length > 0 && typeof p.value[0] === "object") {
                result = (await enrichValidationResultWithExample(<ValidatedSubject[]>p.value, blueprint, example, usageNotes))[0];
            }
        };
    };

    return results;
}