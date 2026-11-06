import { escapeHtml, safeHttpsUrl } from "./html";

/** One service as listed by ChittyRegistry GET /api/v1/tools. */
export interface ServiceEntry {
  name: string;
  chitty_id: string | null;
  status: string | null;
  health: string | null;
  /** https origin on chitty.cc, when the record carries one. Other hosts are never linked. */
  url: string | null;
}

export type RegistryResult =
  | { ok: true; served_at: string; services: ServiceEntry[]; dropped: number }
  | { ok: false; served_at: string; error: string; http_status: number | null };

/** Registry responses are cached at the edge for up to this many seconds. */
export const REGISTRY_CACHE_SECONDS = 60;

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function healthOf(value: unknown): string | null {
  if (typeof value === "string") return str(value);
  if (value && typeof value === "object" && "status" in value) {
    return str((value as { status: unknown }).status);
  }
  return null;
}

/** Registry records are publicly submitted, so only chitty.cc hosts are linked. */
export function isChittyHost(hostname: string): boolean {
  return hostname === "chitty.cc" || hostname.endsWith(".chitty.cc");
}

function originOf(record: Record<string, unknown>): string | null {
  const endpoints = Array.isArray(record.endpoints) ? record.endpoints : [];
  const hostname = str(record.hostname);
  const candidates: unknown[] = [record.url, hostname ? `https://${hostname}` : null, ...endpoints];
  for (const candidate of candidates) {
    const safe = safeHttpsUrl(candidate);
    if (!safe) continue;
    const url = new URL(safe);
    if (url.username || url.password || !isChittyHost(url.hostname)) continue;
    return url.origin;
  }
  return null;
}

export function toServiceEntry(record: unknown): ServiceEntry | null {
  if (!record || typeof record !== "object") return null;
  const r = record as Record<string, unknown>;
  const name = str(r.name);
  if (!name) return null;
  return {
    name,
    chitty_id: str(r.chitty_id) ?? str(r.did) ?? str(r.id),
    status: str(r.status),
    health: healthOf(r.health),
    url: originOf(r),
  };
}

/** Validates a parsed /api/v1/tools body. Anything short of a usable, non-empty list is an error. */
export function parseRegistryBody(body: unknown, served_at: string, http_status: number): RegistryResult {
  const fail = (error: string): RegistryResult => ({ ok: false, served_at, error, http_status });
  if (!body || typeof body !== "object") return fail("registry_unexpected_shape");
  const b = body as { success?: unknown; count?: unknown; tools?: unknown };
  if (b.success !== true) return fail("registry_not_successful");
  if (!Array.isArray(b.tools)) return fail("registry_unexpected_shape");
  if (typeof b.count === "number" && b.count !== b.tools.length) return fail("registry_count_mismatch");
  if (b.tools.length === 0) return fail("registry_empty");
  const services = b.tools
    .map(toServiceEntry)
    .filter((s): s is ServiceEntry => s !== null)
    .sort((a, b2) => a.name.localeCompare(b2.name));
  if (services.length === 0) return fail("registry_no_usable_records");
  return { ok: true, served_at, services, dropped: b.tools.length - services.length };
}

/**
 * Reads the live service list. /api/v1/tools is the only KV-backed registry
 * listing; /api/v1/search, /categories and /stats return mock data and must not
 * be used.
 */
export async function fetchRegistry(baseUrl: string, timeoutMs = 5000): Promise<RegistryResult> {
  const served_at = new Date().toISOString();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/v1/tools`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      cf: { cacheTtl: REGISTRY_CACHE_SECONDS },
    } as RequestInit);
  } catch (err) {
    return { ok: false, served_at, error: `registry_unreachable: ${(err as Error).name}`, http_status: null };
  }
  if (!res.ok) {
    return { ok: false, served_at, error: "registry_http_error", http_status: res.status };
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, served_at, error: "registry_invalid_json", http_status: res.status };
  }
  return parseRegistryBody(body, served_at, res.status);
}

export function renderServicesPage(result: RegistryResult, registryUrl: string): string {
  const rows = result.ok
    ? result.services
        .map((s) => {
          const name = escapeHtml(s.name);
          const label = s.url ? `<a href="${escapeHtml(s.url)}">${name}</a>` : name;
          return `<tr><td>${label}</td><td>${escapeHtml(s.status ?? "unknown")}</td><td>${escapeHtml(s.health ?? "unknown")}</td></tr>`;
        })
        .join("\n")
    : "";
  const body = result.ok
    ? `<p>Entries are shown as registered in ChittyRegistry and are not verified by this page. Only chitty.cc addresses are linked.</p>
<table><thead><tr><th>Service</th><th>Status</th><th>Health</th></tr></thead><tbody>
${rows}
</tbody></table>
<p>${result.services.length} services.${result.dropped > 0 ? ` ${result.dropped} registry records without a name were not shown.` : ""}</p>`
    : `<p>ChittyRegistry could not be read (${escapeHtml(result.error)}). No service list is shown rather than an outdated one.</p>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ChittyOS services</title>
<style>body{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:2rem}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:.35rem .5rem;border-bottom:1px solid #ddd}</style>
</head>
<body>
<h1>ChittyOS services</h1>
${body}
<p><small>Source: ChittyRegistry <code>${escapeHtml(registryUrl)}/api/v1/tools</code>, served ${escapeHtml(result.served_at)}; the registry response may be cached for up to ${REGISTRY_CACHE_SECONDS} seconds. Not pinned to a revision.</small></p>
</body>
</html>`;
}
