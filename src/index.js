"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectedPublications = exports.getBlueprintOfMunicipality = exports.getBlueprintOfMunicipalityOneByOne = exports.getBlueprintOfApplicationProfile = exports.getMandatarisOfVoorzitter = exports.getRelevantPublicationsValue = exports.getRelevantPublicationsWithinTimeInterval = void 0;
const query_sparql_1 = require("@comunica/query-sparql");
const engine = new query_sparql_1.QueryEngine();
const NUMBER_OF_RETRY_COUNTS = 2;
function getRelevantPublicationsWithinTimeInterval({ publications, start, eind, }) {
    return new Promise((resolve, _reject) => __awaiter(this, void 0, void 0, function* () {
        console.log("Filtering on relevant publications");
        const relevantPublications = [];
        for (const p of publications) {
            console.log("Checking for publication " + p + " whether in time interval");
            relevantPublications.push(yield engine.queryBindings(`
            PREFIX org: <http://www.w3.org/ns/org#>
            PREFIX prov: <http://www.w3.org/ns/prov#>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX ns1: <http://www.w3.org/1999/xhtml/vocab#>
            PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
            PREFIX mandaat: <http://data.vlaanderen.be/ns/mandaat#>
            PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
            PREFIX terms: <http://purl.org/dc/terms/>
            PREFIX title: <http://purl.org/dc/terms/title>
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

            SELECT DISTINCT ?bestuursorgaan ?bestuursorgaanLabel
            WHERE {
                # Get start of Zitting
                {
                ?zitting prov:startedAtTime ?startZitting .
                } UNION
                {
                ?zitting besluit:geplandeStart ?startZitting .
                }

                # Get bestuursorgaan
                OPTIONAL {
                ?zitting besluit:isGehoudenDoor ?bo .
                OPTIONAL {
                    ?bo skos:prefLabel ?boLabel .
                }
            }
            BIND(if(bound(?bo) = "true"^^xsd:boolean && !isBlank(?bo), str(?bo),  "onbekend") AS ?bestuursorgaan)
            BIND(if(bound(?boLabel) = "true"^^xsd:boolean, str(?boLabel), "onbekend") AS ?bestuursorgaanLabel)
        }
        `, 
            //   BIND (if(?startZitting > "${start}"^^xsd:dateTime && ?startZitting < "${eind}"^^xsd:dateTime, "true"^^xsd:boolean, "false"^^xsd:boolean) AS ?withinTimeInterval)
            // FILTER (?withinTimeInterval = "true"^^xsd:boolean)
            {
                lenient: true,
                sources: [p],
                httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                httpTimeout: 2000,
                httpRetryDelay: 50,
                httpRetryOnServerError: false,
            }));
        }
        resolve(Object.keys(relevantPublications));
    }));
}
exports.getRelevantPublicationsWithinTimeInterval = getRelevantPublicationsWithinTimeInterval;
function getRelevantPublicationsValue({ publications, }) {
    console.log("Filtering on relevant values");
    // const bindingsStream = await engine.queryBindings(`
    //     SELECT DISTINCT ?o
    //     WHERE {
    //         ?s a ?o .
    //     }
    // `, {
    //     sources: [ publications ],
    // });
    return engine.queryBindings(`
        SELECT DISTINCT ?o
        WHERE {
            ?s a ?o
        }
    `, {
        sources: publications,
    });
}
exports.getRelevantPublicationsValue = getRelevantPublicationsValue;
function getMandatarisOfVoorzitter({ voorzitters, }) {
    return new Promise((resolve, reject) => {
        try {
            const mandatarissen = [];
            let voorzitterString = "";
            voorzitters.map((v) => (voorzitterString += ` <${v}>`));
            engine
                .queryBindings(`
        PREFIX mandaat: <http://data.vlaanderen.be/ns/mandaat#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

    SELECT DISTINCT ?mandataris {
    ?voorzitter a mandaat:Mandataris ;
                mandaat:isBestuurlijkeAliasVan ?persoon .
    ?mandataris a mandaat:Mandataris ;
                mandaat:isBestuurlijkeAliasVan ?persoon .
    FILTER (?mandataris != ?voorzitter)

    VALUES ?voorzitter {
        ${voorzitterString}
    }
    }
        `, {
                sources: ["https://dev.centrale-vindplaats.lblod.info/sparql"],
                lenient: true,
                httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                httpTimeout: 60000,
                httpRetryDelay: 2000,
                httpRetryOnServerError: true,
            })
                .then(function (bindingsStream) {
                bindingsStream.on("data", (data) => {
                    mandatarissen.push(data.get("mandataris").value);
                });
                bindingsStream.on("end", () => {
                    resolve(mandatarissen);
                });
                bindingsStream.on("error", (error) => {
                    console.log(error);
                    reject(error);
                });
            });
        }
        catch (e) {
            console.log("jup");
            reject(e);
        }
    });
}
exports.getMandatarisOfVoorzitter = getMandatarisOfVoorzitter;
function getBlueprintOfApplicationProfile() {
    const AP = "https://raw.githubusercontent.com/brechtvdv/demo-data/master/besluit-publicatie-SHACL.ttl";
    return new Promise((resolve, reject) => {
        try {
            const blueprint = [];
            engine
                .queryBindings(`
        PREFIX sh: <http://www.w3.org/ns/shacl#>
        PREFIX lblodBesluit: <http://lblod.data.gift/vocabularies/besluit/>
        SELECT DISTINCT ?classUri ?propertyUri ?className ?propertyName ?name ?niveau
        WHERE {
            {
                ?s sh:targetClass ?classUri .
                OPTIONAL {
                    ?s sh:name ?name .
                }
                OPTIONAL {
                    ?s lblodBesluit:maturiteitsniveau ?niveau .
                }
                }
                UNION
                {
                ?node sh:targetClass ?classUri ;
                        sh:property ?s ;
                        sh:name ?className .
                ?s sh:path ?propertyUri .
                OPTIONAL {
                    ?s sh:name ?propertyName .
                }
                OPTIONAL {
                    ?s lblodBesluit:maturiteitsniveau ?niveau .
                }
                BIND (concat(?className, ' - ', ?propertyName) AS ?name)
            }
        }
        `, {
                sources: [AP],
                httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                httpRetryDelay: 2000,
                httpRetryOnServerError: true,
            })
                .then(function (bindingsStream) {
                bindingsStream.on("data", (data) => {
                    const v = {};
                    v["propertyUri"] = data.get("propertyUri")
                        ? data.get("propertyUri").value
                        : "";
                    v["classUri"] = data.get("classUri")
                        ? data.get("classUri").value
                        : "";
                    v["propertyName"] = data.get("propertyName")
                        ? data.get("propertyName").value
                        : "";
                    v["className"] = data.get("className")
                        ? data.get("className").value
                        : "";
                    v["name"] = data.get("name") ? data.get("name").value : "";
                    v["niveau"] = data.get("niveau") ? data.get("niveau").value : "";
                    blueprint.push(v);
                });
                bindingsStream.on("end", () => {
                    resolve(blueprint);
                });
                bindingsStream.on("error", (error) => {
                    console.log(error);
                    reject(error);
                });
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
exports.getBlueprintOfApplicationProfile = getBlueprintOfApplicationProfile;
function getBlueprintOfMunicipalityOneByOne({ publications, }) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const checkedBindings = [];
            const blueprint = [];
            const blueprintObject = {};
            if (publications.length === 0) {
                return Promise.resolve(blueprint);
            }
            for (const p of publications) {
                console.log("check publication for blueprint of municipality " +
                    publications.length);
                const bindingsStream = yield engine.queryBindings(`
            select DISTINCT *
            where {
                {
                    SELECT ?classUri ?classInstance
                    WHERE {
                        ?classInstance a ?classUri .
                    }
                }
                UNION
                {
                    select ?classUri ?propertyUri ?classInstance
                    where {
                        ?classInstance a ?classUri ;
                            ?propertyUri ?value .
                        FILTER (?propertyUri != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
                    }
                }
            }
                `, {
                    sources: [p],
                    //sources: publications,
                    lenient: true,
                    httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                    httpRetryDelay: 2000,
                    httpRetryOnServerError: false,
                });
                const bindings = yield bindingsStream.toArray();
                for (const data of bindings) {
                    const classUri = (_a = data.get("classUri")) === null || _a === void 0 ? void 0 : _a.value;
                    const propertyUri = data.get("propertyUri")
                        ? (_b = data.get("propertyUri")) === null || _b === void 0 ? void 0 : _b.value
                        : "";
                    const classInstance = (_c = data.get("classInstance")) === null || _c === void 0 ? void 0 : _c.value;
                    if (!blueprintObject[classUri])
                        blueprintObject[classUri] = {};
                    if (!blueprintObject[classUri][propertyUri])
                        blueprintObject[classUri][propertyUri] = [];
                    if (!blueprintObject[classUri][propertyUri].includes(classInstance))
                        blueprintObject[classUri][propertyUri].push(classInstance);
                }
            }
            // Convert JSON object to blueprint array
            for (const classUri of Object.keys(blueprintObject)) {
                for (const propertyUri of Object.keys(blueprintObject[classUri])) {
                    blueprint.push({
                        classUri: classUri,
                        propertyUri: propertyUri,
                        count: blueprintObject[classUri][propertyUri].length,
                    });
                }
            }
            Promise.resolve(blueprint);
        }
        catch (e) {
            console.log("LENNY");
            reject(e);
        }
    }));
}
exports.getBlueprintOfMunicipalityOneByOne = getBlueprintOfMunicipalityOneByOne;
function getBlueprintOfMunicipality({ publications, }) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const checkedBindings = [];
            const blueprint = [];
            if (publications.length === 0)
                return Promise.resolve(blueprint);
            // for (let p of publications) {
            console.log("check publication for blueprint of municipality " + publications.length);
            engine
                .queryBindings(`
            select DISTINCT *
            where {
    {
            SELECT ?classUri (str(COUNT(DISTINCT ?classInstance)) AS ?count)
        WHERE {
                    ?classInstance a ?classUri .
            }
    GROUP BY ?classUri
    }
            UNION
    {
        select ?classUri ?propertyUri (str(count(DISTINCT ?classInstance)) as ?count)
        where {

        ?classInstance a ?classUri ;
                        ?propertyUri ?value .
        FILTER (?propertyUri != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
        }
        GROUP BY ?classUri ?propertyUri
    }
            }
                `, {
                // sources: [p],
                sources: publications,
                lenient: true,
                httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                httpRetryDelay: 2000,
                httpRetryOnServerError: false,
            })
                .then(function (bindingsStream) {
                bindingsStream.on("data", (data) => {
                    const tmp = {};
                    tmp["classUri"] = data.get("classUri").value;
                    tmp["propertyUri"] = data.get("propertyUri")
                        ? data.get("propertyUri").value
                        : "";
                    tmp["count"] = parseInt(data.get("count").value);
                    blueprint.push(tmp);
                });
                bindingsStream.on("end", () => {
                    Promise.resolve(blueprint);
                });
                bindingsStream.on("error", (error) => {
                    console.log(error);
                    reject(error);
                });
            });
        }
        catch (e) {
            console.log("LENNY");
            reject(e);
        }
    }));
}
exports.getBlueprintOfMunicipality = getBlueprintOfMunicipality;
function getCollectedPublications({ municipalityLabel, }) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const collectedPublications = [];
            engine
                .queryBindings(`
            PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
            PREFIX dcterms: <http://purl.org/dc/terms/>
            select DISTINCT ?cleanUrl
            where {
                ?job dcterms:creator ?scheduledJob .
                ?scheduledJob dcterms:title "${municipalityLabel}" .

                ?task dcterms:isPartOf ?job ;
                        <http://redpencil.data.gift/vocabularies/tasks/index> ?taskIndex ;
                        <http://redpencil.data.gift/vocabularies/tasks/inputContainer> [
                        <http://redpencil.data.gift/vocabularies/tasks/hasHarvestingCollection> [
                            dcterms:hasPart [
                                nie:url ?url
                            ]
                        ]
                        ]

                FILTER (?taskIndex = "1")
                BIND (uri(REPLACE(str(?url), ";jsessionid=[a-zA-Z;0-9]*", "", "i")) as ?cleanUrl)
            }
            `, {
                sources: ["https://dev.harvesting-self-service.lblod.info/sparql"],
                httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                httpRetryDelay: 10000,
                httpRetryOnServerError: true,
            })
                .then(function (bindingsStream) {
                bindingsStream.on("data", (data) => {
                    // Each variable binding is an RDFJS term
                    collectedPublications.push(data.get("cleanUrl").value);
                });
                bindingsStream.on("end", () => {
                    Promise.resolve(collectedPublications);
                });
                bindingsStream.on("error", (error) => {
                    console.log(error);
                    reject(error);
                });
            });
        }
        catch (e) {
            reject(e);
        }
    }));
}
exports.getCollectedPublications = getCollectedPublications;
