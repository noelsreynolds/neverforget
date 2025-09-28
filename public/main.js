const deviceKey = 'nf_device_id';
const deviceId = (localStorage.getItem(deviceKey)) || (crypto.randomUUID());
localStorage.setItem(deviceKey, deviceId);

// Register SW early
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

async function ensureSubscription() {
  if (!('Notification' in window)) return null;

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return null;

  const reg = await navigator.serviceWorker.ready;

  // Fetch VAPID public key from server
  const cfg = await fetch('/api/config').then(r => r.json());
  if (!cfg || !cfg.vapidPublicKey) return null;
  const appServerKey = urlBase64ToUint8Array(cfg.vapidPublicKey);

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appServerKey });
  }

  // Send to backend
  try {
    await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        endpoint: sub.endpoint,
        p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
        auth: arrayBufferToBase64(sub.getKey('auth'))
      })
    });
  } catch (e) {
    console.warn('Register failed', e);
  }
  return sub;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function arrayBufferToBase64(buf) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
}

async function addFact(text) {
  await fetch('/api/add-fact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, text })
  });
  await loadFacts();
}

async function deleteFact(id) {
  await fetch('/api/delete-fact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, fact_id: id })
  });
  await loadFacts();
}

async function loadFacts() {
  const ul = document.getElementById('facts');
  ul.innerHTML = '<li class="muted">Loading…</li>';
  try {
    const res = await fetch(`/api/list-facts?device_id=${encodeURIComponent(deviceId)}`);
    const data = await res.json();
    const facts = data.facts || [];
    ul.innerHTML = '';
    if (!facts.length) {
      ul.innerHTML = '<li class="muted">No facts yet. Add your first one above.</li>';
      return;
    }
    for (const f of facts) {
      const li = document.createElement('li');
      const left = document.createElement('div');
      left.innerHTML = `<div>${escapeHtml(f.text)}</div>`;
      const due = f.next_due_at ? new Date(f.next_due_at) : null;
      const right = document.createElement('div');
      right.className = 'muted';
      right.textContent = due ? `next: ${formatRelative(due)}` : 'done';
      const del = document.createElement('button');
      del.className = 'danger';
      del.textContent = 'Delete';
      del.onclick = () => deleteFact(f.id);
      li.append(left);
      const rightWrap = document.createElement('div');
      rightWrap.style.display = 'flex';
      rightWrap.style.gap = '8px';
      rightWrap.append(right, del);
      li.append(rightWrap);
      ul.append(li);
    }
  } catch (e) {
    ul.innerHTML = '<li class="muted">Failed to load. Try reloading.</li>';
    console.error(e);
  }
}

function escapeHtml(s){
  return s.replace(/[&<>\"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
}

function formatRelative(date){
  const now = new Date();
  const diff = date - now;
  const abs = Math.abs(diff);
  const mins = Math.round(abs/60000);
  if (mins < 60) return (diff>0?"in ":"") + mins + " min" + (mins!==1?"s":"");
  const hrs = Math.round(mins/60);
  if (hrs < 48) return (diff>0?"in ":"") + hrs + " hour" + (hrs!==1?"s":"");
  const days = Math.round(hrs/24);
  if (days < 14) return (diff>0?"in ":"") + days + " day" + (days!==1?"s":"");
  return date.toLocaleString();
}

// UI handlers
const form = document.getElementById('fact-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('fact-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  try {
    await ensureSubscription();
  } catch (e) {
    console.warn('Subscription issue', e);
  }
  await addFact(text);
});

window.addEventListener('load', () => {
  loadFacts();
});
