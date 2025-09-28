import { createClient } from '@supabase/supabase-js';

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { device_id, endpoint, p256dh, auth } = JSON.parse(event.body || '{}');
    if (!device_id || !endpoint || !p256dh || !auth) return { statusCode: 400, body: 'Missing fields' };

    // Upsert device
    await supa.from('devices').upsert({ id: device_id, last_seen: new Date().toISOString() }, { onConflict: 'id' });

    // Upsert subscription by endpoint
    const { error } = await supa.from('subscriptions').upsert({
      endpoint, p256dh, auth, device_id, active: true
    }, { onConflict: 'endpoint' });
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Register failed' };
  }
}
