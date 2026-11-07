---
layout: default
title: ChittyDocs Portal Architecture
status: DRAFT
---

# ChittyDocs Portal Architecture

**Status:** DRAFT, updated 2026-11-07. P0 is deployed (PR #9, `ef0ba61`); P1–P3 are proposals. Deploys and registry changes need operator approval.

## Purpose

`docs.chitty.cc` is a **read-only projection surface**. It owns no normative content. Every page it serves is rendered from a canonical source and records which source and which revision it was rendered from. A page whose source has moved on is marked stale; it is never presented as current.

ChittyDocs is not an authority. If a page disagrees with its source, the source wins, and the page is regenerated.

## Current state (verified 2026-11-07)

| Item | Finding |
|---|---|
| Serving Worker | This repo (`src/index.ts`, `wrangler.jsonc`, route `docs.chitty.cc/*`). Deployed by Workers Builds on merge to `main`; live version `fa016703`, deployed 2026-11-06T22:12Z. |
| `/health` | 200, `{"status":"ok","service":"chittydocs"}`. |
| `/api/v1/status` | 200. Reports version, deployment id and time, and registry reachability with service and dropped-record counts. It reports `degraded` when the registry is unreadable or records were dropped. It does not yet report a build SHA or stale page count; those arrive with the P1 builder. |
| `/index.json`, `/services` | 200. Built from ChittyRegistry `GET /api/v1/tools` (60s cache), 50 services, links limited to https `chitty.cc` origins, all registry strings HTML-escaped. Both return 503 when the registry is unreadable. |
| Static assets | Served only from `public/`. Repository files (`/CHARTER.md`, `/wrangler.jsonc`, `/src/*`) return 404. |
| Live proxy tier (`/{service}/*`) | Not ported in P0; returns 404. The old `chittyos/chittyos-workspace/chittydocs` Worker that had it no longer serves the route. |
| Triad | `CHARTER.md` (`chittycanon://core/services/chittydocs`), `CHITTY.md` and `CLAUDE.md` describe the deployed Worker. |
| Registry record | Still lists `security.auth_required: true` with scope `chitty:service:read`. See decision 3. |

## Sources

Every source is read at a specific revision. Nothing is rendered from "whatever is there now".

1. **ChittyCanon.** Normative ontology, terms, policies and specs.
   - Today `canon.chittyfoundation.org` serves `/api/ontology`, `/api/terms`, `/api/policies` and `/api/schemas`.
   - `chittycanon://` URIs are validated (`src/lib/canonical-uri.ts`) but cannot be resolved to a document, and there is no revision field.
   - Term maturity exists (`PROPOSED→SIMULATED→PROVISIONAL→PROVEN→CANONICAL`, `src/workflows/term-lifecycle.ts`).
   - Document `status` is free text (`src/lib/frontmatter-schema.ts`).
   - **Revision used:** the ChittyCanon git commit SHA, as the existing projection page already does.
2. **Service triads.** `CHARTER.md`, `CHITTY.md` and `CLAUDE.md` of each registered service, read from the service's default branch at a commit SHA.
3. **ChittyRegistry `GET /api/v1/tools`.** The list of services, and the only KV-backed listing.
   - Records carry `chitty_id`, `name`, `endpoints`, `metadata`, `status`, `health` and the score fields, but **no repository field**.
   - The `/api/v1/search`, `/categories` and `/stats` handlers return mock data and are never used.
4. **Service-hosted docs (`{service}.chitty.cc/docs/*`).** The existing gateway proxy pattern. These are live and unpinned, and are labelled as such. They carry no provenance guarantee.

## Components

```
           ┌──────────── sources (read at a revision) ────────────┐
           │ ChittyCanon repo @SHA   service repos @SHA   Registry │
           └───────────────┬──────────────────────────────────────┘
                           ▼
   Builder (GitHub Actions in chittyos/chittydocs: schedule + repository_dispatch)
     fetch → render markdown → sanitize → write page + provenance record
                           ▼
        static assets (Workers assets; R2 only if size requires it)
        + provenance manifest (manifest.json)
                           ▼
   Serving Worker (docs.chitty.cc)
     /                 index from manifest
     /canon/<uri>      canon projections
     /services/<name>  triad pages
     /<service>/*      live proxy tier (labelled unpinned)
     /health           {"status":"ok","service":"chittydocs"}
     /api/v1/status    build SHA, last build, stale page count
     /index.json       machine-readable index
```

### Builder

- Deterministic, with no model calls. Same inputs at the same SHAs produce byte-identical output.
- Inputs:
  - the canon document list, pinned to a canon SHA
  - the registry service list
  - each service's repository, resolved through the mapping below
- For each page it writes a **provenance record**:

  ```json
  {
    "page": "/services/chittyconnect",
    "source_kind": "triad",
    "source_uri": "chittycanon://… | github:chittyos/chittyconnect",
    "source_path": "CHARTER.md",
    "source_sha": "<commit>",
    "canon_status": "DRAFT",
    "term_maturity": "PROPOSED",
    "rendered_at": "<iso8601>",
    "renderer_version": "<builder git sha>",
    "content_sha256": "<hash of rendered body>"
  }
  ```

- Missing or unreadable sources produce a page that says so. The builder never fills a gap with placeholder text, and a failed fetch fails the build for that page rather than shipping old content as new.
- Triad completeness comes from the existing scanners: `chittycanon/scripts/portfolio_compliance_scan.mjs` and `chittyops/compliance/audit.js`. A third scanner is not written here.

### Serving Worker

- Lives in this repo (done in P0), so the service has one home.
- It serves static assets and the manifest. It has no database and no secrets.
- The live proxy tier, for services that publish their own `/docs`, is not yet ported. If it returns, it is visibly marked as unpinned.
- All registry-sourced strings are HTML-escaped. Rendered markdown is sanitized, with no raw HTML and no scripts, because repo content is untrusted input.

### Drift

- A page is **stale** when its source's current revision differs from its `source_sha`. Stale pages show a banner naming both revisions. `/api/v1/status` reports the count and the list.
- **Ownership.** ChittyConfig is documented as the owner of "projection pointers, rendering provenance, and drift state" (`README.md:12`, `CLAUDE.md:70-84`), but its registry, render and `drift()` are stubs (`src/index.ts:94-105`, `:128-135`, `:187-193`). So:
  - **Interim:** the builder computes staleness itself.
  - **Target:** the manifest format above is what ChittyConfig consumes, and `docs.chitty.cc` registers as a projection surface in ChittyConfig once its registry is real. The builder's drift check is then removed, so there is no second drift engine.

## Decisions needed

1. **Mapping services to repositories.** The registry has no repository field. Options:
   - (a) A `metadata.repository` convention on registry records, set through `register.chitty.cc`.
   - (b) A mapping file kept in ChittyConfig.

   Recommend (a): the registry is already the directory, and (b) would add a second list of services.
2. **How canon documents are read.**
   - Phase 1 reads the ChittyCanon repo at a pinned SHA, which works today.
   - Phase 2 needs a canon route that returns a document's body, revision and status by URI. That route is a ChittyCanon change, not a ChittyDocs one.
3. **Registry record correction.** `security.auth_required: true` with scope `chitty:service:read` is wrong for a public docs site. Fixing it is a registry mutation and needs approval.

## Phases

| Phase | Scope | Exit check |
|---|---|---|
| P0 Consolidate (**done**, PR #9) | Move the Worker into this repo, write a real triad (correct canon URI), fix `/health` and `/api/v1/status`, escape the index, fix the README link. | `curl docs.chitty.cc/health` and `/api/v1/status` both return 200 with real data. The XSS test, a registry name containing `<script>`, renders escaped. |
| P1 Triad pages | The builder renders triads for registered services that have a repository mapping, with provenance and stale banners. | Every page has a provenance record. Editing a source repo makes its page stale on the next build. |
| P2 Canon pages | Generalize `chittyentity-projections.md` to the canon document set, pinned by SHA. | Each canon page shows its status, maturity and SHA, and a changed canon SHA marks the page stale. |
| P3 Hand off drift | ChittyConfig consumes the manifest, and the builder's drift check is removed. | `chittyconfig drift()` reports ChittyDocs pages. |

## Cost

Static assets, a Worker with no database or KV, and GitHub Actions builds. Expected recurring cost is about $0, within startup-mode limits. R2 is used only if total assets outgrow Workers static-asset limits.

## Out of scope

- Hosting or editing documents (a document service).
- Private-repo content. Only public sources are rendered.
- Search beyond a static client-side index.
