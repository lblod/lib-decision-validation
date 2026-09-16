// rdf-ext and shacl-engine ship ESM-only. This is imported statically so the ESM build of this package
// (and the tests, which run under Jest's ESM mode) load them natively. The CJS build compiles this
// static import to a require() call, which only works on a Node runtime able to require() ESM modules
// (Node >=20.19 or >=22.12) — see the "engines" field in package.json.
import { Bindings } from '@comunica/types';
import { BindingsFactory } from '@comunica/utils-bindings-factory';
import type { DatasetCore, NamedNode, Term } from '@rdfjs/types';
import { Writer } from 'n3';
import rdf from 'rdf-ext';
import { DataFactory } from 'rdf-data-factory';
import { Validator } from 'shacl-engine';
import { targetResolvers, validations } from 'shacl-engine/sparql.js';
import { ValidationResult } from './types';

const DF = new DataFactory();
const BF = new BindingsFactory(DF);

// Plain RDF/JS term literals: dataset.match() only needs `termType`/`value` (and `equals` on the
// stored side) to compare terms, so query-side helpers below don't need a real DataFactory.
const SH = 'http://www.w3.org/ns/shacl#';
const namedNode = (value: string): NamedNode => ({ termType: 'NamedNode', value } as NamedNode);
const sh = (term: string): NamedNode => namedNode(`${SH}${term}`);

const SH_SELECT = sh('select').value;
const SH_FOCUS_NODE = sh('focusNode');
const SH_RESULT_PATH = sh('resultPath');
const SH_RESULT_MESSAGE = sh('resultMessage');
const SH_RESULT_SEVERITY = sh('resultSeverity');
const SH_VALUE = sh('value');
const SH_SOURCE_SHAPE = sh('sourceShape');
const SH_SOURCE_CONSTRAINT_COMPONENT = sh('sourceConstraintComponent');
const SH_SPARQL_CONSTRAINT_COMPONENT = sh('SPARQLConstraintComponent');

// @lblod/lib-decision-shapes writes sh:sparql SELECT queries for a previous, string-substitution based
// SPARQL constraint implementation: $this was textually replaced by the focus node IRI, so casting it
// back into a projected variable ("select ($this as ?this) ...") was needed to get a ?this binding back
// out. shacl-engine instead pre-binds ?this as a real SPARQL variable before running the query, and
// SPARQL does not allow rebinding an already-bound variable, so that redundant cast now fails with
// "Tried to bind variable ?this in a BIND operator". It is safe to drop: ?this is already the focus node.
const THIS_AS_THIS_PATTERN = /\(\s*\$this\s+as\s+\?this\s*\)/gi;

function sanitizeShapeBindings(shapeBindings: Bindings[]): Bindings[] {
  return shapeBindings.map((b) => {
    const select = b.get('p')?.value === SH_SELECT ? b.get('o') : undefined;
    if (!select || select.termType !== 'Literal') return b;
    const sanitized = select.value.replace(THIS_AS_THIS_PATTERN, '$this');
    if (sanitized === select.value) return b;
    return BF.fromRecord({
      s: b.get('s')!,
      p: b.get('p')!,
      o: DF.literal(sanitized, (select as any).language || (select as any).datatype),
    });
  });
}

export type ShaclValidationReport = {
  conforms: boolean;
  // the SHACL Validation Report as linked data, see https://www.w3.org/TR/shacl/#validation-report
  dataset: DatasetCore;
};

// converts a RDF/JS term coming from Comunica bindings into an rdf-ext term, so it can be added to an
// rdf-ext dataset regardless of which DataFactory originally created it
function toRdfExtTerm(term: Term): Term {
  switch (term.termType) {
    case 'NamedNode':
      return rdf.namedNode(term.value);
    case 'BlankNode':
      return rdf.blankNode(term.value);
    case 'Literal':
      return rdf.literal(term.value, term.language || rdf.namedNode(term.datatype.value));
    default:
      return term;
  }
}

function toDataset(bindings: Bindings[]): DatasetCore {
  return rdf.dataset(
    bindings.map((b) => rdf.quad(toRdfExtTerm(b.get('s')!), toRdfExtTerm(b.get('p')!), toRdfExtTerm(b.get('o')!))),
  );
}

// mirrors the "starts with http" heuristic already used throughout this codebase to distinguish a
// dereferenceable URI from a blank node label
function toFocusNodeTerm(uri: string): Term {
  return (uri.startsWith('http') ? { termType: 'NamedNode', value: uri } : { termType: 'BlankNode', value: uri }) as Term;
}

