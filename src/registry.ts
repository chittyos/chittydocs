import { escapeHtml, safeHttpsUrl } from "./html";

/** One service as listed by ChittyRegistry GET /api/v1/tools. */
export interface ServiceEntry {
  name: string;
  chitty_id: string | null;
  status: string | null;
  health: string | null;
  /** https origin of the service, when the record carries one. */
  url: string | null;
}

export type RegistryResult =
  | { ok: true; fetched_at: string; services: ServiceEntry[] }
  | { ok: false; fetched_at: string; error: string; http_status: number | null };

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

function originOf(record: Record<string, unknown>): string | null {
  const endpoints = Array.isArray(record.endpoints) ? record.endpoints : [];
  const hostname = str(record.hostname);
  const candidates: unknown[] = [record.url, hostname ? `https://${hostname}` : null, ...endpoints];
  for (const candidate of candidates) {
    const safe = safeHttpsUrl(candidate);
    if (safe) return new URL(safe).origin;
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

/**
 * Reads the live service list. /api/v1/tools is the only KV-backed registry
 * listing; /api/v1/search, /categories and /stats return mock data and must not
 * be used.
 */
export async function fetchRegistry(baseUrl: string, timeoutMs = 5000): Promise<RegistryResult> {
  const fetched_at = new Date().toISOString();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/v1/tools`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      cf: { cacheTtl: 60 },
    } as RequestInit);
  } catch (err) {
    return { ok: false, fetched_at, error: `registry_unreachable: ${(err as Error).name}`, http_status: null };
  }
  if (!res.ok) {
    return { ok: false, fetched_at, error: "registry_http_error", http_status: res.status };
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, fetched_at, error: "registry_invalid_json", http_status: res.status };
  }
  const tools = (body as { tools?: unknown }).tools;
  if (!Array.isArray(tools)) {
    return { ok: false, fetched_at, error: "registry_unexpected_shape", http_status: res.status };
  }
  const services = tools
    .map(toServiceEntry)
    .filter((s): s is ServiceEntry => s !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
  return { ok: true, fetched_at, services };
}

export function renderServicesPage(result: RegistryResult, registryUrl: string): string {
  const rows =
    result.ok
      ? result.services
          .map((s) => {
            const name = escapeHtml(s.name);
            const label = s.url ? `<a href="${escapeHtml(s.url)}">${name}</a>` : name;
            return `<tr><td>${label}</td><td>${escapeHtml(s.status ?? "unknown")}</td><td>${escapeHtml(s.health ?? "unknown")}</td></tr>`;
          })
          .join("\n")
      : "";
  const body = result.ok
    ? `<table><thead><tr><th>Service</th><th>Status</th><th>Health</th></tr></thead><tbody>
${rows}
</tbody></table>
<p>${result.services.length} services.</p>`
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
<p><small>Source: ChittyRegistry <code>${escapeHtml(registryUrl)}/api/v1/tools</code>, read ${escapeHtml(result.fetched_at)}. Live and not pinned to a revision.</small></p>
</body>
</html>`;
}
