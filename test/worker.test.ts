import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

// These requests go through the real Worker. /api/v1/status, /index.json and
// /services read the live ChittyRegistry, so this file needs network access.

describe("dynamic routes", () => {
  it("GET /health returns the service identity", async () => {
    const res = await SELF.fetch("https://docs.chitty.cc/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", service: "chittydocs" });
  });

  it("GET /api/v1/status reports the live registry", async () => {
    const res = await SELF.fetch("https://docs.chitty.cc/api/v1/status");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { service: string; status: string; registry: { reachable: boolean; services?: number } };
    expect(body.service).toBe("chittydocs");
    expect(body.status).toBe("ok");
    expect(body.registry.reachable).toBe(true);
    expect(body.registry.services).toBeGreaterThan(0);
  });

  it("GET /index.json lists chittydocs from the live registry", async () => {
    const res = await SELF.fetch("https://docs.chitty.cc/index.json");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { pinned: boolean; services: Array<{ name: string; url: string | null }> };
    expect(body.pinned).toBe(false);
    const self = body.services.find((s) => s.name === "chittydocs");
    expect(self?.url).toBe("https://docs.chitty.cc");
  });

  it("GET /services is HTML under a no-script policy", async () => {
    const res = await SELF.fetch("https://docs.chitty.cc/services");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(await res.text()).toContain("chittydocs");
  });

  it("HEAD /health has no body", async () => {
    const res = await SELF.fetch("https://docs.chitty.cc/health", { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
  });

  it("POST /health is rejected", async () => {
    const res = await SELF.fetch("https://docs.chitty.cc/health", { method: "POST" });
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, HEAD");
  });
});

describe("static assets", () => {
  it("GET / serves public/index.html", async () => {
    const res = await SELF.fetch("https://docs.chitty.cc/");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("<title>ChittyOS");
  });

  it("repository files outside public/ are not served", async () => {
    for (const path of ["/CHARTER.md", "/wrangler.jsonc", "/package.json", "/src/index.ts"]) {
      const res = await SELF.fetch(`https://docs.chitty.cc${path}`);
      expect(res.status, path).toBe(404);
    }
  });
});
