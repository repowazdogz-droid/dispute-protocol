/**
 * Dispute Protocol (DSP-1.0) — record and find precedents
 */

import type { Dispute, Precedent, Resolution, DisputeCategory, ResolutionMethod } from './types';
import { generateId } from './hash';

export function recordPrecedent(
  dispute_id: string,
  dispute: Dispute,
  final_resolution: Resolution | null,
  applicable_domains: string[]
): Precedent {
  const pattern = generalisePattern(dispute);
  return {
    id: generateId(),
    dispute_id,
    category: dispute.category,
    pattern,
    resolution_method: final_resolution?.method ?? 'consensus',
    outcome_summary: final_resolution?.outcome ?? 'No resolution recorded',
    applicable_domains: [...applicable_domains],
    created_at: new Date().toISOString(),
  };
}

function generalisePattern(dispute: Dispute): string {
  const parts: string[] = [
    `Category: ${dispute.category}`,
    `Parties: ${dispute.parties.length}`,
    `Divergence points: ${dispute.divergence_points.length}`,
  ];
  for (const d of dispute.divergence_points) {
    parts.push(`Root cause: ${d.root_cause}`);
  }
  return parts.join('; ');
}

export function findPrecedent(
  precedents: Precedent[],
  category: DisputeCategory,
  domain?: string
): Precedent[] {
  let list = precedents.filter((p) => p.category === category);
  if (domain != null && domain !== '') {
    list = list.filter(
      (p) =>
        p.applicable_domains.includes(domain) ||
        p.applicable_domains.some((d) => d.toLowerCase().includes(domain.toLowerCase()))
    );
  }
  return list;
}
