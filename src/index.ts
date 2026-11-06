import { fetchRegistry, renderServicesPage } from "./registry";

export interface Env {
  ASSETS: Fetcher;
  CF_VERSION_METADATA: WorkerVersionMetadata;
  REGISTRY_URL: string;
}

const SERVICE = "chittydocs";
const VERSION = "0.2.0";

// Generated pages contain no scripts; registry strings are escaped and this
// policy keeps any escaping miss from executing.
const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
};

function respond(request: Request, body: string, status: number, headers: Record<string, string>): Response {
  return new Response(request.method === "HEAD" ? null : body, { status, headers });
}

function json(request: Request, data: unknown, status = 200): Response {
  return respond(request, JSON.stringify(data), status, {
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
}

async function status(request: Request, env: Env): Promise<Response> {
  const registry = await fetchRegistry(env.REGISTRY_URL);
  return json(request, {
    service: SERVICE,
    version: VERSION,
    status: registry.ok ? "ok" : "degraded",
    deployment: {
      version_id: env.CF_VERSION_METADATA?.id ?? null,
      version_tag: env.CF_VERSION_METADATA?.tag || null,
      deployed_at: env.CF_VERSION_METADATA?.timestamp ?? null,
    },
    registry: registry.ok
      ? { url: env.REGISTRY_URL, reachable: true, services: registry.services.length, read_at: registry.fetched_at }
      : { url: env.REGISTRY_URL, reachable: false, error: registry.error, http_status: registry.http_status, read_at: registry.fetched_at },
  });
}

async function indexJson(request: Request, env: Env): Promise<Response> {
  const registry = await fetchRegistry(env.REGISTRY_URL);
  if (!registry.ok) {
    return json(request, { error: registry.error, http_status: registry.http_status, read_at: registry.fetched_at }, 503);
  }
  return json(request, {
    source: `${env.REGISTRY_URL}/api/v1/tools`,
    pinned: false,
    read_at: registry.fetched_at,
    services: registry.services,
  });
}

async function servicesPage(request: Request, env: Env): Promise<Response> {
  const registry = await fetchRegistry(env.REGISTRY_URL);
  return respond(request, renderServicesPage(registry, env.REGISTRY_URL), registry.ok ? 200 : 503, HTML_HEADERS);
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const dynamic = ["/health", "/api/v1/status", "/index.json", "/services", "/services/"].includes(pathname);
    if (dynamic && request.method !== "GET" && request.method !== "HEAD") {
      return new Response(JSON.stringify({ error: "method_not_allowed" }), {
        status: 405,
        headers: { allow: "GET, HEAD", "content-type": "application/json; charset=utf-8" },
      });
    }
    switch (pathname) {
      case "/health":
        return json(request, { status: "ok", service: SERVICE });
      case "/api/v1/status":
        return status(request, env);
      case "/index.json":
        return indexJson(request, env);
      case "/services":
      case "/services/":
        return servicesPage(request, env);
      default:
        return env.ASSETS.fetch(request);
    }
  },
} satisfies ExportedHandler<Env>;
