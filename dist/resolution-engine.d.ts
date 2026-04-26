/**
 * Dispute Protocol (DSP-1.0) — structured resolution process
 */
import type { Dispute, Resolution, ResolutionMethod, Precedent } from './types';
export declare function proposeResolution(dispute: Dispute, method: ResolutionMethod, precedents: Precedent[], options?: {
    harm_minimising_party_id?: string;
}): Resolution;
//# sourceMappingURL=resolution-engine.d.ts.map