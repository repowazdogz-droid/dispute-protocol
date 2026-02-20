/**
 * Dispute Protocol (DSP-1.0) — main DisputeProtocol class
 */

import type {
  Dispute,
  Party,
  DivergencePoint,
  Resolution,
  Precedent,
  TraceNode,
  ProtocolSnapshot,
  VerifyResult,
  DisputeFilters,
  ResolutionMethod,
  DisputeCategory,
} from './types';
import { schema } from './types';
import { generateId, chainHash, disputePayload } from './hash';
import { compareTraces, analyseFromDispute } from './divergence-finder';
import { proposeResolution } from './resolution-engine';
import { recordPrecedent, findPrecedent } from './precedent-tracker';

const GENESIS = '0';

type FileDisputeInput = Omit<
  Dispute,
  | 'id'
  | 'timestamp'
  | 'hash'
  | 'previous_hash'
  | 'status'
  | 'divergence_points'
  | 'proposed_resolutions'
  | 'final_resolution'
  | 'escalation_reason'
>;

export class DisputeProtocol {
  private disputes: Dispute[] = [];
  private byId: Map<string, Dispute> = new Map();
  private precedents: Precedent[] = [];

  constructor() {}

  private recomputeChainFrom(index: number): void {
    for (let i = index; i < this.disputes.length; i++) {
      const d = this.disputes[i]!;
      d.previous_hash = i === 0 ? GENESIS : this.disputes[i - 1]!.hash;
      d.hash = chainHash(d.previous_hash, disputePayload(d));
    }
  }

