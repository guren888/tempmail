const MAILCX_API = "https://api.mail.cx/v1";

function corsHeaders(origin) {
  const allowed = origin || "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(data, status=200, origin="*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin),
  });
}

function getPath(request) {
  const url = new URL(request.url);
  return {
    url,
    path: url.pathname.replace(/^\/+/, "").split("/"),
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const token = env.MAILCX_API_TOKEN;
    if (!token) {
      return json({ error: "MAILCX_API_TOKEN belum dipasang di Worker." }, 500, origin);
    }

    const { url, path } = getPath(request);

    // Public config: GET /api/config
    if (request.method === "GET" && path[0] === "api" && path[1] === "config") {
      return proxy("/config", "GET", null, url.search, origin, token);
    }

    // Inbox: GET /api/inbox/<email>
    if (request.method === "GET" && path[0] === "api" && path[1] === "inbox" && path[2]) {
      return proxy(`/inbox/${encodeURIComponent(path.slice(2).join("/"))}`, "GET", null, url.search, origin, token);
    }

    // Full email: GET /api/email/<id>
    if (request.method === "GET" && path[0] === "api" && path[1] === "email" && path[2]) {
      return proxy(`/email/${encodeURIComponent(path.slice(2).join("/"))}`, "GET", null, url.search, origin, token);
    }

    // Delete all inbox: DELETE /api/inbox/<email>
    if (request.method === "DELETE" && path[0] === "api" && path[1] === "inbox" && path[2]) {
      return proxy(`/inbox/${encodeURIComponent(path.slice(2).join("/"))}`, "DELETE", null, url.search, origin, token);
    }

    return json({ error: "Endpoint tidak ditemukan." }, 404, origin);
  },
};

async function proxy(path, method, body, search, origin, token) {
  const target = `${MAILCX_API}${path}${search || ""}`;

  try {
    const response = await fetch(target, {
      method,
      headers: {
        "x-api-token": token,
        "Accept": "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body || undefined,
    });

    const text = await response.text();

    return new Response(text, {
      status: response.status,
      headers: corsHeaders(origin),
    });
  } catch (error) {
    return json({ error: "Gagal terhubung ke Mail.cx.", detail: String(error) }, 502, origin);
  }
}
