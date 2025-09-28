import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { device_id, fact_id } = JSON.parse(event.body || '{}');
    if (!device_id || !fact_id) return { statusCode: 400, body: 'Missing fields' };

    // Mark fact deleted
    const { error: fErr } = await supa.from('facts').update({ deleted: true }).eq('id', fact_id).eq('device_id', device_id);
    if (fErr) throw fErr;

    // Cancel remaining reminders
    const { error: rErr } = await supa.from('reminders').update({ canceled: true }).is('sent_at', null).eq('fact_id', fact_id);
    if (rErr) throw rErr;

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Delete failed' };
  }
}
