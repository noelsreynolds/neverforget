create or replace function nf_list_facts_with_next_due(p_device_id uuid)
returns table (id uuid, text text, created_at timestamptz, next_due_at timestamptz)
language sql as $$
  select f.id, f.text, f.created_at,
         (
           select min(r.due_at) from reminders r
           where r.fact_id = f.id and r.sent_at is null and r.canceled = false
         ) as next_due_at
  from facts f
  where f.device_id = p_device_id and f.deleted = false
  order by f.created_at desc;
$$;
