# ChittyEntity Projection Model

Normative source: `chittycanon://docs/tech/spec/chittyentity-projection-taxonomy`.

This page is a human-readable projection. ChittyCanon owns the normative taxonomy and lifecycle; this page must remain drift-detectable against that source.

## Model

Keep these axes separate:

- **Canonical capability/service** — job-to-be-done and owning service identity.
- **Canonical entity type** — existing ChittyCanon `P | L | T | E | A` ontology.
- **Projection family** — ChittyAgent, ChittyActor, or ChittyAnima.
- **Agency / operating profile** — the existing ChittyEntity `Advocate | Context | Coordinator | Agent` doctrine; separate from projection family.
- **SDK substrate** — reusable ChittySDK implementation substrate with owned, managed, adapter, or composite provenance. SDK is not an entity type or autonomy class.
- **Runtime projection** — Cloudflare Worker, container, local process, Google ADK runtime, MCP server, job, etc.
- **Delivery projection** — ChatGPT App, Claude plugin, skill, MCP route, CLI verb, marketplace artifact, API, settings field, instruction block, etc.

`worker` is infrastructure metadata, not an entity type or projection family.

## Examples

`ChittyConnect` remains the canonical service while `chittyagent-connect` may be an agentic projection of ChittyConnect. The projection does not become the service owner merely because it executes on behalf of the capability.

A ChittyAgent may use owned/composite ChittySDK substrate that adapts managed frameworks such as Cloudflare Agents SDK or Google ADK and managed protocols such as MCP.

## ChittySDKs and legacy shared code

`chittyentity/chittysdks/*` partially assumes responsibilities historically carried by `shared/*`: reusable clients, schemas/types, protocol bindings, auth/transport adapters, base classes, framework adapters, and other reusable implementation substrate. Migration is selective rather than a mechanical directory rename.

The target repository homes are:

```text
chittyentity/
  chittyagents/*   # projection family
  chittyactors/*   # projection family
  chittyanimas/*   # projection family
  chittysdks/*     # reusable substrate
```

## Control plane

- **ChittyCanon** — normative ontology, taxonomy, rule content, and invariants.
- **ChittyRegistry** — discoverable capability/ownership identity.
- **ChittyConfig** — mutable projection pointers, instruction-blueprint composition, surface bindings, rendering provenance, and drift detection; not canonical governance content.
- **ChittyEntity** — canonical projection implementations and SDK substrate.
- **ChittyMarket** — marketplace/distribution projections.
- **ChittyCan** — general natural-language verb/command surface (`can git ...`, `can brew ...`, `can <capability> ...`); it routes to capabilities and does not own Canon semantics.
- **ChittyDocs** — human-facing explanatory projection of Canon.

Consumers should resolve canonical IDs/URIs instead of hard-coding provisional taxonomy strings where a resolvable identifier exists.
