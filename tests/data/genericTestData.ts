export const genericExampleData: string = `
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

<http://example.org/subject1> rdf:type foaf:Person ;
                              foaf:name "John Doe" ;
                              foaf:age "30" .

<http://example.org/subject2> rdf:type foaf:Person ;
                              foaf:name "Jane Doe" .

# Invalid person (missing foaf:name)
<http://example.org/subject3> rdf:type foaf:Person ;
                              foaf:age "25" .
`;

export const genericExampleBlueprint: string = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<http://example.org/PersonShape>
  a sh:NodeShape ;
  sh:targetClass foaf:Person ;

  sh:property [
    sh:path foaf:name ;
    sh:datatype xsd:string ;
    sh:minCount 1 ;  # Must have at least one foaf:name
  ] ;

  sh:property [
    sh:path foaf:age ;
    sh:datatype xsd:string ;
    sh:maxCount 1 ;  # Can have at most one foaf:age
  ] .
`;