/* runs a SHACL validation of a publication against a blueprint, using shacl-engine (an RDF/JS SHACL
   engine operating on rdf-ext datasets). sh:sparql based constraints and targets are supported through
   the engine's sparql plugin.
   param:
   - dataBindings: the publication (and any dereferenced/enriched triples) to validate
   - shapeBindings: the SHACL shapes (blueprint) to validate against
   returns:
   - the SHACL validation report, exposing both a `conforms` flag and the report as linked data
*/
export async function runShaclValidation(dataBindings: Bindings[], shapeBindings: Bindings[]): Promise<ShaclValidationReport> {
  const shapesDataset = toDataset(sanitizeShapeBindings(shapeBindings));
  const dataDataset = toDataset(dataBindings);
  const validator = new Validator(shapesDataset, { factory: rdf, targetResolvers, validations });
  const report = await validator.validate({ dataset: dataDataset });
  return { conforms: report.conforms, dataset: report.dataset };
}

function resultNodesForFocusNode(report: ShaclValidationReport, focusNodeUri: string): Term[] {
  const focusNode = toFocusNodeTerm(focusNodeUri);
  return [...report.dataset.match(null, SH_FOCUS_NODE, focusNode as any)].map((q) => q.subject);
}

function hasQuad(report: ShaclValidationReport, subject: Term, predicate: NamedNode, object: Term): boolean {
  return report.dataset.match(subject as any, predicate, object as any).size > 0;
}

/* determines whether a specific SHACL property is conform for a given subject
   param:
   - report: the SHACL validation report produced by runShaclValidation
   - focusNodeUri: uri of the subject under consideration
   - propertyPath: predicate this property validates
   - scopeShapeTerms: terms identifying the shapes whose violations count towards this property — the
     sh:property shape itself, but also its owning sh:NodeShape, since a node-shape-level sh:sparql
     constraint can target a specific property by binding ?path (e.g. flagging a blank-node mandataris
     for besluit:heeftVoorstander), and such a violation should still make that property invalid
   returns:
   - true when no violation raised against any of these shapes targets this property's path
*/
export function isPropertyConform(
  report: ShaclValidationReport,
  focusNodeUri: string,
  propertyPath: string,
  scopeShapeTerms: Term[],
): boolean {
  const path = namedNode(propertyPath);
  const resultNodes = resultNodesForFocusNode(report, focusNodeUri);
  return !resultNodes.some(
    (resultNode) =>
      hasQuad(report, resultNode, SH_RESULT_PATH, path) &&
      scopeShapeTerms.some((shapeTerm) => hasQuad(report, resultNode, SH_SOURCE_SHAPE, shapeTerm)),
  );
}

/* collects the sh:sparql based constraint violations raised for a given shape (a sh:NodeShape for
   subject-level constraints, or a sh:property shape for property-level ones)
   param:
   - report: the SHACL validation report produced by runShaclValidation
   - focusNodeUri: uri of the subject under consideration
   - shapeTerm: term identifying the shape that declares the sh:sparql constraint
   returns:
   - validation results, in the same shape produced by the previous Comunica-based implementation
*/
export function getSparqlValidationResults(
  report: ShaclValidationReport,
  focusNodeUri: string,
  shapeTerm: Term,
): ValidationResult[] {
  const resultNodes = resultNodesForFocusNode(report, focusNodeUri).filter(
    (resultNode) =>
      hasQuad(report, resultNode, SH_SOURCE_SHAPE, shapeTerm) &&
      hasQuad(report, resultNode, SH_SOURCE_CONSTRAINT_COMPONENT, SH_SPARQL_CONSTRAINT_COMPONENT),
  );

  return resultNodes.map((resultNode) => {
    const get = (predicate: NamedNode) => [...report.dataset.match(resultNode as any, predicate, null)][0]?.object;
    const message = get(SH_RESULT_MESSAGE);
    const severity = get(SH_RESULT_SEVERITY);
    const resultPath = get(SH_RESULT_PATH);
    const value = get(SH_VALUE);

    const result: ValidationResult = {
      focusNode: focusNodeUri,
      resultMessage: message?.value ?? '',
    };
    if (severity) result.resultSeverity = severity.value;
    if (resultPath) result.resultPath = resultPath.value;
    if (value) result.value = value.value;
    return result;
  });
}

/* serializes a SHACL validation report (or any RDF/JS dataset) to a linked data text format
   param:
   - dataset: the dataset to serialize, e.g. ShaclValidationReport.dataset
   - format: the RDF text serialization to produce
   returns:
   - the serialized linked data
*/
export function serializeRdfDataset(dataset: DatasetCore, format: 'text/turtle' | 'application/n-quads' = 'text/turtle'): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new Writer({ format });
    for (const quad of dataset) writer.addQuad(quad as any);
    writer.end((error, result) => (error ? reject(error) : resolve(result)));
  });
}
