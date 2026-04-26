/**
 * Dispute Protocol (DSP-1.0) — type definitions
 */
export declare const schema: "DSP-1.0";
export type DisputeStatus = 'filed' | 'analysing' | 'divergence_identified' | 'resolution_proposed' | 'resolved' | 'escalated' | 'deadlocked';
export type DisputeCategory = 'factual' | 'interpretive' | 'methodological' | 'ethical' | 'jurisdictional' | 'priority' | 'confidence';
export type ResolutionMethod = 'evidence_weight' | 'authority_hierarchy' | 'consensus' | 'precedent' | 'human_arbiter' | 'domain_expert' | 'majority' | 'conservative_default';
export type RootCause = 'different_evidence' | 'different_interpretation' | 'different_assumptions' | 'different_values' | 'different_weights';
export interface Party {
    id: string;
    type: 'agent' | 'human' | 'system';
    name: string;
    clearpath_trace_id?: string;
    trust_score?: number;
}
export interface DivergencePoint {
    id: string;
    description: string;
    category: DisputeCategory;
    party_a_position: string;
    party_b_position: string;
    party_a_evidence: string[];
    party_b_evidence: string[];
    party_a_assumptions: string[];
    party_b_assumptions: string[];
    trace_node_a?: string;
    trace_node_b?: string;
    root_cause: RootCause;
}
export interface Resolution {
    id: string;
    dispute_id: string;
    method: ResolutionMethod;
    outcome: string;
    reasoning: string;
    favours: string | null;
    conditions: string[];
    dissent: string | null;
    confidence: number;
    resolved_at: string;
}
export interface Dispute {
    id: string;
    timestamp: string;
    parties: Party[];
    subject: string;
    category: DisputeCategory;
    status: DisputeStatus;
    divergence_points: DivergencePoint[];
    proposed_resolutions: Resolution[];
    final_resolution: Resolution | null;
    escalation_reason: string | null;
    hash: string;
    previous_hash: string;
}
export interface Precedent {
    id: string;
    dispute_id: string;
    category: DisputeCategory;
    pattern: string;
    resolution_method: ResolutionMethod;
    outcome_summary: string;
    applicable_domains: string[];
    created_at: string;
}
export interface ProtocolSnapshot {
    schema: typeof schema;
    disputes: Dispute[];
    precedents: Precedent[];
}
export interface VerifyResult {
    valid: boolean;
    disputes_checked: number;
}
export interface DisputeFilters {
    status?: DisputeStatus;
    category?: DisputeCategory;
    party_id?: string;
}
/** Minimal trace node shape for compareTraces (Clearpath-aligned) */
export interface TraceNode {
    id?: string;
    type?: string;
    content?: string;
    evidence?: string[];
    assumptions?: string[];
    [key: string]: unknown;
}
//# sourceMappingURL=types.d.ts.map