import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function handler() {
  try {
    await supa.from('nf_heartbeat').upsert(
      { id: 1, touched_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'heartbeat failed' };
  }
}
