"use strict";
/**
 * Dispute Protocol (DSP-1.0) — hashing and ID generation
 * Uses Node.js crypto only (zero external dependencies).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = sha256;
exports.chainHash = chainHash;
exports.generateId = generateId;
exports.disputePayload = disputePayload;
const crypto_1 = require("crypto");
const HASH_ALGORITHM = 'sha256';
const ID_BYTES = 16;
function sha256(data) {
    return (0, crypto_1.createHash)(HASH_ALGORITHM).update(data, 'utf8').digest('hex');
}
function chainHash(previousHash, payload) {
    return sha256(previousHash + payload);
}
function generateId() {
    return (0, crypto_1.randomBytes)(ID_BYTES).toString('hex');
}
function partyPayload(p) {
    return `${p.id}:${p.type}:${p.name}:${p.clearpath_trace_id ?? ''}:${p.trust_score ?? ''}`;
}
function divergencePayload(d) {
    return [
        d.id,
        d.description,
        d.category,
        d.party_a_position,
        d.party_b_position,
        d.root_cause,
    ].join('|');
}
function resolutionPayload(r) {
    return [
        r.id,
        r.dispute_id,
        r.method,
        r.outcome,
        r.favours ?? '',
        r.resolved_at,
    ].join('|');
}
function disputePayload(d) {
    const partiesStr = d.parties.map(partyPayload).sort().join(';');
    const divStr = d.divergence_points.map(divergencePayload).join(';');
    const propStr = d.proposed_resolutions.map(resolutionPayload).join(';');
    const finalStr = d.final_resolution ? resolutionPayload(d.final_resolution) : '';
    return [
        d.id,
        d.timestamp,
        partiesStr,
        d.subject,
        d.category,
        d.status,
        divStr,
        propStr,
        finalStr,
        d.escalation_reason ?? '',
    ].join('\n');
}
