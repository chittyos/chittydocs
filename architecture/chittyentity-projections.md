# ChittyEntity Projection Model

Normative source: `chittycanon://docs/tech/spec/chittyentity-projection-taxonomy`.

This page is a human-readable mirror. ChittyCanon owns the taxonomy and lifecycle.

## Model

A ChittyOS capability and its projections are separate concerns.

- **Canonical capability/service** — the job-to-be-done and owning service identity.
- **ChittyEntity class** — semantic expression as ChittyAgent, ChittyActor, ChittyAnima, or ChittySDK.
- **SDK provenance/control** — owned, managed, adapter, or composite implementation substrate.
- **Runtime projection** — Cloudflare Worker, container, local process, Google ADK runtime, MCP server, job, etc.
- **Delivery projection** — ChatGPT App, Claude plugin, skill, MCP route, CLI verb, marketplace artifact, web/API surface.

`worker` is infrastructure metadata, not an entity class.

## Examples

`ChittyConnect` remains the canonical service while `chittyagent-connect` may be an agentic projection of ChittyConnect. The projection does not become the service owner merely because it executes on behalf of the capability.

A ChittyAgent may be built using an owned/composite ChittyAgents SDK that itself adapts managed substrates such as Cloudflare Agents SDK, Google ADK, or MCP.

## ChittySDKs and legacy shared code

`chittyentity/chittysdks/*` partially assumes responsibilities historically carried by `shared/*`: reusable clients, schemas/types, protocol bindings, auth/transport adapters, base classes, framework adapters, and other reusable implementation substrate. Migration is selective; cognitive behavior, autonomous behavior, participant semantics, and implementation-local utilities remain with the correct semantic owner.

## Control plane

- **ChittyCanon** — normative taxonomy and invariants.
- **ChittyRegistry** — discoverable capability/ownership identity.
- **ChittyConfig** — mutable environment/projection pointers.
- **ChittyEntity** — canonical entity-projection implementations and SDK substrate.
- **ChittyMarket** — marketplace/distribution projections.
- **ChittyCan** — natural-language verb/command surface (`can git ...`, `can brew ...`, `can <capability> ...`); it routes to capabilities and does not own Canon semantics.
- **ChittyDocs** — human-readable mirror of the Canon source.

Consumers should resolve canonical IDs/URIs rather than hard-code provisional taxonomy strings where a resolvable identifier exists.
