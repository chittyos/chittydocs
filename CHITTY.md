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
- `src/registry.ts` reads ChittyRegistry `GET /api/v1/tools` (5-second timeout; the response may be cached at the edge for up to 60 seconds) and turns each record into a name, ChittyID, status, health and origin. A response that is not `success: true`, whose `count` disagrees with its list, or that yields no usable records is treated as unreadable. Records without a name are dropped and counted. Only `https://` origins on `chitty.cc` are linked, because registry records are publicly submitted and are not verified.
- `src/html.ts` escapes every registry string written into HTML. Registry records come from public submission.

Registry data is shown as not pinned to a revision and not verified, with the time it was served and the cache window. When the registry cannot be read, the pages say so and return 503 rather than showing an empty or invented list.

## Ecosystem position

- **Consumes:** ChittyRegistry.
- **Consumers:** people reading ChittyOS documentation, and tools reading `/index.json`.
- **Planned:** provenance-pinned projections of ChittyCanon documents and service triads, with stale detection handed to ChittyConfig. See [`architecture/chittydocs-portal.md`](architecture/chittydocs-portal.md).
