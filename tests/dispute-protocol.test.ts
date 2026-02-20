/**
 * Dispute Protocol (DSP-1.0) — comprehensive test suite
 */

import { DisputeProtocol } from '../src/dispute-protocol';
import type { Party, TraceNode } from '../src/types';

function party(id: string, name: string, overrides: Partial<Party> = {}): Party {
  return { id, type: 'agent', name, ...overrides };
}

describe('DisputeProtocol — Core', () => {
  test('file dispute between two parties', () => {
    const protocol = new DisputeProtocol();
    const dispute = protocol.fileDispute({
      parties: [party('a1', 'Agent A'), party('b1', 'Agent B')],
      subject: 'Interpretation of clause 4.2',
      category: 'interpretive',
    });
    expect(dispute.id).toBeDefined();
    expect(dispute.parties).toHaveLength(2);
    expect(dispute.subject).toContain('4.2');
    expect(dispute.status).toBe('filed');
  });

  test('file dispute with Clearpath trace references', () => {
    const protocol = new DisputeProtocol();
    const dispute = protocol.fileDispute({
      parties: [
        party('a1', 'Agent A', { clearpath_trace_id: 'trace-1' }),
        party('b1', 'Agent B', { clearpath_trace_id: 'trace-2' }),
      ],
      subject: 'Data classification',
      category: 'factual',
    });
    expect(dispute.parties[0].clearpath_trace_id).toBe('trace-1');
    expect(dispute.parties[1].clearpath_trace_id).toBe('trace-2');
  });

  test('hash chain maintained', () => {
    const protocol = new DisputeProtocol();
    protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'X',
      category: 'factual',
    });
    protocol.fileDispute({
      parties: [party('c', 'C'), party('d', 'D')],
      subject: 'Y',
      category: 'ethical',
    });
    expect(protocol.verify().valid).toBe(true);
    expect(protocol.verify().disputes_checked).toBe(2);
  });

  test('status starts as filed', () => {
    const protocol = new DisputeProtocol();
    const dispute = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'S',
      category: 'methodological',
    });
    expect(dispute.status).toBe('filed');
  });
});

describe('DisputeProtocol — Divergence', () => {
  test('different evidence detected', () => {
    const protocol = new DisputeProtocol();
    const traceA: TraceNode[] = [
      { type: 'OBSERVE', content: 'X', evidence: ['E1', 'E2'] },
    ];
    const traceB: TraceNode[] = [
      { type: 'OBSERVE', content: 'Y', evidence: ['E2', 'E3'] },
    ];
    const divs = protocol.compareTraces(traceA, traceB);
    const evidenceDiv = divs.find((d) => d.root_cause === 'different_evidence');
    expect(evidenceDiv != null).toBe(true);
  });

  test('different assumptions detected', () => {
    const protocol = new DisputeProtocol();
    const traceA: TraceNode[] = [
      { type: 'ASSUME', assumptions: ['A1', 'A2'] },
    ];
    const traceB: TraceNode[] = [
      { type: 'ASSUME', assumptions: ['A1', 'A3'] },
    ];
    const divs = protocol.compareTraces(traceA, traceB);
    const assumpDiv = divs.find((d) => d.root_cause === 'different_assumptions');
    expect(assumpDiv != null).toBe(true);
  });

  test('different interpretations of same evidence detected', () => {
    const protocol = new DisputeProtocol();
    const traceA: TraceNode[] = [
      { type: 'DERIVE', content: 'Conclusion A', evidence: ['E1'] },
    ];
    const traceB: TraceNode[] = [
      { type: 'DERIVE', content: 'Conclusion B', evidence: ['E1'] },
    ];
    const divs = protocol.compareTraces(traceA, traceB);
    expect(divs.some((d) => d.root_cause === 'different_interpretation' || d.root_cause === 'different_evidence')).toBe(true);
  });

  test('different value weights detected', () => {
    const protocol = new DisputeProtocol();
    const traceA: TraceNode[] = [{ type: 'DECIDE', content: 'Option 1' }];
    const traceB: TraceNode[] = [{ type: 'DECIDE', content: 'Option 2' }];
    const divs = protocol.compareTraces(traceA, traceB);
    const weightsDiv = divs.find((d) => d.root_cause === 'different_weights');
    expect(weightsDiv != null).toBe(true);
  });

  test('no divergence when traces agree', () => {
    const protocol = new DisputeProtocol();
    const trace: TraceNode[] = [
      { type: 'OBSERVE', content: 'Same', evidence: ['E1'] },
      { type: 'DERIVE', content: 'Same conclusion' },
    ];
    const divs = protocol.compareTraces(trace, [...trace]);
    expect(divs.length).toBe(0);
  });
});

