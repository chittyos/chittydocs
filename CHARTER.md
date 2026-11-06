---
uri: chittycanon://core/services/chittydocs
namespace: chittycanon://core/services
type: charter
version: 0.2.0
status: DRAFT
registered_with: chittycanon://core/services/chittyregistry
title: ChittyDocs Charter
visibility: PUBLIC
---

# ChittyDocs Charter

## Scope

ChittyDocs serves `docs.chitty.cc`, the read-only documentation surface for ChittyOS. It projects content owned elsewhere and owns no normative content. Where a page disagrees with its source, the source wins.

## API contract

| Route | Method | Returns |
|---|---|---|
| `/health` | GET, HEAD | `{"status":"ok","service":"chittydocs"}` |
| `/api/v1/status` | GET, HEAD | Service version, deployed Worker version, and whether ChittyRegistry was readable, with its service count. `status` is `degraded` when the registry is unreadable. |
| `/index.json` | GET, HEAD | Live service list from ChittyRegistry `GET /api/v1/tools`, marked `pinned: false`. 503 when the registry is unreadable. |
| `/services` | GET, HEAD | The same list as HTML, with registry strings escaped and a no-script CSP. 503 with an explanation when the registry is unreadable. |
| any other path | GET, HEAD | Static files from `public/`. Nothing outside `public/` is published. |

Other methods on the dynamic routes return 405.

## Dependencies

- **ChittyRegistry** `GET https://registry.chitty.cc/api/v1/tools`: the only KV-backed listing. `/api/v1/search`, `/categories` and `/stats` return mock data and are not used.

## Out of scope

- Hosting or editing documents.
- Rendering private-repository content.
- Being an authority for anything it displays.

The planned provenance-pinned rendering of ChittyCanon documents and service triads is described in [`architecture/chittydocs-portal.md`](architecture/chittydocs-portal.md) (phases P1–P3) and is not part of this contract yet.
