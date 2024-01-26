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
exports.fetchDocument = exports.getPublicationFromFileContent = exports.determineDocumentType = void 0;
/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
var actor_http_proxy_1 = require("@comunica/actor-http-proxy");
var query_sparql_1 = require("@comunica/query-sparql");
var engine = new query_sparql_1.QueryEngine();
var proxy = 'https://proxy.linkeddatafragments.org/';
/* function to validate a publication
  param:
  - publication: object to be validated
  returns:
  - one of the following valuesL: [besluitenlijst, notulen, agenda]

*/
function determineDocumentType(bindings) {
    // Look for document type predicate if it is present
    for (var _i = 0, bindings_1 = bindings; _i < bindings_1.length; _i++) {
        var b = bindings_1[_i];
        if (b.get('p').value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
            b
                .get('o')
                .value.includes('https://data.vlaanderen.be/id/concept/BesluitDocumentType/')) {
            switch (b.get('o').value) {
                case 'https://data.vlaanderen.be/id/concept/BesluitDocumentType/8e791b27-7600-4577-b24e-c7c29e0eb773': {
                    return 'Notule';
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
exports.determineDocumentType = determineDocumentType;
function getPublicationFromFileContent(content) {
    return __awaiter(this, void 0, void 0, function () {
        var bindingsStream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, engine.queryBindings("\n        SELECT DISTINCT ?s ?p ?o\n        WHERE {\n            ?s ?p ?o .\n        }\n    ", {
                        sources: [
                            {
                                type: 'stringSource',
                                value: content,
                                mediaType: 'text/html',
                                baseIRI: 'http://example.org/',
                            },
                        ],
                    })];
                case 1:
                    bindingsStream = _a.sent();
                    return [2 /*return*/, bindingsStream.toArray()];
            }
        });
    });
}
exports.getPublicationFromFileContent = getPublicationFromFileContent;
function fetchDocument(publicationLink) {
    return __awaiter(this, void 0, void 0, function () {
        var bindingsStream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, engine.queryBindings("\n        SELECT DISTINCT ?s ?p ?o\n        WHERE {\n            ?s ?p ?o .\n        }\n    ", {
                        sources: [publicationLink],
                        httpProxyHandler: new actor_http_proxy_1.ProxyHandlerStatic(proxy),
                    })];
                case 1:
                    bindingsStream = _a.sent();
                    return [2 /*return*/, bindingsStream.toArray()];
            }
        });
    });
}
exports.fetchDocument = fetchDocument;
