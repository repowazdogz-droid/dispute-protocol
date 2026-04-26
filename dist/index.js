"use strict";
/**
 * Dispute Protocol (DSP-1.0)
 * Structured resolution of disagreements between agents or humans and agents.
 * Zero external dependencies (Node.js crypto only).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.disputePayload = exports.generateId = exports.chainHash = exports.sha256 = exports.findPrecedent = exports.recordPrecedent = exports.proposeResolution = exports.analyseFromDispute = exports.compareTraces = exports.DisputeProtocol = exports.schema = void 0;
var types_1 = require("./types");
Object.defineProperty(exports, "schema", { enumerable: true, get: function () { return types_1.schema; } });
var dispute_protocol_1 = require("./dispute-protocol");
Object.defineProperty(exports, "DisputeProtocol", { enumerable: true, get: function () { return dispute_protocol_1.DisputeProtocol; } });
var divergence_finder_1 = require("./divergence-finder");
Object.defineProperty(exports, "compareTraces", { enumerable: true, get: function () { return divergence_finder_1.compareTraces; } });
Object.defineProperty(exports, "analyseFromDispute", { enumerable: true, get: function () { return divergence_finder_1.analyseFromDispute; } });
var resolution_engine_1 = require("./resolution-engine");
Object.defineProperty(exports, "proposeResolution", { enumerable: true, get: function () { return resolution_engine_1.proposeResolution; } });
var precedent_tracker_1 = require("./precedent-tracker");
Object.defineProperty(exports, "recordPrecedent", { enumerable: true, get: function () { return precedent_tracker_1.recordPrecedent; } });
Object.defineProperty(exports, "findPrecedent", { enumerable: true, get: function () { return precedent_tracker_1.findPrecedent; } });
var hash_1 = require("./hash");
Object.defineProperty(exports, "sha256", { enumerable: true, get: function () { return hash_1.sha256; } });
Object.defineProperty(exports, "chainHash", { enumerable: true, get: function () { return hash_1.chainHash; } });
Object.defineProperty(exports, "generateId", { enumerable: true, get: function () { return hash_1.generateId; } });
Object.defineProperty(exports, "disputePayload", { enumerable: true, get: function () { return hash_1.disputePayload; } });
