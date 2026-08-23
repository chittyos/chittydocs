# ChittyEntity Projection Model

Normative source: `chittycanon://docs/tech/spec/chittyentity-projection-taxonomy`.

This page is a human-readable projection. ChittyCanon owns the normative ontology/taxonomy lifecycle; this page must remain drift-detectable against that source.

The current Canon document is `DRAFT`; the new/re-scoped taxonomy terms described below remain **PROPOSED** until they pass the Ontology Term Lifecycle gates.

## Model

Keep these dimensions separate:

- **Canonical capability/service** — job-to-be-done and owning service identity.
- **Canonical entity type** — existing ChittyCanon `P | L | T | E | A` ontology.
- **Canonical identity class** — existing `Advocate | Context | Coordinator | Agent` values in `canon.identity_classes`.
- **Proposed projection family** — ChittyAgent, ChittyActor, or ChittyAnima; migration-design terminology, not a new canonical ontology field yet.
- **Projection-definition ownership** — current governed owner of the projection definition; independent of runtime/repository placement.
- **Chitty SDK substrate** — reusable implementation substrate with owned, managed, adapter, or composite provenance. Chitty SDK is not an entity type or autonomy class.
- **Runtime projection** — Cloudflare Worker, container, local process, Google ADK runtime, MCP server, job, etc.
- **Delivery projection** — ChatGPT App, Claude plugin, skill, MCP route, CLI verb, marketplace artifact, API, settings field, instruction block, etc.

`worker` is infrastructure metadata, not an entity type, projection-family value, or ownership declaration.

## Examples

`ChittyConnect` remains the canonical service while `chittyagent-connect` is an agentic projection of ChittyConnect. Under current Canon governance, that family-prefix projection definition is Market-owned until a coordinated governance migration explicitly reassigns it. Implementation placement does not silently transfer ownership.

A ChittyAgent implementation may use owned/composite Chitty SDK substrate that adapts managed frameworks such as Cloudflare Agents SDK or Google ADK and managed protocols such as MCP.

## Chitty SDKs and legacy shared code

`chittyentity/chittysdks/*` is the proposed reusable-substrate home for responsibilities historically carried by portions of `shared/*`: reusable clients, schemas/types, protocol bindings, auth/transport adapters, base classes, framework adapters, and other reusable implementation substrate. Migration is selective rather than a mechanical directory rename.

Proposed target layout:

```text
chittyentity/
  chittyagents/*   # proposed projection-family implementation home
  chittyactors/*   # proposed projection-family implementation home
  chittyanimas/*   # proposed projection-family implementation home
  chittysdks/*     # reusable Chitty SDK substrate
```

Repository placement does not by itself change canonical capability ownership or projection-definition ownership.

## Control plane

- **ChittyCanon** — normative ontology, taxonomy, rule content, lifecycle, and invariants.
- **ChittyRegistry** — discoverable capability/ownership identity.
- **ChittyConfig** — mutable projection pointers, instruction-blueprint composition, surface bindings, rendering provenance, and drift detection; not canonical governance content.
- **ChittyEntity** — implementation homes and Chitty SDK substrate assigned to it by governed ownership records.
- **ChittyMarket** — marketplace/distribution projections and current canonical owner of the specific Market-owned agent definitions identified by the Agent Slug Convention; not the ontology or underlying-capability owner.
- **ChittyCan** — general natural-language verb/command surface (`can git ...`, `can brew ...`, `can <capability> ...`); it routes to capabilities and does not own Canon semantics.
- **ChittyDocs** — human-facing explanatory projection of Canon.

While the projection-family terms remain PROPOSED, consumers should use them only as non-authoritative migration/design guidance and must continue to persist existing canonical IDs, P/L/T/E/A entity types, identity classes, and ownership records.
