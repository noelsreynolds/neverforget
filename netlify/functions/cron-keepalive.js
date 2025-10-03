import { request as httpsRequest } from "https";

function postJson({ url, headers, body }) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const options = {
      method: "POST",
      hostname: u.hostname,
      path: u.pathname + (u.search || ""),
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        ...headers
      }
    };
    const req = httpsRequest(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode || 500, body: data || "" }));
    });
    req.on("error", (err) => resolve({ status: 500, body: JSON.stringify({ ok: false, error: String(err) }) }));
    req.write(body);
    req.end();
  });
}

export async function handler() {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Missing env vars" })
      };
    }

    const payload = JSON.stringify({ id: 1, touched_at: new Date().toISOString() });
    const { status, body } = await postJson({
      url: `${url}/rest/v1/nf_heartbeat`,
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: payload
    });

    if (status >= 200 && status < 300) {
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body };
    }
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, status, body })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: String(e) })
    };
  }
}
