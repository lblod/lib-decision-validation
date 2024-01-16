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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectedPublications = exports.getBlueprintOfMunicipality = exports.getBlueprintOfMunicipalityOneByOne = exports.getBlueprintOfApplicationProfile = exports.getMandatarisOfVoorzitter = exports.getRelevantPublicationsValue = exports.getRelevantPublicationsWithinTimeInterval = void 0;
/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
var query_sparql_1 = require("@comunica/query-sparql");
var engine = new query_sparql_1.QueryEngine();
var NUMBER_OF_RETRY_COUNTS = 2;
function getRelevantPublicationsWithinTimeInterval(_a) {
    var _this = this;
    var publications = _a.publications, start = _a.start, eind = _a.eind;
    return new Promise(function (resolve, _reject) { return __awaiter(_this, void 0, void 0, function () {
        var relevantPublications, _i, publications_1, p, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('Filtering on relevant publications');
                    relevantPublications = [];
                    _i = 0, publications_1 = publications;
                    _c.label = 1;
                case 1:
                    if (!(_i < publications_1.length)) return [3 /*break*/, 4];
                    p = publications_1[_i];
                    console.log('Checking for publication ' + p + ' whether in time interval');
                    _b = (_a = relevantPublications).push;
                    return [4 /*yield*/, engine.queryBindings("\n            PREFIX org: <http://www.w3.org/ns/org#>\n            PREFIX prov: <http://www.w3.org/ns/prov#>\n            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n            PREFIX ns1: <http://www.w3.org/1999/xhtml/vocab#>\n            PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>\n            PREFIX mandaat: <http://data.vlaanderen.be/ns/mandaat#>\n            PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n            PREFIX terms: <http://purl.org/dc/terms/>\n            PREFIX title: <http://purl.org/dc/terms/title>\n            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n            PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>\n            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n\n            SELECT DISTINCT ?bestuursorgaan ?bestuursorgaanLabel\n            WHERE {\n                # Get start of Zitting\n                {\n                ?zitting prov:startedAtTime ?startZitting .\n                } UNION\n                {\n                ?zitting besluit:geplandeStart ?startZitting .\n                }\n\n                # Get bestuursorgaan\n                OPTIONAL {\n                ?zitting besluit:isGehoudenDoor ?bo .\n                OPTIONAL {\n                    ?bo skos:prefLabel ?boLabel .\n                }\n            }\n            BIND(if(bound(?bo) = \"true\"^^xsd:boolean && !isBlank(?bo), str(?bo),  \"onbekend\") AS ?bestuursorgaan)\n            BIND(if(bound(?boLabel) = \"true\"^^xsd:boolean, str(?boLabel), \"onbekend\") AS ?bestuursorgaanLabel)\n        }\n        ", 
                        //   BIND (if(?startZitting > "${start}"^^xsd:dateTime && ?startZitting < "${eind}"^^xsd:dateTime, "true"^^xsd:boolean, "false"^^xsd:boolean) AS ?withinTimeInterval)
                        // FILTER (?withinTimeInterval = "true"^^xsd:boolean)
                        {
                            lenient: true,
                            sources: [p],
                            httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                            httpTimeout: 2000,
                            httpRetryDelay: 50,
                            httpRetryOnServerError: false,
                        })];
                case 2:
                    _b.apply(_a, [_c.sent()]);
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    resolve(Object.keys(relevantPublications));
                    return [2 /*return*/];
            }
        });
    }); });
}
exports.getRelevantPublicationsWithinTimeInterval = getRelevantPublicationsWithinTimeInterval;
function getRelevantPublicationsValue(_a) {
    var publications = _a.publications;
    console.log('Filtering on relevant values');
    // const bindingsStream = await engine.queryBindings(`
    //     SELECT DISTINCT ?o
    //     WHERE {
    //         ?s a ?o .
    //     }
    // `, {
    //     sources: [ publications ],
    // });
    return engine.queryBindings("\n        SELECT DISTINCT ?o\n        WHERE {\n            ?s a ?o\n        }\n    ", {
        sources: publications,
    });
}
exports.getRelevantPublicationsValue = getRelevantPublicationsValue;
function getMandatarisOfVoorzitter(_a) {
    var voorzitters = _a.voorzitters;
    return new Promise(function (resolve, reject) {
        try {
            var mandatarissen_1 = [];
            var voorzitterString_1 = '';
            voorzitters.map(function (v) { return (voorzitterString_1 += " <".concat(v, ">")); });
            engine
                .queryBindings("\n        PREFIX mandaat: <http://data.vlaanderen.be/ns/mandaat#>\n    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n\n    SELECT DISTINCT ?mandataris {\n    ?voorzitter a mandaat:Mandataris ;\n                mandaat:isBestuurlijkeAliasVan ?persoon .\n    ?mandataris a mandaat:Mandataris ;\n                mandaat:isBestuurlijkeAliasVan ?persoon .\n    FILTER (?mandataris != ?voorzitter)\n\n    VALUES ?voorzitter {\n        ".concat(voorzitterString_1, "\n    }\n    }\n        "), {
                sources: ['https://dev.centrale-vindplaats.lblod.info/sparql'],
                lenient: true,
                httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                httpTimeout: 60000,
                httpRetryDelay: 2000,
                httpRetryOnServerError: true,
            })
                .then(function (bindingsStream) {
                bindingsStream.on('data', function (data) {
                    mandatarissen_1.push(data.get('mandataris').value);
                });
                bindingsStream.on('end', function () {
                    resolve(mandatarissen_1);
                });
                bindingsStream.on('error', function (error) {
                    console.log(error);
                    reject(error);
                });
            });
        }
        catch (e) {
            console.log('jup');
            reject(e);
        }
    });
}
exports.getMandatarisOfVoorzitter = getMandatarisOfVoorzitter;
function getBlueprintOfApplicationProfile() {
    var AP = 'https://raw.githubusercontent.com/brechtvdv/demo-data/master/besluit-publicatie-SHACL.ttl';
    return new Promise(function (resolve, reject) {
        try {
            var blueprint_1 = [];
            engine
                .queryBindings("\n        PREFIX sh: <http://www.w3.org/ns/shacl#>\n        PREFIX lblodBesluit: <http://lblod.data.gift/vocabularies/besluit/>\n        SELECT DISTINCT ?classUri ?propertyUri ?className ?propertyName ?name ?niveau\n        WHERE {\n            {\n                ?s sh:targetClass ?classUri .\n                OPTIONAL {\n                    ?s sh:name ?name .\n                }\n                OPTIONAL {\n                    ?s lblodBesluit:maturiteitsniveau ?niveau .\n                }\n                }\n                UNION\n                {\n                ?node sh:targetClass ?classUri ;\n                        sh:property ?s ;\n                        sh:name ?className .\n                ?s sh:path ?propertyUri .\n                OPTIONAL {\n                    ?s sh:name ?propertyName .\n                }\n                OPTIONAL {\n                    ?s lblodBesluit:maturiteitsniveau ?niveau .\n                }\n                BIND (concat(?className, ' - ', ?propertyName) AS ?name)\n            }\n        }\n        ", {
                sources: [AP],
                httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                httpRetryDelay: 2000,
                httpRetryOnServerError: true,
            })
                .then(function (bindingsStream) {
                bindingsStream.on('data', function (data) {
                    var v = {};
                    v['propertyUri'] = data.get('propertyUri')
                        ? data.get('propertyUri').value
                        : '';
                    v['classUri'] = data.get('classUri')
                        ? data.get('classUri').value
                        : '';
                    v['propertyName'] = data.get('propertyName')
                        ? data.get('propertyName').value
                        : '';
                    v['className'] = data.get('className')
                        ? data.get('className').value
                        : '';
                    v['name'] = data.get('name') ? data.get('name').value : '';
                    v['niveau'] = data.get('niveau') ? data.get('niveau').value : '';
                    blueprint_1.push(v);
                });
                bindingsStream.on('end', function () {
                    resolve(blueprint_1);
                });
                bindingsStream.on('error', function (error) {
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
function getBlueprintOfMunicipalityOneByOne(_a) {
    var _this = this;
    var publications = _a.publications;
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        var checkedBindings, blueprint, blueprintObject, _i, publications_2, p, bindingsStream, bindings, _a, bindings_1, data, classUri, propertyUri, classInstance, _b, _c, classUri, _d, _e, propertyUri, e_1;
        var _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    _j.trys.push([0, 6, , 7]);
                    checkedBindings = [];
                    blueprint = [];
                    blueprintObject = {};
                    if (publications.length === 0) {
                        return [2 /*return*/, Promise.resolve(blueprint)];
                    }
                    _i = 0, publications_2 = publications;
                    _j.label = 1;
                case 1:
                    if (!(_i < publications_2.length)) return [3 /*break*/, 5];
                    p = publications_2[_i];
                    console.log('check publication for blueprint of municipality ' +
                        publications.length);
                    return [4 /*yield*/, engine.queryBindings("\n            select DISTINCT *\n            where {\n                {\n                    SELECT ?classUri ?classInstance\n                    WHERE {\n                        ?classInstance a ?classUri .\n                    }\n                }\n                UNION\n                {\n                    select ?classUri ?propertyUri ?classInstance\n                    where {\n                        ?classInstance a ?classUri ;\n                            ?propertyUri ?value .\n                        FILTER (?propertyUri != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)\n                    }\n                }\n            }\n                ", {
                            sources: [p],
                            //sources: publications,
                            lenient: true,
                            httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                            httpRetryDelay: 2000,
                            httpRetryOnServerError: false,
                        })];
                case 2:
                    bindingsStream = _j.sent();
                    return [4 /*yield*/, bindingsStream.toArray()];
                case 3:
                    bindings = _j.sent();
                    for (_a = 0, bindings_1 = bindings; _a < bindings_1.length; _a++) {
                        data = bindings_1[_a];
                        classUri = (_f = data.get('classUri')) === null || _f === void 0 ? void 0 : _f.value;
                        propertyUri = data.get('propertyUri')
                            ? (_g = data.get('propertyUri')) === null || _g === void 0 ? void 0 : _g.value
                            : '';
                        classInstance = (_h = data.get('classInstance')) === null || _h === void 0 ? void 0 : _h.value;
                        if (!blueprintObject[classUri])
                            blueprintObject[classUri] = {};
                        if (!blueprintObject[classUri][propertyUri])
                            blueprintObject[classUri][propertyUri] = [];
                        if (!blueprintObject[classUri][propertyUri].includes(classInstance))
                            blueprintObject[classUri][propertyUri].push(classInstance);
                    }
                    _j.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5:
                    // Convert JSON object to blueprint array
                    for (_b = 0, _c = Object.keys(blueprintObject); _b < _c.length; _b++) {
                        classUri = _c[_b];
                        for (_d = 0, _e = Object.keys(blueprintObject[classUri]); _d < _e.length; _d++) {
                            propertyUri = _e[_d];
                            blueprint.push({
                                classUri: classUri,
                                propertyUri: propertyUri,
                                count: blueprintObject[classUri][propertyUri].length,
                            });
                        }
                    }
                    Promise.resolve(blueprint);
                    return [3 /*break*/, 7];
                case 6:
                    e_1 = _j.sent();
                    console.log('LENNY');
                    reject(e_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
}
exports.getBlueprintOfMunicipalityOneByOne = getBlueprintOfMunicipalityOneByOne;
function getBlueprintOfMunicipality(_a) {
    var _this = this;
    var publications = _a.publications;
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        var checkedBindings, blueprint_2;
        return __generator(this, function (_a) {
            try {
                checkedBindings = [];
                blueprint_2 = [];
                if (publications.length === 0)
                    return [2 /*return*/, Promise.resolve(blueprint_2)];
                // for (let p of publications) {
                console.log('check publication for blueprint of municipality ' +
                    publications.length);
                engine
                    .queryBindings("\n            select DISTINCT *\n            where {\n    {\n            SELECT ?classUri (str(COUNT(DISTINCT ?classInstance)) AS ?count)\n        WHERE {\n                    ?classInstance a ?classUri .\n            }\n    GROUP BY ?classUri\n    }\n            UNION\n    {\n        select ?classUri ?propertyUri (str(count(DISTINCT ?classInstance)) as ?count)\n        where {\n\n        ?classInstance a ?classUri ;\n                        ?propertyUri ?value .\n        FILTER (?propertyUri != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)\n        }\n        GROUP BY ?classUri ?propertyUri\n    }\n            }\n                ", {
                    // sources: [p],
                    sources: publications,
                    lenient: true,
                    httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                    httpRetryDelay: 2000,
                    httpRetryOnServerError: false,
                })
                    .then(function (bindingsStream) {
                    bindingsStream.on('data', function (data) {
                        var tmp = {};
                        tmp['classUri'] = data.get('classUri').value;
                        tmp['propertyUri'] = data.get('propertyUri')
                            ? data.get('propertyUri').value
                            : '';
                        tmp['count'] = parseInt(data.get('count').value);
                        blueprint_2.push(tmp);
                    });
                    bindingsStream.on('end', function () {
                        Promise.resolve(blueprint_2);
                    });
                    bindingsStream.on('error', function (error) {
                        console.log(error);
                        reject(error);
                    });
                });
            }
            catch (e) {
                console.log('LENNY');
                reject(e);
            }
            return [2 /*return*/];
        });
    }); });
}
exports.getBlueprintOfMunicipality = getBlueprintOfMunicipality;
function getCollectedPublications(_a) {
    var _this = this;
    var municipalityLabel = _a.municipalityLabel;
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        var collectedPublications_1;
        return __generator(this, function (_a) {
            try {
                collectedPublications_1 = [];
                engine
                    .queryBindings("\n            PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>\n            PREFIX dcterms: <http://purl.org/dc/terms/>\n            select DISTINCT ?cleanUrl\n            where {\n                ?job dcterms:creator ?scheduledJob .\n                ?scheduledJob dcterms:title \"".concat(municipalityLabel, "\" .\n\n                ?task dcterms:isPartOf ?job ;\n                        <http://redpencil.data.gift/vocabularies/tasks/index> ?taskIndex ;\n                        <http://redpencil.data.gift/vocabularies/tasks/inputContainer> [\n                        <http://redpencil.data.gift/vocabularies/tasks/hasHarvestingCollection> [\n                            dcterms:hasPart [\n                                nie:url ?url\n                            ]\n                        ]\n                        ]\n\n                FILTER (?taskIndex = \"1\")\n                BIND (uri(REPLACE(str(?url), \";jsessionid=[a-zA-Z;0-9]*\", \"\", \"i\")) as ?cleanUrl)\n            }\n            "), {
                    sources: ['https://dev.harvesting-self-service.lblod.info/sparql'],
                    httpRetryCount: NUMBER_OF_RETRY_COUNTS,
                    httpRetryDelay: 10000,
                    httpRetryOnServerError: true,
                })
                    .then(function (bindingsStream) {
                    bindingsStream.on('data', function (data) {
                        // Each variable binding is an RDFJS term
                        collectedPublications_1.push(data.get('cleanUrl').value);
                    });
                    bindingsStream.on('end', function () {
                        Promise.resolve(collectedPublications_1);
                    });
                    bindingsStream.on('error', function (error) {
                        console.log(error);
                        reject(error);
                    });
                });
            }
            catch (e) {
                reject(e);
            }
            return [2 /*return*/];
        });
    }); });
}
exports.getCollectedPublications = getCollectedPublications;
