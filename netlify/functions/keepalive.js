const https = require("https");

function getJson(url, headers) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const options = {
      method: "GET",
      hostname: u.hostname,
      path: u.pathname + (u.search || ""),
      headers
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode || 500, body: data || "" }));
    });
    req.on("error", (err) =>
      resolve({ status: 500, body: JSON.stringify({ ok: false, error: String(err) }) })
    );
    req.end();
  });
}

exports.handler = async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Missing env vars" })
    };
  }

  // Read a row from nf_heartbeat via Supabase REST
  const { status, body } = await getJson(
    `${url}/rest/v1/nf_heartbeat?select=id,touched_at&limit=1`,
    { Authorization: `Bearer ${key}`, apikey: key }
  );

  if (status >= 200 && status < 300) {
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body };
  }
  return {
    statusCode: 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: false, status, body })
  };
};