describe('DisputeProtocol — Resolution', () => {
  test('evidence weight resolution favours stronger evidence', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'Agent A'), party('b', 'Agent B')],
      subject: 'Fact',
      category: 'factual',
    });
    protocol.analyseDivergence(d.id);
    const dispute = protocol.getDispute(d.id)!;
    dispute.divergence_points = [
      {
        id: 'dp1',
        description: 'D',
        category: 'factual',
        party_a_position: 'A says X',
        party_b_position: 'B says Y',
        party_a_evidence: ['e1', 'e2', 'e3'],
        party_b_evidence: ['e4'],
        party_a_assumptions: [],
        party_b_assumptions: [],
        root_cause: 'different_evidence',
      },
    ];
    const res = protocol.proposeResolution(d.id, 'evidence_weight');
    expect(res.method).toBe('evidence_weight');
    expect(res.favours).toBe('a');
    expect(res.outcome).toContain('evidence');
  });

  test('authority hierarchy resolution', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [
        party('a', 'Agent A', { trust_score: 0.3 }),
        party('b', 'Agent B', { trust_score: 0.9 }),
      ],
      subject: 'Priority',
      category: 'priority',
    });
    protocol.analyseDivergence(d.id);
    const res = protocol.proposeResolution(d.id, 'authority_hierarchy');
    expect(res.favours).toBe('b');
    expect(res.outcome).toContain('authority');
  });

  test('conservative default minimises harm', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'Risk',
      category: 'ethical',
    });
    protocol.analyseDivergence(d.id);
    const res = protocol.proposeResolution(d.id, 'conservative_default');
    expect(res.method).toBe('conservative_default');
    expect(res.outcome).toContain('harm');
  });

  test('resolution records dissent', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'S',
      category: 'interpretive',
    });
    protocol.analyseDivergence(d.id);
    const res = protocol.proposeResolution(d.id, 'evidence_weight');
    expect(res.dissent).toBeDefined();
  });

  test('rejected resolution allows new proposal', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'S',
      category: 'factual',
    });
    protocol.analyseDivergence(d.id);
    const res1 = protocol.proposeResolution(d.id, 'evidence_weight');
    protocol.rejectResolution(d.id, res1.id, 'Unfair');
    const dispute = protocol.getDispute(d.id)!;
    expect(dispute.proposed_resolutions).toHaveLength(0);
    const res2 = protocol.proposeResolution(d.id, 'authority_hierarchy');
    expect(res2.id).toBeDefined();
  });

  test('escalation updates status', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'S',
      category: 'jurisdictional',
    });
    protocol.escalate(d.id, 'Requires legal review');
    const dispute = protocol.getDispute(d.id)!;
    expect(dispute.status).toBe('escalated');
    expect(dispute.escalation_reason).toBe('Requires legal review');
  });
});

