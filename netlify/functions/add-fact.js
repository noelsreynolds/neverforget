import { createClient } from '@supabase/supabase-js';

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function scheduleFrom(now) {
  const mins = 60; const day = 24*60; const week = 7*day; const month = 30*day; const year = 365*day;
  return [mins, day, week, month, 3*month, year].map(m => new Date(now.getTime() + m*60000));
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { device_id, text } = JSON.parse(event.body || '{}');
    if (!device_id || !text) return { statusCode: 400, body: 'Missing fields' };

    const { data: factRow, error: factErr } = await supa.from('facts').insert({ device_id, text }).select().single();
    if (factErr) throw factErr;

    const now = new Date();
    const dues = scheduleFrom(now);
    const rows = dues.map((due_at, ix) => ({ device_id, fact_id: factRow.id, ix, due_at: due_at.toISOString() }));
    const { error: remErr } = await supa.from('reminders').insert(rows);
    if (remErr) throw remErr;

    return { statusCode: 200, body: JSON.stringify({ ok: true, fact_id: factRow.id }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Add fact failed' };
  }
}
