---
uri: chittycanon://core/services/chittydocs/chitty
namespace: chittycanon://core/services
type: architecture
version: 0.2.0
status: DRAFT
registered_with: chittycanon://core/services/chittyregistry
title: ChittyDocs Architecture and Ecosystem Position
visibility: PUBLIC
---

# ChittyDocs

## Identity

- Registry: `did:chitty:foundation:chittydocs`, hostname `docs.chitty.cc`
- Runtime: Cloudflare Worker `chittydocs` (account ChittyCorp LLC) with static assets from `public/`
- Repository: `chittyos/chittydocs`

## Architecture

One Worker, no database, no KV and no secrets.

- `src/index.ts` routes `/health`, `/api/v1/status`, `/index.json` and `/services`, and hands everything else to the static assets binding.
- `src/registry.ts` reads ChittyRegistry `GET /api/v1/tools` live (60-second edge cache, 5-second timeout) and turns each record into a name, ChittyID, status, health and https origin. A record without a name is dropped. A non-https URL is never used as a link.
- `src/html.ts` escapes every registry string written into HTML. Registry records come from public submission.

Registry data is shown as live and not pinned to a revision. When the registry cannot be read, the pages say so and return 503; they never show an older list as if it were current.

## Ecosystem position

- **Consumes:** ChittyRegistry.
- **Consumers:** people reading ChittyOS documentation, and tools reading `/index.json`.
- **Planned:** provenance-pinned projections of ChittyCanon documents and service triads, with stale detection handed to ChittyConfig. See [`architecture/chittydocs-portal.md`](architecture/chittydocs-portal.md).
