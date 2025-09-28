import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function handler(event) {
  try {
    const device_id = event.queryStringParameters?.device_id;
    if (!device_id) return { statusCode: 400, body: 'device_id required' };

    // Use RPC function (created in supabase/functions.sql)
    const { data, error } = await supa.rpc('nf_list_facts_with_next_due', { p_device_id: device_id });
    if (error) throw error;

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ facts: data || [] }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'List failed' };
  }
}
