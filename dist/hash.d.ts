/**
 * Dispute Protocol (DSP-1.0) — hashing and ID generation
 * Uses Node.js crypto only (zero external dependencies).
 */
import type { Dispute } from './types';
export declare function sha256(data: string): string;
export declare function chainHash(previousHash: string, payload: string): string;
export declare function generateId(): string;
export declare function disputePayload(d: Dispute): string;
//# sourceMappingURL=hash.d.ts.map