export async function handler() {
  try {
    const env = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, env })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: String(e) })
    };
  }
}
