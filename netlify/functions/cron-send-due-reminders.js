import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

webpush.setVapidDetails('mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

export async function handler() {
  const nowISO = new Date().toISOString();
  try {
    // 1) Find due reminders with fact text
    const { data: due, error: dueErr } = await supa
      .from('reminders')
      .select('id, device_id, fact_id, due_at, facts(text)')
      .lt('due_at', nowISO)
      .is('sent_at', null)
      .eq('canceled', false);

    if (dueErr) throw dueErr;
    if (!due || due.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, sent: 0 }) };
    }

    // 2) Fetch active subscriptions for devices that have due reminders
    const deviceIds = Array.from(new Set(due.map(r => r.device_id)));
    const { data: subs, error: subErr } = await supa
      .from('subscriptions')
      .select('endpoint, p256dh, auth, device_id, active')
      .in('device_id', deviceIds)
      .eq('active', true);
    if (subErr) throw subErr;

    const subsByDevice = new Map();
    (subs || []).forEach(s => {
      if (!subsByDevice.has(s.device_id)) subsByDevice.set(s.device_id, []);
      subsByDevice.get(s.device_id).push(s);
    });

    // 3) Send pushes
    let sentCount = 0;
    for (const r of due) {
      const subsForDevice = subsByDevice.get(r.device_id) || [];
      if (subsForDevice.length === 0) continue;

      const payload = JSON.stringify({
        title: 'Never Forget',
        body: r.facts?.text || '',
        tag: r.fact_id,
        data: { fact_id: r.fact_id, reminder_id: r.id }
      });

      for (const s of subsForDevice) {
        const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
        try {
          await webpush.sendNotification(sub, payload);
          sentCount++;
        } catch (e) {
          // Deactivate bad endpoints
          if (e.statusCode === 410 || e.statusCode === 404) {
            await supa.from('subscriptions').update({ active: false }).eq('endpoint', s.endpoint);
          }
          console.error('Push error', e?.statusCode || '', e?.message || e);
        }
      }

      // Mark reminder sent (even if some endpoints failed, we avoid spamming)
      await supa.from('reminders').update({ sent_at: new Date().toISOString() }).eq('id', r.id);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, sent: sentCount }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Cron failed' };
  }
}
