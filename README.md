# Dispute Protocol (DSP-1.0)

Structured resolution for AI disagreements.

The Dispute Protocol provides a transparent process for resolving disagreements between AI agents, or between humans and AI agents. It compares Clearpath reasoning traces to find exactly where and why they diverge, proposes resolution methods, records the outcome, and builds precedent for future disputes.

Clearpath traces what was decided. The Dispute Protocol resolves conflicts between decisions.

## Why this exists

When two AI agents reach different conclusions, or when a human disagrees with an AI recommendation, there is no structured process for resolution. Who is right? Based on what? Where exactly did the reasoning diverge? Today these disputes are resolved informally, inconsistently, or not at all.

The Dispute Protocol finds the divergence, surfaces the conflicting assumptions, proposes resolution methods, and records everything. It identifies where reasoning differs, not who is wrong.

## What it does

Every dispute records the parties, their positions, and optionally their Clearpath traces. The protocol analyses the traces to find exactly where reasoning diverged. Multiple resolution methods are available. The losing position is always preserved as dissent. Resolved disputes become precedent for future cases.

Four capabilities:

**Divergence finding** compares two Clearpath traces node by node. Where did the parties have different evidence? Different assumptions? Different interpretations of the same evidence? Different weights on competing factors? The root cause is classified so the right resolution method can be applied.

**Multi-method resolution** offers different approaches for different disputes. Evidence weight for factual disagreements. Authority hierarchy for jurisdictional disputes. Conservative default for high-stakes uncertainty. Precedent-based for recurring dispute types. Human arbiter when automated resolution is insufficient.

**Dissent preservation** records the losing position on every resolved dispute. Dissent is never erased. If a resolution later turns out to be wrong, the dissenting position is on record and traceable.

**Precedent building** generalises resolved disputes into patterns. When a new dispute of the same type arises, relevant precedents are surfaced. Precedents inform but don't dictate — they are evidence, not rules.

## Dispute categories

- **factual** — parties disagree on facts or evidence
- **interpretive** — same evidence, different conclusions
- **methodological** — different reasoning approaches
- **ethical** — value conflict
- **jurisdictional** — dispute over who has authority to decide
- **priority** — agreement on facts but disagreement on what matters most
- **confidence** — agreement on conclusion but disagreement on certainty

## Resolution methods

- **evidence_weight** — stronger evidence chain wins
- **authority_hierarchy** — higher authority in the domain wins
- **consensus** — both parties must agree
- **precedent** — apply previous resolution pattern
- **human_arbiter** — require human decision
- **domain_expert** — require domain expert input
- **majority** — simple majority for multi-party disputes
- **conservative_default** — minimise potential harm when uncertain

Repository: https://github.com/repowazdogz-droid/dispute-protocol

## Install

```bash
npm install
npm run build
```

## Quick start

```javascript
const { DisputeProtocol } = require('./dist/index');

const protocol = new DisputeProtocol();

// File a dispute
const dispute = protocol.fileDispute({
  parties: [
    { id: 'agent-a', type: 'agent', name: 'Clinical AI', clearpath_trace_id: 'trace-001' },
    { id: 'surgeon-1', type: 'human', name: 'Dr Smith', clearpath_trace_id: 'trace-002' }
  ],
  subject: 'Surgical timing for L4/5 disc herniation',
  category: 'interpretive'
});

// Analyse where reasoning diverged
const divergences = protocol.analyseDivergence(dispute.id);
divergences.forEach(d => {
  console.log(d.description);
  console.log('Root cause:', d.root_cause);
  console.log('Agent position:', d.party_a_position);
  console.log('Surgeon position:', d.party_b_position);
});

// Propose resolution
const resolution = protocol.proposeResolution(dispute.id, 'evidence_weight');
console.log(resolution.outcome);
console.log(resolution.reasoning);
console.log(resolution.dissent); // losing position preserved

// Accept resolution
protocol.acceptResolution(dispute.id, resolution.id);

// Record precedent for future disputes
protocol.recordPrecedent(dispute.id, ['clinical', 'surgical_timing']);

// Find relevant precedent for a new dispute
const precedents = protocol.findPrecedent('interpretive', 'clinical');

// Verify integrity
console.log(protocol.verify());
```

## Test

```bash
npm test
```

25 tests covering: dispute filing, Clearpath trace references, hash chain integrity, status management, divergence analysis (different evidence, different assumptions, different interpretations, different weights, no divergence), resolution (evidence weight, authority hierarchy, conservative default, dissent recording, rejection and re-proposal, escalation), precedent (recording, lookup by category, lookup by domain), multi-party disputes, majority resolution, deadlock detection, and JSON export/import roundtrip.

## Divergence root causes

| Root cause | Meaning | Best resolution method |
|------------|---------|----------------------|
| different_evidence | Parties have different facts | evidence_weight |
| different_interpretation | Same facts, different conclusions | domain_expert |
| different_assumptions | Different underlying beliefs | human_arbiter |
| different_values | Fundamental value conflict | consensus or escalation |
| different_weights | Same factors, different priorities | authority_hierarchy |

## How it works

The Dispute Protocol is a library, not a service. No server. No database. No UI. It is the protocol layer that other applications build on.

A multi-agent system imports the Dispute Protocol → agent disagreements are resolved structurally instead of arbitrarily. A clinical decision support system imports the Dispute Protocol → disagreements between AI and clinician are traced and resolved with full transparency. A regulatory body imports the Dispute Protocol → contested AI decisions have a formal resolution process.

The protocol is domain-agnostic. The dispute mechanism is identical. The stakes change.

## Relationship to other protocols

Clearpath (CAP-1.0) provides the reasoning traces that the Dispute Protocol compares. The Assumption Registry (ARP-1.0) surfaces the conflicting assumptions that often drive divergence. The Trust Score (TSP-1.0) can inform authority-based resolution. Together they provide structured disagreement resolution grounded in verifiable reasoning.

## Status

- 25 tests passing
- TypeScript, zero external dependencies
- Open-source (MIT)
- Part of the Omega reasoning infrastructure

## License

MIT
