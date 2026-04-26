/**
 * Dispute Protocol (DSP-1.0) — main DisputeProtocol class
 */
import type { Dispute, DivergencePoint, Resolution, Precedent, TraceNode, VerifyResult, DisputeFilters, ResolutionMethod, DisputeCategory } from './types';
type FileDisputeInput = Omit<Dispute, 'id' | 'timestamp' | 'hash' | 'previous_hash' | 'status' | 'divergence_points' | 'proposed_resolutions' | 'final_resolution' | 'escalation_reason'>;
export declare class DisputeProtocol {
    private disputes;
    private byId;
    private precedents;
    constructor();
    private recomputeChainFrom;
    fileDispute(dispute: FileDisputeInput): Dispute;
    analyseDivergence(dispute_id: string, trace_a_nodes?: TraceNode[], trace_b_nodes?: TraceNode[]): DivergencePoint[];
    compareTraces(trace_a_nodes: TraceNode[], trace_b_nodes: TraceNode[]): DivergencePoint[];
    proposeResolution(dispute_id: string, method: ResolutionMethod): Resolution;
    acceptResolution(dispute_id: string, resolution_id: string): Dispute;
    rejectResolution(dispute_id: string, resolution_id: string, _reason: string): Dispute;
    escalate(dispute_id: string, reason: string): Dispute;
    recordPrecedent(dispute_id: string, applicable_domains: string[]): Precedent;
    findPrecedent(category: DisputeCategory, domain?: string): Precedent[];
    getDispute(id: string): Dispute | null;
    getDisputes(filters?: DisputeFilters): Dispute[];
    getDeadlocked(): Dispute[];
    verify(): VerifyResult;
    toJSON(): string;
    toMarkdown(): string;
    static fromJSON(json: string): DisputeProtocol;
}
export {};
//# sourceMappingURL=dispute-protocol.d.ts.map