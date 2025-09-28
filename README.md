# Never Forget (push-only PWA) — Starter

This is the minimal starter for your iOS web‑push spaced repetition app.

## How to use this ZIP with Option 1 (fresh repo)

1) **Create the repo** on GitHub named `neverforget` (empty repo, no README).  
2) Click **Add file → Upload files**.  
3) On your computer, unzip this file. **Open the unzipped folder and select *all* its contents** (not the folder itself) and drag-drop them into GitHub’s upload page. (Dragging the folder also works in most browsers and preserves directories.)  
4) Commit the upload to the `main` branch.

## Next steps (after files are in GitHub)

### A) Netlify
- **New site from Git** → pick `neverforget` repo.
- Build command: `npm run build`
- Publish directory: `public`

Add these **Environment variables** (Site configuration → Environment variables):
- `SUPABASE_URL` — from your Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server-only)
- `VAPID_PUBLIC_KEY` — from "VAPID keys" step below
- `VAPID_PRIVATE_KEY` — from "VAPID keys" step below

### B) Supabase (run the SQL)
- Create a project → open **SQL Editor**.
- Run **`supabase/schema.sql`** (tables + indexes).
- Run **`supabase/functions.sql`** (helper RPC for listing facts).

### C) VAPID keys (once)
Generate locally and paste into Netlify env vars:
```bash
npm i -g web-push
web-push generate-vapid-keys --json
```

### D) Install on iPhone
- Open the Netlify URL in **Safari on iOS 16.4+**.
- **Share → Add to Home Screen**, then launch from the Home Screen icon.
- Allow notifications when prompted.
- Add a fact and wait for the +1h reminder, or run the quick test below.

### E) Manual test push (optional)
After adding at least one fact, in Supabase SQL run:
```sql
insert into reminders (device_id, fact_id, ix, due_at)
select f.device_id, f.id, 999, now() + interval '1 minute'
from facts f
order by created_at desc
limit 1;
```

## Notes
- Deleting a fact cancels remaining reminders.
- Notification includes a **Snooze 1 day** action (optional function deployed).
- Netlify scheduled functions run approximately every minute (best-effort).

