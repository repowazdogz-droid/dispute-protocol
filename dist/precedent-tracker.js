"use strict";
/**
 * Dispute Protocol (DSP-1.0) — record and find precedents
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPrecedent = recordPrecedent;
exports.findPrecedent = findPrecedent;
const hash_1 = require("./hash");
function recordPrecedent(dispute_id, dispute, final_resolution, applicable_domains) {
    const pattern = generalisePattern(dispute);
    return {
        id: (0, hash_1.generateId)(),
        dispute_id,
        category: dispute.category,
        pattern,
        resolution_method: final_resolution?.method ?? 'consensus',
        outcome_summary: final_resolution?.outcome ?? 'No resolution recorded',
        applicable_domains: [...applicable_domains],
        created_at: new Date().toISOString(),
    };
}
function generalisePattern(dispute) {
    const parts = [
        `Category: ${dispute.category}`,
        `Parties: ${dispute.parties.length}`,
        `Divergence points: ${dispute.divergence_points.length}`,
    ];
    for (const d of dispute.divergence_points) {
        parts.push(`Root cause: ${d.root_cause}`);
    }
    return parts.join('; ');
}
function findPrecedent(precedents, category, domain) {
    let list = precedents.filter((p) => p.category === category);
    if (domain != null && domain !== '') {
        list = list.filter((p) => p.applicable_domains.includes(domain) ||
            p.applicable_domains.some((d) => d.toLowerCase().includes(domain.toLowerCase())));
    }
    return list;
}
