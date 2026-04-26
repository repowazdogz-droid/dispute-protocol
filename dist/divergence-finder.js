"use strict";
/**
 * Dispute Protocol (DSP-1.0) — compare traces and find divergence points
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareTraces = compareTraces;
exports.analyseFromDispute = analyseFromDispute;
const hash_1 = require("./hash");
const NODE_TYPES = ['OBSERVE', 'DERIVE', 'ASSUME', 'DECIDE', 'ACT'];
function alignByType(trace) {
    const byType = new Map();
    for (const n of trace) {
        const t = (n.type ?? 'UNKNOWN');
        const list = byType.get(t) ?? [];
        list.push(n);
        byType.set(t, list);
    }
    return byType;
}
function evidenceKey(n) {
    const ev = (n.evidence ?? []).concat(n.content ?? '').filter(Boolean);
    return [...ev].sort().join('|');
}
function assumptionsKey(n) {
    const a = (n.assumptions ?? []).slice().sort();
    return a.join('|');
}
function compareTraces(trace_a_nodes, trace_b_nodes, options) {
    const divergences = [];
    const aByType = alignByType(trace_a_nodes);
    const bByType = alignByType(trace_b_nodes);
    for (const nodeType of NODE_TYPES) {
        const aNodes = aByType.get(nodeType) ?? [];
        const bNodes = bByType.get(nodeType) ?? [];
        if (aNodes.length === 0 && bNodes.length === 0)
            continue;
        if (nodeType === 'OBSERVE') {
            const aEvidence = new Set(aNodes.flatMap((n) => (n.evidence ?? []).concat(n.content ?? '').filter(Boolean)));
            const bEvidence = new Set(bNodes.flatMap((n) => (n.evidence ?? []).concat(n.content ?? '').filter(Boolean)));
            if (setDiff(aEvidence, bEvidence).length > 0 || setDiff(bEvidence, aEvidence).length > 0) {
                divergences.push(createDivergence('different_evidence', 'Evidence differs', nodeType, aNodes, bNodes, options));
            }
        }
        if (nodeType === 'ASSUME') {
            const aAssumptions = new Set(aNodes.flatMap((n) => (n.assumptions ?? [])));
            const bAssumptions = new Set(bNodes.flatMap((n) => (n.assumptions ?? [])));
            if (setDiff(aAssumptions, bAssumptions).length > 0 || setDiff(bAssumptions, aAssumptions).length > 0) {
                divergences.push(createDivergence('different_assumptions', 'Assumptions differ', nodeType, aNodes, bNodes, options));
            }
        }
        if (nodeType === 'DERIVE') {
            const aContents = aNodes.map((n) => (n.content ?? '').trim()).filter(Boolean);
            const bContents = bNodes.map((n) => (n.content ?? '').trim()).filter(Boolean);
            if (aContents.join('') !== bContents.join('')) {
                const sameEvidence = evidenceKey(aNodes[0] ?? {}) === evidenceKey(bNodes[0] ?? {});
                divergences.push(createDivergence(sameEvidence ? 'different_interpretation' : 'different_evidence', sameEvidence ? 'Different conclusions from same evidence' : 'Different evidence or derivation', nodeType, aNodes, bNodes, options));
            }
        }
        if (nodeType === 'DECIDE') {
            const aContent = (aNodes[0]?.content ?? '').trim();
            const bContent = (bNodes[0]?.content ?? '').trim();
            if (aContent !== bContent) {
                divergences.push(createDivergence('different_weights', 'Decision weights or alternatives differ', nodeType, aNodes, bNodes, options));
            }
        }
    }
    if (options?.party_a_position && options?.party_b_position && divergences.length === 0) {
        divergences.push(createDivergence('different_interpretation', 'Positions differ', 'UNKNOWN', [], [], options));
    }
    return divergences;
}
function setDiff(a, b) {
    return [...a].filter((x) => !b.has(x));
}
function createDivergence(root_cause, description, nodeType, aNodes, bNodes, options) {
    return {
        id: (0, hash_1.generateId)(),
        description: `${description} (${nodeType})`,
        category: options?.category ?? 'interpretive',
        party_a_position: options?.party_a_position ?? aNodes[0]?.content ?? '',
        party_b_position: options?.party_b_position ?? bNodes[0]?.content ?? '',
        party_a_evidence: options?.party_a_evidence ?? aNodes.flatMap((n) => (n.evidence ?? []).concat(n.content ?? '').filter(Boolean)),
        party_b_evidence: options?.party_b_evidence ?? bNodes.flatMap((n) => (n.evidence ?? []).concat(n.content ?? '').filter(Boolean)),
        party_a_assumptions: options?.party_a_assumptions ?? aNodes.flatMap((n) => n.assumptions ?? []),
        party_b_assumptions: options?.party_b_assumptions ?? bNodes.flatMap((n) => n.assumptions ?? []),
        trace_node_a: aNodes[0]?.id,
        trace_node_b: bNodes[0]?.id,
        root_cause,
    };
}
function analyseFromDispute(parties, subject, category) {
    if (parties.length < 2)
        return [];
    const a = parties[0];
    const b = parties[1];
    return [
        {
            id: (0, hash_1.generateId)(),
            description: `Dispute over: ${subject}`,
            category,
            party_a_position: a.position ?? 'No position stated',
            party_b_position: b.position ?? 'No position stated',
            party_a_evidence: a.evidence ?? [],
            party_b_evidence: b.evidence ?? [],
            party_a_assumptions: a.assumptions ?? [],
            party_b_assumptions: b.assumptions ?? [],
            root_cause: inferRootCause(a, b),
        },
    ];
}
function inferRootCause(a, b) {
    const aEv = new Set(a.evidence ?? []);
    const bEv = new Set(b.evidence ?? []);
    if (aEv.size !== bEv.size || [...aEv].some((e) => !bEv.has(e)))
        return 'different_evidence';
    const aAss = new Set(a.assumptions ?? []);
    const bAss = new Set(b.assumptions ?? []);
    if (aAss.size !== bAss.size || [...aAss].some((x) => !bAss.has(x)))
        return 'different_assumptions';
    return 'different_interpretation';
}
