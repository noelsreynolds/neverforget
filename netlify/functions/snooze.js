import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { reminder_id } = JSON.parse(event.body || '{}');
    if (!reminder_id) return { statusCode: 400, body: 'Missing reminder_id' };

    const { data: r, error } = await supa.from('reminders').select('*').eq('id', reminder_id).single();
    if (error || !r) throw error || new Error('Not found');

    // Insert a new snoozed reminder 1 day from now
    const due_at = new Date(Date.now() + 24*60*60*1000).toISOString();
    await supa.from('reminders').insert({ device_id: r.device_id, fact_id: r.fact_id, ix: 100, due_at });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Snooze failed' };
  }
}