describe('DisputeProtocol — Precedent', () => {
  test('record precedent from resolved dispute', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'Contract clause',
      category: 'interpretive',
    });
    protocol.analyseDivergence(d.id);
    protocol.proposeResolution(d.id, 'evidence_weight');
    const res = protocol.getDispute(d.id)!.proposed_resolutions[0]!;
    protocol.acceptResolution(d.id, res.id);
    const prec = protocol.recordPrecedent(d.id, ['legal', 'contracts']);
    expect(prec.dispute_id).toBe(d.id);
    expect(prec.applicable_domains).toContain('legal');
  });

  test('find precedent by category', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'S',
      category: 'ethical',
    });
    protocol.analyseDivergence(d.id);
    protocol.proposeResolution(d.id, 'precedent');
    protocol.acceptResolution(d.id, protocol.getDispute(d.id)!.proposed_resolutions[0]!.id);
    protocol.recordPrecedent(d.id, ['medical']);
    const found = protocol.findPrecedent('ethical');
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  test('find precedent by category and domain', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'S',
      category: 'factual',
    });
    protocol.analyseDivergence(d.id);
    protocol.proposeResolution(d.id, 'evidence_weight');
    protocol.acceptResolution(d.id, protocol.getDispute(d.id)!.proposed_resolutions[0]!.id);
    protocol.recordPrecedent(d.id, ['finance', 'audit']);
    const found = protocol.findPrecedent('factual', 'finance');
    expect(found.length).toBeGreaterThanOrEqual(1);
    expect(found[0].applicable_domains).toContain('finance');
  });
});

describe('DisputeProtocol — Multi-party', () => {
  test('three-party dispute filed', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [
        party('a', 'A'),
        party('b', 'B'),
        party('c', 'C'),
      ],
      subject: 'Resource allocation',
      category: 'priority',
    });
    expect(d.parties).toHaveLength(3);
  });

  test('majority resolution with 3 parties', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [
        party('a', 'A'),
        party('b', 'B'),
        party('c', 'C'),
      ],
      subject: 'Vote',
      category: 'priority',
    });
    protocol.analyseDivergence(d.id);
    const res = protocol.proposeResolution(d.id, 'majority');
    expect(res.method).toBe('majority');
    expect(res.favours).toBeDefined();
  });
});

describe('DisputeProtocol — Deadlock', () => {
  test('consensus method with disagreement produces deadlock', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'S',
      category: 'ethical',
    });
    protocol.analyseDivergence(d.id);
    protocol.proposeResolution(d.id, 'consensus');
    const dispute = protocol.getDispute(d.id)!;
    expect(dispute.status).toBe('deadlocked');
  });

  test('deadlocked disputes retrievable', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'S',
      category: 'confidence',
    });
    protocol.analyseDivergence(d.id);
    protocol.proposeResolution(d.id, 'consensus');
    const deadlocked = protocol.getDeadlocked();
    expect(deadlocked.some((x) => x.id === d.id)).toBe(true);
  });
});

describe('DisputeProtocol — Export', () => {
  test('JSON roundtrip', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'X',
      category: 'methodological',
    });
    protocol.analyseDivergence(d.id);
    const json = protocol.toJSON();
    const restored = DisputeProtocol.fromJSON(json);
    expect(restored.getDispute(d.id)?.subject).toBe('X');
    expect(restored.verify().valid).toBe(true);
  });

  test('Markdown includes divergence summary and resolution', () => {
    const protocol = new DisputeProtocol();
    const d = protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'Y',
      category: 'factual',
    });
    protocol.analyseDivergence(d.id);
    const res = protocol.proposeResolution(d.id, 'evidence_weight');
    protocol.acceptResolution(d.id, res.id);
    const md = protocol.toMarkdown();
    expect(md).toContain('Dispute Protocol');
    expect(md).toContain('Divergence');
    expect(md).toContain('Resolution');
  });
});

describe('DisputeProtocol — Querying', () => {
  test('getDisputes filters by status and category', () => {
    const protocol = new DisputeProtocol();
    protocol.fileDispute({
      parties: [party('a', 'A'), party('b', 'B')],
      subject: 'S1',
      category: 'factual',
    });
    const d2 = protocol.fileDispute({
      parties: [party('c', 'C'), party('d', 'D')],
      subject: 'S2',
      category: 'ethical',
    });
    protocol.analyseDivergence(d2.id);
    expect(protocol.getDisputes({ status: 'filed' }).length).toBe(1);
    expect(protocol.getDisputes({ category: 'ethical' }).length).toBe(1);
  });
});
