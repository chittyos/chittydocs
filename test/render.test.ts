import { describe, expect, it } from "vitest";
import { escapeHtml, safeHttpsUrl } from "../src/html";
import { renderServicesPage, toServiceEntry } from "../src/registry";

// Registry records come from public submission. These inputs are the shapes an
// attacker would submit.
const HOSTILE_NAME = `<img src=x onerror="alert(1)">`;

describe("escapeHtml", () => {
  it("escapes every HTML-significant character", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});

describe("safeHttpsUrl", () => {
  it("accepts https only", () => {
    expect(safeHttpsUrl("https://docs.chitty.cc/health")).toBe("https://docs.chitty.cc/health");
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("http://docs.chitty.cc")).toBeNull();
    expect(safeHttpsUrl("data:text/html,<script>1</script>")).toBeNull();
    expect(safeHttpsUrl("not a url")).toBeNull();
    expect(safeHttpsUrl(42)).toBeNull();
  });
});

describe("toServiceEntry", () => {
  it("takes the origin from the first https endpoint", () => {
    const entry = toServiceEntry({
      name: "chittyagent-google",
      status: "active",
      health: "healthy",
      endpoints: ["javascript:alert(1)", "https://google.chitty.cc/health"],
    });
    expect(entry).toEqual({
      name: "chittyagent-google",
      chitty_id: null,
      status: "active",
      health: "healthy",
      url: "https://google.chitty.cc",
    });
  });

  it("drops records without a name", () => {
    expect(toServiceEntry({ status: "active" })).toBeNull();
    expect(toServiceEntry(null)).toBeNull();
  });
});

describe("renderServicesPage", () => {
  it("escapes registry-supplied fields", () => {
    const html = renderServicesPage(
      {
        ok: true,
        fetched_at: "2026-11-06T18:00:00.000Z",
        services: [{ name: HOSTILE_NAME, chitty_id: null, status: `"><script>alert(2)</script>`, health: null, url: null }],
      },
      "https://registry.chitty.cc",
    );
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("shows no list when the registry is unreadable", () => {
    const html = renderServicesPage(
      { ok: false, fetched_at: "2026-11-06T18:00:00.000Z", error: "registry_http_error", http_status: 502 },
      "https://registry.chitty.cc",
    );
    expect(html).toContain("could not be read (registry_http_error)");
    expect(html).not.toContain("<table>");
  });
});