  fileDispute(dispute: FileDisputeInput): Dispute {
    const id = generateId();
    const timestamp = new Date().toISOString();
    const previous_hash =
      this.disputes.length === 0 ? GENESIS : this.disputes[this.disputes.length - 1]!.hash;
    const full: Dispute = {
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
    full.hash = chainHash(previous_hash, disputePayload(full));
    this.disputes.push(full);
    this.byId.set(id, full);
    return full;
  }

  analyseDivergence(
    dispute_id: string,
    trace_a_nodes?: TraceNode[],
    trace_b_nodes?: TraceNode[]
  ): DivergencePoint[] {
    const dispute = this.byId.get(dispute_id);
    if (!dispute) throw new Error(`Dispute not found: ${dispute_id}`);
    if (dispute.parties.length < 2) return [];
    let divs: DivergencePoint[];
    if (
      trace_a_nodes != null &&
      trace_b_nodes != null &&
      trace_a_nodes.length + trace_b_nodes.length > 0
    ) {
      const partyA = dispute.parties[0]!;
      const partyB = dispute.parties[1]!;
      divs = compareTraces(trace_a_nodes, trace_b_nodes, {
        category: dispute.category,
        party_a_position: dispute.divergence_points[0]?.party_a_position,
        party_b_position: dispute.divergence_points[0]?.party_b_position,
      });
    } else {
      divs = analyseFromDispute(
        dispute.parties.map((p) => ({ id: p.id })),
        dispute.subject,
        dispute.category
      );
    }
    if (divs.length > 0) {
      dispute.divergence_points = divs;
      dispute.status = 'divergence_identified';
      const idx = this.disputes.findIndex((d) => d.id === dispute_id);
      this.recomputeChainFrom(idx);
    }
    return divs;
  }

  compareTraces(trace_a_nodes: TraceNode[], trace_b_nodes: TraceNode[]): DivergencePoint[] {
    return compareTraces(trace_a_nodes, trace_b_nodes);
  }

  proposeResolution(dispute_id: string, method: ResolutionMethod): Resolution {
    const dispute = this.byId.get(dispute_id);
    if (!dispute) throw new Error(`Dispute not found: ${dispute_id}`);
    const resolution = proposeResolution(dispute, method, this.precedents);
    dispute.proposed_resolutions.push(resolution);
    dispute.status = method === 'consensus' ? 'deadlocked' : 'resolution_proposed';
    const idx = this.disputes.findIndex((d) => d.id === dispute_id);
    this.recomputeChainFrom(idx);
    return resolution;
  }

  acceptResolution(dispute_id: string, resolution_id: string): Dispute {
    const dispute = this.byId.get(dispute_id);
    if (!dispute) throw new Error(`Dispute not found: ${dispute_id}`);
    const res = dispute.proposed_resolutions.find((r) => r.id === resolution_id);
    if (!res) throw new Error(`Resolution not found: ${resolution_id}`);
    dispute.final_resolution = res;
    dispute.status = 'resolved';
    const idx = this.disputes.findIndex((d) => d.id === dispute_id);
    this.recomputeChainFrom(idx);
    return dispute;
  }

  rejectResolution(dispute_id: string, resolution_id: string, _reason: string): Dispute {
    const dispute = this.byId.get(dispute_id);
    if (!dispute) throw new Error(`Dispute not found: ${dispute_id}`);
    dispute.proposed_resolutions = dispute.proposed_resolutions.filter((r) => r.id !== resolution_id);
    dispute.status = dispute.divergence_points.length > 0 ? 'divergence_identified' : 'filed';
    const idx = this.disputes.findIndex((d) => d.id === dispute_id);
    this.recomputeChainFrom(idx);
    return dispute;
  }

  escalate(dispute_id: string, reason: string): Dispute {
    const dispute = this.byId.get(dispute_id);
    if (!dispute) throw new Error(`Dispute not found: ${dispute_id}`);
    dispute.escalation_reason = reason;
    dispute.status = 'escalated';
    const idx = this.disputes.findIndex((d) => d.id === dispute_id);
    this.recomputeChainFrom(idx);
    return dispute;
  }

  recordPrecedent(dispute_id: string, applicable_domains: string[]): Precedent {
    const dispute = this.byId.get(dispute_id);
    if (!dispute) throw new Error(`Dispute not found: ${dispute_id}`);
    const prec = recordPrecedent(dispute_id, dispute, dispute.final_resolution, applicable_domains);
    this.precedents.push(prec);
    return prec;
  }

  findPrecedent(category: DisputeCategory, domain?: string): Precedent[] {
    return findPrecedent(this.precedents, category, domain);
  }

  getDispute(id: string): Dispute | null {
    return this.byId.get(id) ?? null;
  }

  getDisputes(filters?: DisputeFilters): Dispute[] {
    let list = this.disputes.slice();
    if (filters?.status) list = list.filter((d) => d.status === filters.status);
    if (filters?.category) list = list.filter((d) => d.category === filters.category);
    if (filters?.party_id)
      list = list.filter((d) => d.parties.some((p) => p.id === filters.party_id));
    return list;
  }

  getDeadlocked(): Dispute[] {
    return this.disputes.filter((d) => d.status === 'deadlocked');
  }

  verify(): VerifyResult {
    let valid = true;
    let prev = GENESIS;
    for (const d of this.disputes) {
      if (d.previous_hash !== prev) valid = false;
      const expected = chainHash(d.previous_hash, disputePayload(d));
      if (d.hash !== expected) valid = false;
      prev = d.hash;
    }
    return { valid, disputes_checked: this.disputes.length };
  }

  toJSON(): string {
    const snapshot: ProtocolSnapshot = {
      schema,
      disputes: this.disputes,
      precedents: this.precedents,
    };
    return JSON.stringify(snapshot, null, 2);
  }

  toMarkdown(): string {
    const lines: string[] = [
      '# Dispute Protocol',
      '',
      `**Schema:** ${schema}  `,
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

  static fromJSON(json: string): DisputeProtocol {
    const snapshot: ProtocolSnapshot = JSON.parse(json);
    if (snapshot.schema !== schema) throw new Error(`Invalid schema: expected ${schema}`);
    const protocol = new DisputeProtocol();
    const P = protocol as unknown as {
      disputes: Dispute[];
      byId: Map<string, Dispute>;
      precedents: Precedent[];
    };
    P.disputes = snapshot.disputes;
    P.byId = new Map(snapshot.disputes.map((d) => [d.id, d]));
    P.precedents = snapshot.precedents ?? [];
    return protocol;
  }
}
