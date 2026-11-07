---
title: "Fractal Trinity and Integrated Temporal Continuum"
description: "ChittyOS root-level identity, authority, connectivity architecture and its cross-cutting temporal dimension."
status: "DRAFT"
source_authority: "chittyfoundation/chittyschema"
schema_ref: "chittycanon://core/services/chittyschema#meta/fractal-layout"
source_path: "identity/schemas/meta/fractal-layout.schema.json"
runtime_certified: false
---

# Framework Architecture: The Fractal Trinity and Temporal Continuum

> **Source-bound draft.** This page explains the canonical *three-plane* repository layout and the temporal continuum. It does not modify ChittyCanon, certify service endpoints, or assert that the proposed TVRτ / DRL deployments are operational.

## Foundational entity model

The [ChittyEntity governance source](https://github.com/chittyos/chittyentity/blob/main/chittysdks/agent-core/src/governance.ts) expresses the entity model as:

```text
Entity = TY + VY + RY + t
```

The expression describes three architectural aspects and time as a cross-cutting coordinate; it does **not** require a fourth top-level temporal directory.

| Plane | Meaning | Owned concerns | Temporal context |
|---|---|---|---|
| **TY — Identity** | What an entity **is** | ChittyID, registration, provenance, lineage, credential identity | Genesis, identity continuity, issuance and key validity windows |
| **VY — Connectivity** | How an entity **acts** | Interactions, execution telemetry, peer experience, reliability | Event time, durations, ordered interactions, evaluation windows and decay |
| **RY — Authority** | Where an entity **sits** within governed scope | Delegated capabilities, grants, revocation, execution eligibility | Grant validity, credential expiration, lease deadlines, revocation epochs |
| **t / τ — Temporal continuum** | When each assertion is valid or observed | Cross-plane timestamps and signed ledger ordering | Event-time versus processing-time, replay watermark, sequence anchors, freshness |

The model does not confer a capability merely because its reputation score is high: **a TVR score can inform routing, but only valid authority grants and task policies can authorize execution.**

## Canonical repository directory layout

The [ChittySchema fractal-layout meta-schema](https://github.com/chittyfoundation/chittyschema/blob/main/identity/schemas/meta/fractal-layout.schema.json) and [chittyseed-fractal](https://github.com/chittyfoundation/chittyseed-fractal) template declare **root-level** directories:

```text
/
├── identity/
│   ├── src/            # Service implementation, entity types and algorithms
│   ├── agents/         # Service-specific agents, if present
│   ├── schemas/        # Schema definitions owned by this service
│   └── scripts/        # Generation and validation helpers
├── authority/
│   ├── canon/          # References to normative ChittyCanon rules
│   ├── certifications/ # Actual certification evidence
│   └── owners/         # Ownership and governance
├── connectivity/
│   ├── api/            # HTTP entrypoints
│   ├── integrations/   # External and peer bindings
│   ├── migrations/     # Owned data-schema migrations
│   ├── releases/
│   └── deployments/
├── scopes/             # Recursive child scopes
├── scope.json          # Repository scope identity
├── CHARTER.md
├── CHITTY.md
├── CLAUDE.md
├── README.md
├── package.json
└── tsconfig.json
```

**Not canonical template paths:** top-level `src/identity/`, `src/connectivity/`, `src/authority/`, or `src/temporal/`. The current meta-schema explicitly forbids an independent `src/` inside `connectivity/`. A root `contracts/` directory may be proposed by a service but is **not** among the template's required directories. The normal service-owned schema location is `identity/schemas/`, and HTTP handlers belong in `connectivity/api/`.

Do not use directory naming alone to imply that ChittySchema has certified a repository. Validation must execute against the actual meta-schema, the repository scope manifest, and any service-specific requirements.

## Temporal grounding within each plane

### Identity — TY

Genesis and registration dates, signed birth/lineage receipts, ChittyID registration version, credential validity windows and issuer key rotation are identity-time evidence. Claims about live Ed25519 issuance or mTLS support require confirmed ChittyCert/ChittyID implementations; the inspected ChittyCert charter currently describes HMAC-SHA256 certificates, not a completed signed CRL publisher.

### Connectivity — VY

Interaction events must distinguish *source event time* from ingestion/processing time. The proposed F-070 design uses a 90-day peer experience window and a 45-day decay half-life. These are **proposed calibration values**, not universally certified ChittyOS constants. The existing ChittyVerify fractal evaluator has a different decay configuration; reconcile algorithms before presenting results as canonical.

### Authority — RY

Capability grants and policy decide permission. Short-lived *evaluation tickets* proposed for F-070 (60 seconds) must be distinguished from ChittyTasks' existing renewable database execution leases (default 600 seconds). Expiration of a token must not be presented as proof that running work was terminated: worker revocation and cancellation controls require separate enforcement and observation.

### Ledger sequence and freshness

Ledger event IDs, immutable receipt hashes, signed sequence anchors and deterministic as-of watermarks can link all three planes without creating an extra directory. The proposed rejection threshold at **more than 10 blocks of ledger lag** is a *draft operational control*, not a verified live ChittyLedger/F-070 guarantee. Correctness requires an authenticated canonical head, signature validation, event replay controls and policy-defined finality.

## Schema and documentation contract

The authoritative schema sources are maintained by the owning service and [ChittySchema](https://github.com/chittyfoundation/chittyschema). Human-oriented ChittyDocs pages are **projections**, not validation authorities.

- Use Draft 2020-12 and authoritative schema IDs when they are actually published and inspected.
- A registered schema and a running HTTP service are independently verified facts; neither proves the other.
- Mapping a schema to a TY/VY/RY plane or P/L/T/E/A entity type requires explicit authoritative metadata. Inferring taxonomy from names is not certification.
- The proposed ChittyDocs `scripts/generate-schema-docs.js` is a deterministic Markdown renderer only; it cannot verify ChittyCert signatures, confirm ledger anchors or establish a zero-drift state.
- A previously proposed `GET /api/registry/manifest` signed-catalog endpoint was not found in the inspected ChittySchema route source. An automatic sync workflow must not claim success until the manifest transport, issuer identity and signatures are verified.

## Related specifications and implementation status

| Capability | Owning implementation or tracker | Status |
|---|---|---|
| F-070 TVRτ and DRL | [chittyentity issue #937](https://github.com/chittyos/chittyentity/issues/937) | Specification and reconciliation; deployment unverified |
| ChittyTasks task claiming | [agent-tasks.ts](https://github.com/chittyos/chittyentity/blob/main/chittysdks/agent-data/src/agent-tasks.ts) | Existing DB lease logic inspected |
| Sybil/entropy evaluation | ChittyAdversary and [issue #937](https://github.com/chittyos/chittyentity/issues/937) | Proposed tests; no signed pass receipt |
| ChittyCert CRL and edge prewarming | [ChittyCert repo](https://github.com/chittyfoundation/chittycert) | Proposed CRL API and verifier; not independently validated live |
| Service template | [chittyseed-fractal](https://github.com/chittyfoundation/chittyseed-fractal) | Actual root-level fractal-trinity template |
| AI CONFIGS drift | [ChittyConfig PR #52](https://github.com/chittyos/chittyconfig/pull/52) | Draft approval/reconciliation architecture |

## Publishing guardrails

This page lives in `docs/architecture/` by request. **The current ChittyDocs Cloudflare Worker publishes static assets from `public/` only** and does not make this path a public site route. Publication, live schema sync, CI certification, and provenance pinning require separately reviewed implementations. Do not reclassify any unverified endpoint or proposed policy as operational based on this page.
