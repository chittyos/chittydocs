# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The `chittydocs` Worker behind `docs.chitty.cc`. It serves static files from `public/` and four dynamic routes (`/health`, `/api/v1/status`, `/index.json`, `/services`) built from ChittyRegistry `GET /api/v1/tools`. Contract: `CHARTER.md`. Architecture: `CHITTY.md`. Roadmap: `architecture/chittydocs-portal.md`.

## Commands

```bash
npm install
npm run typecheck          # src and tests
npm test                   # vitest in the Workers pool; needs network (reads the live registry)
npx vitest run test/render.test.ts   # escaping and parsing only, no network
npm run dev                # wrangler dev
```

## Deploying

Cloudflare Workers Builds is connected to this repo. A push to `main` runs `npx wrangler deploy`; any other branch runs `npx wrangler versions upload`, and the branch check "Workers Builds: chittydocs" is required on `main`. Do not run `wrangler deploy` by hand alongside it. Rollback is a redeploy of a previous Worker version.

## Rules

- Never call the registry's `/api/v1/search`, `/categories` or `/stats`; they return mock data. `/api/v1/tools` is the source.
- Every registry string written into HTML goes through `escapeHtml`, and every link through `safeHttpsUrl`. `test/render.test.ts` holds hostile inputs for both.
- Only `public/` is published. Do not widen `assets.directory`; `test/worker.test.ts` checks that repository files return 404.
- No mocks and no fixture registry: tests read the live registry, or build inputs inline when the point is escaping.
- Pages in `architecture/` are projections of canonical sources and carry their source revision. They are not served yet (phase P1).

## Gotchas

- The test runtime falls back from the `compatibility_date` in `wrangler.jsonc` (2026-08-20) to the newest date its bundled runtime supports. Passing locally does not prove behaviour at the deployed date.
- `@cloudflare/vitest-pool-workers` is pinned to 0.8.71, the last line supporting vitest 3.2. Newer releases moved to `@cloudflare/vitest-plugin` with vitest 4.
- Observability is off, per the ChittyOS standard.
