"use strict";
/**
 * Dispute Protocol (DSP-1.0) — main DisputeProtocol class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputeProtocol = void 0;
const types_1 = require("./types");
const hash_1 = require("./hash");
const divergence_finder_1 = require("./divergence-finder");
const resolution_engine_1 = require("./resolution-engine");
const precedent_tracker_1 = require("./precedent-tracker");
const GENESIS = '0';
class DisputeProtocol {
    constructor() {
        this.disputes = [];
        this.byId = new Map();
        this.precedents = [];
    }
    recomputeChainFrom(index) {
        for (let i = index; i < this.disputes.length; i++) {
            const d = this.disputes[i];
            d.previous_hash = i === 0 ? GENESIS : this.disputes[i - 1].hash;
            d.hash = (0, hash_1.chainHash)(d.previous_hash, (0, hash_1.disputePayload)(d));
        }
    }
    fileDispute(dispute) {
        const id = (0, hash_1.generateId)();
        const timestamp = new Date().toISOString();
        const previous_hash = this.disputes.length === 0 ? GENESIS : this.disputes[this.disputes.length - 1].hash;
        const full = {
            ...dispute,
            id,
            timestamp,
            status: 'filed',
            divergence_points: [],
            proposed_resolutions: [],
            final_resolution: null,
            escalation_reason: null,
            previous_hash,
            hash: '',
        };
        full.hash = (0, hash_1.chainHash)(previous_hash, (0, hash_1.disputePayload)(full));
        this.disputes.push(full);
        this.byId.set(id, full);
        return full;
    }
    analyseDivergence(dispute_id, trace_a_nodes, trace_b_nodes) {
        const dispute = this.byId.get(dispute_id);
        if (!dispute)
            throw new Error(`Dispute not found: ${dispute_id}`);
        if (dispute.parties.length < 2)
            return [];
        let divs;
        if (trace_a_nodes != null &&
            trace_b_nodes != null &&
            trace_a_nodes.length + trace_b_nodes.length > 0) {
            const partyA = dispute.parties[0];
            const partyB = dispute.parties[1];
            divs = (0, divergence_finder_1.compareTraces)(trace_a_nodes, trace_b_nodes, {
                category: dispute.category,
                party_a_position: dispute.divergence_points[0]?.party_a_position,
                party_b_position: dispute.divergence_points[0]?.party_b_position,
            });
        }
        else {
            divs = (0, divergence_finder_1.analyseFromDispute)(dispute.parties.map((p) => ({ id: p.id })), dispute.subject, dispute.category);
        }
        if (divs.length > 0) {
            dispute.divergence_points = divs;
            dispute.status = 'divergence_identified';
            const idx = this.disputes.findIndex((d) => d.id === dispute_id);
            this.recomputeChainFrom(idx);
        }
        return divs;
    }
    compareTraces(trace_a_nodes, trace_b_nodes) {
        return (0, divergence_finder_1.compareTraces)(trace_a_nodes, trace_b_nodes);
    }
    proposeResolution(dispute_id, method) {
        const dispute = this.byId.get(dispute_id);
        if (!dispute)
            throw new Error(`Dispute not found: ${dispute_id}`);
        const resolution = (0, resolution_engine_1.proposeResolution)(dispute, method, this.precedents);
        dispute.proposed_resolutions.push(resolution);
        dispute.status = method === 'consensus' ? 'deadlocked' : 'resolution_proposed';
        const idx = this.disputes.findIndex((d) => d.id === dispute_id);
        this.recomputeChainFrom(idx);
        return resolution;
    }
    acceptResolution(dispute_id, resolution_id) {
        const dispute = this.byId.get(dispute_id);
        if (!dispute)
            throw new Error(`Dispute not found: ${dispute_id}`);
        const res = dispute.proposed_resolutions.find((r) => r.id === resolution_id);
        if (!res)
            throw new Error(`Resolution not found: ${resolution_id}`);
        dispute.final_resolution = res;
        dispute.status = 'resolved';
        const idx = this.disputes.findIndex((d) => d.id === dispute_id);
        this.recomputeChainFrom(idx);
        return dispute;
    }
    rejectResolution(dispute_id, resolution_id, _reason) {
        const dispute = this.byId.get(dispute_id);
        if (!dispute)
            throw new Error(`Dispute not found: ${dispute_id}`);
        dispute.proposed_resolutions = dispute.proposed_resolutions.filter((r) => r.id !== resolution_id);
        dispute.status = dispute.divergence_points.length > 0 ? 'divergence_identified' : 'filed';
        const idx = this.disputes.findIndex((d) => d.id === dispute_id);
        this.recomputeChainFrom(idx);
        return dispute;
    }
    escalate(dispute_id, reason) {
        const dispute = this.byId.get(dispute_id);
        if (!dispute)
            throw new Error(`Dispute not found: ${dispute_id}`);
        dispute.escalation_reason = reason;
        dispute.status = 'escalated';
        const idx = this.disputes.findIndex((d) => d.id === dispute_id);
        this.recomputeChainFrom(idx);
        return dispute;
    }
    recordPrecedent(dispute_id, applicable_domains) {
        const dispute = this.byId.get(dispute_id);
        if (!dispute)
            throw new Error(`Dispute not found: ${dispute_id}`);
        const prec = (0, precedent_tracker_1.recordPrecedent)(dispute_id, dispute, dispute.final_resolution, applicable_domains);
        this.precedents.push(prec);
        return prec;
    }
    findPrecedent(category, domain) {
        return (0, precedent_tracker_1.findPrecedent)(this.precedents, category, domain);
    }
    getDispute(id) {
        return this.byId.get(id) ?? null;
    }
    getDisputes(filters) {
        let list = this.disputes.slice();
        if (filters?.status)
            list = list.filter((d) => d.status === filters.status);
        if (filters?.category)
            list = list.filter((d) => d.category === filters.category);
        if (filters?.party_id)
            list = list.filter((d) => d.parties.some((p) => p.id === filters.party_id));
        return list;
    }
    getDeadlocked() {
        return this.disputes.filter((d) => d.status === 'deadlocked');
    }
    verify() {
        let valid = true;
        let prev = GENESIS;
        for (const d of this.disputes) {
            if (d.previous_hash !== prev)
                valid = false;
            const expected = (0, hash_1.chainHash)(d.previous_hash, (0, hash_1.disputePayload)(d));
            if (d.hash !== expected)
                valid = false;
            prev = d.hash;
        }
        return { valid, disputes_checked: this.disputes.length };
    }
    toJSON() {
        const snapshot = {
            schema: types_1.schema,
            disputes: this.disputes,
            precedents: this.precedents,
        };
        return JSON.stringify(snapshot, null, 2);
    }
    toMarkdown() {
        const lines = [
            '# Dispute Protocol',
            '',
            `**Schema:** ${types_1.schema}  `,
            `**Generated:** ${new Date().toISOString()}`,
            '',
            '## Disputes',
            '',
        ];
        for (const d of this.disputes.slice(0, 20)) {
            lines.push(`### ${d.id.slice(0, 8)}... — ${d.subject}`);
            lines.push(`- Status: ${d.status}, Category: ${d.category}`);
            lines.push(`- Divergence points: ${d.divergence_points.length}`);
            if (d.final_resolution) {
                lines.push(`- Resolution: ${d.final_resolution.outcome}`);
            }
            lines.push('');
        }
        lines.push('## Precedents', '');
        for (const p of this.precedents.slice(0, 10)) {
            lines.push(`- **${p.category}**: ${p.pattern} → ${p.outcome_summary}`);
        }
        return lines.join('\n');
    }
    static fromJSON(json) {
        const snapshot = JSON.parse(json);
        if (snapshot.schema !== types_1.schema)
            throw new Error(`Invalid schema: expected ${types_1.schema}`);
        const protocol = new DisputeProtocol();
        const P = protocol;
        P.disputes = snapshot.disputes;
        P.byId = new Map(snapshot.disputes.map((d) => [d.id, d]));
        P.precedents = snapshot.precedents ?? [];
        return protocol;
    }
}
exports.DisputeProtocol = DisputeProtocol;
