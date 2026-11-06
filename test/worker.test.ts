import { SELF, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker, { type Env } from "../src/index";

// These requests go through the real Worker against the live ChittyRegistry, so
// this file needs network access. The failure cases point the same Worker at a
// real registry path that does not exist, which returns 404.

const DOCS = "https://docs.chitty.cc";
const BROKEN_REGISTRY = "https://registry.chitty.cc/chittydocs-test-nonexistent";

function brokenEnv(): Env {
  return { ...(env as unknown as Env), REGISTRY_URL: BROKEN_REGISTRY };
}

function callWorker(path: string, e: Env): Promise<Response> {
  return worker.fetch(new Request(`${DOCS}${path}`), e);
}

describe("dynamic routes, registry readable", () => {
  it("GET /health returns the service identity", async () => {
    const res = await SELF.fetch(`${DOCS}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", service: "chittydocs" });
  });

  it("GET /api/v1/status reports the live registry", async () => {
    const res = await SELF.fetch(`${DOCS}/api/v1/status`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { service: string; registry: { reachable: boolean; services?: number } };
    expect(body.service).toBe("chittydocs");
    expect(body.registry.reachable).toBe(true);
    expect(body.registry.services).toBeGreaterThan(0);
  });

  it("GET /index.json lists services and links only chitty.cc", async () => {
    const res = await SELF.fetch(`${DOCS}/index.json`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { pinned: boolean; verified: boolean; services: Array<{ url: string | null }> };
    expect(body.pinned).toBe(false);
    expect(body.verified).toBe(false);
    expect(body.services.length).toBeGreaterThan(0);
    for (const s of body.services) {
      if (s.url !== null) expect(new URL(s.url).hostname.endsWith("chitty.cc"), s.url).toBe(true);
    }
  });

  it("GET /services is HTML under a no-script policy", async () => {
    const res = await SELF.fetch(`${DOCS}/services`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(await res.text()).toContain("<table>");
  });

  it("HEAD /health has no body", async () => {
    const res = await SELF.fetch(`${DOCS}/health`, { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
  });

  it("non-GET methods are rejected on every dynamic route", async () => {
    for (const path of ["/health", "/api/v1/status", "/index.json", "/services", "/services/"]) {
      const res = await SELF.fetch(`${DOCS}${path}`, { method: "POST" });
      expect(res.status, path).toBe(405);
      expect(res.headers.get("allow"), path).toBe("GET, HEAD");
    }
  });
});

describe("dynamic routes, registry unreadable", () => {
  it("/index.json returns 503 with the error", async () => {
    const res = await callWorker("/index.json", brokenEnv());
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "registry_http_error", http_status: 404 });
  });

  it("/services returns 503 and no list", async () => {
    const res = await callWorker("/services", brokenEnv());
    expect(res.status).toBe(503);
    const html = await res.text();
    expect(html).toContain("could not be read (registry_http_error)");
    expect(html).not.toContain("<table>");
  });

  it("/api/v1/status reports degraded", async () => {
    const res = await callWorker("/api/v1/status", brokenEnv());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "degraded", registry: { reachable: false, http_status: 404 } });
  });
});

describe("static assets", () => {
  it("GET / serves public/index.html", async () => {
    const res = await SELF.fetch(`${DOCS}/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("<title>ChittyOS");
  });

  it("repository files outside public/ are not served", async () => {
    for (const path of ["/CHARTER.md", "/wrangler.jsonc", "/package.json", "/src/index.ts"]) {
      const res = await SELF.fetch(`${DOCS}${path}`);
      expect(res.status, path).toBe(404);
    }
  });
});
