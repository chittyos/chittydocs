import { describe, expect, it } from "vitest";
import { escapeHtml, safeHttpsUrl } from "../src/html";
import { parseRegistryBody, renderServicesPage, toServiceEntry } from "../src/registry";

// Registry records come from public submission. These inputs are the shapes an
// attacker, or a broken registry, would produce.
const HOSTILE_NAME = `<img src=x onerror="alert(1)">`;
const AT = "2026-11-06T18:00:00.000Z";

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
  it("takes the origin from the first chitty.cc https endpoint", () => {
    const entry = toServiceEntry({
      name: "chittyagent-google",
      status: "active",
      health: "healthy",
      endpoints: ["javascript:alert(1)", "https://evil.example/health", "https://google.chitty.cc/health"],
    });
    expect(entry).toEqual({
      name: "chittyagent-google",
      chitty_id: null,
      status: "active",
      health: "healthy",
      url: "https://google.chitty.cc",
    });
  });

  it("never links a host outside chitty.cc", () => {
    expect(toServiceEntry({ name: "chittyauth", url: "https://evil.example" })?.url).toBeNull();
    expect(toServiceEntry({ name: "chittyauth", hostname: "docs.chitty.cc@evil.example" })?.url).toBeNull();
    expect(toServiceEntry({ name: "chittyauth", url: "https://chitty.cc.evil.example" })?.url).toBeNull();
    expect(toServiceEntry({ name: "chittyauth", url: "https://user:pw@auth.chitty.cc" })?.url).toBeNull();
  });

  it("drops records without a name", () => {
    expect(toServiceEntry({ status: "active" })).toBeNull();
    expect(toServiceEntry(null)).toBeNull();
  });
});

describe("parseRegistryBody", () => {
  const good = { name: "chittydocs", hostname: "docs.chitty.cc" };

  it("rejects anything short of a non-empty successful list", () => {
    const cases: Array<[unknown, string]> = [
      [null, "registry_unexpected_shape"],
      ["tools", "registry_unexpected_shape"],
      [{ success: false, tools: [good] }, "registry_not_successful"],
      [{ success: true }, "registry_unexpected_shape"],
      [{ success: true, count: 2, tools: [good] }, "registry_count_mismatch"],
      [{ success: true, count: 0, tools: [] }, "registry_empty"],
      [{ success: true, tools: [{ status: "active" }] }, "registry_no_usable_records"],
    ];
    for (const [body, error] of cases) {
      const result = parseRegistryBody(body, AT, 200);
      expect(result, JSON.stringify(body)).toEqual({ ok: false, served_at: AT, error, http_status: 200 });
    }
  });

  it("counts records it could not use", () => {
    const result = parseRegistryBody({ success: true, count: 2, tools: [good, { status: "x" }] }, AT, 200);
    expect(result.ok && result.dropped).toBe(1);
  });
});

describe("renderServicesPage", () => {
  it("escapes registry-supplied fields", () => {
    const html = renderServicesPage(
      {
        ok: true,
        served_at: AT,
        dropped: 0,
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
      { ok: false, served_at: AT, error: "registry_http_error", http_status: 502 },
      "https://registry.chitty.cc",
    );
    expect(html).toContain("could not be read (registry_http_error)");
    expect(html).not.toContain("<table>");
  });
});
