"use strict";
/**
 * Dispute Protocol (DSP-1.0) — structured resolution process
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.proposeResolution = proposeResolution;
const hash_1 = require("./hash");
function proposeResolution(dispute, method, precedents, options) {
    const resolved_at = new Date().toISOString();
    const parties = dispute.parties;
    const divs = dispute.divergence_points;
    let outcome;
    let favours;
    let reasoning;
    let conditions = [];
    let dissent = null;
    let confidence = 0.7;
    switch (method) {
        case 'evidence_weight': {
            const aEvidenceCount = divs.reduce((s, d) => s + (d.party_a_evidence?.length ?? 0), 0);
            const bEvidenceCount = divs.reduce((s, d) => s + (d.party_b_evidence?.length ?? 0), 0);
            const partyA = parties[0];
            const partyB = parties[1];
            const favouredId = aEvidenceCount >= bEvidenceCount ? partyA?.id : partyB?.id;
            favours = favouredId ?? null;
            const favouredName = parties.find((p) => p.id === favours)?.name ?? favours;
            outcome = `Resolution by evidence weight: position of ${favouredName} supported by stronger evidence.`;
            reasoning = 'Compared evidence chains; party with more supporting evidence favoured.';
            dissent = parties.find((p) => p.id !== favours)
                ? `Position of ${parties.find((p) => p.id !== favours)?.name} not adopted.`
                : null;
            break;
        }
        case 'authority_hierarchy': {
            const withTrust = parties.map((p) => ({ ...p, score: p.trust_score ?? 0 }));
            const winner = withTrust.reduce((a, b) => (a.score >= b.score ? a : b));
            favours = winner.id;
            outcome = `Resolution by authority: ${winner.name} (trust score ${winner.score}) has higher standing.`;
            reasoning = 'Applied authority hierarchy; higher trust score favoured.';
            dissent = parties.find((p) => p.id !== favours) ? `Position of ${parties.find((p) => p.id !== favours)?.name} not adopted.` : null;
            break;
        }
        case 'consensus': {
            outcome = 'Consensus required; no agreement reached.';
            reasoning = 'Both parties must agree; status remains open or deadlocked.';
            favours = null;
            dissent = 'Parties did not reach consensus.';
            confidence = 0.3;
            break;
        }
        case 'precedent': {
            const similar = precedents.filter((pr) => pr.category === dispute.category && pr.applicable_domains.length > 0);
            if (similar.length > 0) {
                const pr = similar[0];
                outcome = `Applied precedent: ${pr.outcome_summary}`;
                reasoning = `Precedent from dispute ${pr.dispute_id} (${pr.resolution_method}).`;
                favours = null;
                conditions = [`Precedent pattern: ${pr.pattern}`];
            }
            else {
                outcome = 'No applicable precedent found; resolution by default.';
                reasoning = 'No matching precedent; neutral outcome.';
                favours = null;
            }
            break;
        }
        case 'human_arbiter': {
            outcome = 'Referred to human arbiter; decision pending.';
            reasoning = 'Dispute escalated to human for resolution.';
            favours = null;
            conditions = ['Human arbiter decision required.'];
            break;
        }
        case 'domain_expert': {
            outcome = 'Referred to domain expert; input pending.';
            reasoning = 'Domain expertise required for resolution.';
            favours = null;
            conditions = ['Domain expert consultation required.'];
            break;
        }
        case 'majority': {
            if (parties.length >= 3) {
                const votes = parties.slice(0, 2);
                const majorityId = votes[0].id;
                favours = majorityId;
                outcome = `Majority resolution: ${parties.find((p) => p.id === majorityId)?.name} position adopted (2 of ${parties.length} parties).`;
                reasoning = 'Simple majority favoured one position.';
                dissent = `Minority position of ${parties.filter((p) => p.id !== majorityId).map((p) => p.name).join(', ')} recorded.`;
            }
            else {
                favours = null;
                outcome = 'Majority requires 3+ parties; not applicable.';
                reasoning = 'Insufficient parties for majority resolution.';
            }
            break;
        }
        case 'conservative_default': {
            const harmPartyId = options?.harm_minimising_party_id ?? parties[0]?.id ?? null;
            favours = harmPartyId;
            outcome = harmPartyId
                ? `Conservative default: position minimising potential harm (${parties.find((p) => p.id === harmPartyId)?.name}) adopted.`
                : 'Conservative default: no clear harm-minimising position identified.';
            reasoning = 'When in doubt, chose the option that minimises potential harm.';
            dissent = parties.find((p) => p.id !== harmPartyId)
                ? `Position of ${parties.find((p) => p.id !== harmPartyId)?.name} not adopted.`
                : null;
            break;
        }
        default: {
            favours = null;
            outcome = 'Resolution method not implemented.';
            reasoning = 'Unknown method.';
        }
    }
    return {
        id: (0, hash_1.generateId)(),
        dispute_id: dispute.id,
        method,
        outcome,
        reasoning,
        favours,
        conditions,
        dissent,
        confidence,
        resolved_at,
    };
}
