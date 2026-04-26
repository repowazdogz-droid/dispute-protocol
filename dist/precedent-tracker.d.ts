/**
 * Dispute Protocol (DSP-1.0) — record and find precedents
 */
import type { Dispute, Precedent, Resolution, DisputeCategory } from './types';
export declare function recordPrecedent(dispute_id: string, dispute: Dispute, final_resolution: Resolution | null, applicable_domains: string[]): Precedent;
export declare function findPrecedent(precedents: Precedent[], category: DisputeCategory, domain?: string): Precedent[];
//# sourceMappingURL=precedent-tracker.d.ts.map