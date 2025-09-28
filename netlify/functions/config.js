export async function handler() {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ vapidPublicKey: process.env.VAPID_PUBLIC_KEY })
  };
}
