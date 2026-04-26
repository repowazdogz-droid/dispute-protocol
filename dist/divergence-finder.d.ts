/**
 * Dispute Protocol (DSP-1.0) — compare traces and find divergence points
 */
import type { DivergencePoint, DisputeCategory, TraceNode } from './types';
export declare function compareTraces(trace_a_nodes: TraceNode[], trace_b_nodes: TraceNode[], options?: {
    party_a_position?: string;
    party_b_position?: string;
    party_a_evidence?: string[];
    party_b_evidence?: string[];
    party_a_assumptions?: string[];
    party_b_assumptions?: string[];
    category?: DisputeCategory;
}): DivergencePoint[];
export declare function analyseFromDispute(parties: {
    id: string;
    position?: string;
    evidence?: string[];
    assumptions?: string[];
}[], subject: string, category: DisputeCategory): DivergencePoint[];
//# sourceMappingURL=divergence-finder.d.ts.map