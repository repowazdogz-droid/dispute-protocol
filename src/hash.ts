/**
 * Dispute Protocol (DSP-1.0) — hashing and ID generation
 * Uses Node.js crypto only (zero external dependencies).
 */

import { createHash, randomBytes } from 'crypto';
import type { Dispute, Party, DivergencePoint, Resolution } from './types';

const HASH_ALGORITHM = 'sha256';
const ID_BYTES = 16;

export function sha256(data: string): string {
  return createHash(HASH_ALGORITHM).update(data, 'utf8').digest('hex');
}

export function chainHash(previousHash: string, payload: string): string {
  return sha256(previousHash + payload);
}

export function generateId(): string {
  return randomBytes(ID_BYTES).toString('hex');
}

function partyPayload(p: Party): string {
  return `${p.id}:${p.type}:${p.name}:${p.clearpath_trace_id ?? ''}:${p.trust_score ?? ''}`;
}

function divergencePayload(d: DivergencePoint): string {
  return [
    d.id,
    d.description,
    d.category,
    d.party_a_position,
    d.party_b_position,
    d.root_cause,
  ].join('|');
}

function resolutionPayload(r: Resolution): string {
  return [
    r.id,
    r.dispute_id,
    r.method,
    r.outcome,
    r.favours ?? '',
    r.resolved_at,
  ].join('|');
}

export function disputePayload(d: Dispute): string {
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
