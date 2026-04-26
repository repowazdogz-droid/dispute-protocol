/**
 * Dispute Protocol (DSP-1.0)
 * Structured resolution of disagreements between agents or humans and agents.
 * Zero external dependencies (Node.js crypto only).
 */
export { schema } from './types';
export type { DisputeStatus, DisputeCategory, ResolutionMethod, RootCause, Party, DivergencePoint, Resolution, Dispute, Precedent, ProtocolSnapshot, VerifyResult, DisputeFilters, TraceNode, } from './types';
export { DisputeProtocol } from './dispute-protocol';
export { compareTraces, analyseFromDispute } from './divergence-finder';
export { proposeResolution } from './resolution-engine';
export { recordPrecedent, findPrecedent } from './precedent-tracker';
export { sha256, chainHash, generateId, disputePayload } from './hash';
//# sourceMappingURL=index.d.ts.map