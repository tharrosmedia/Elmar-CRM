// src/utils/webhook.ts
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): Promise<boolean> {
  const now = Date.now() / 1000;
  if (Math.abs(now - parseInt(timestamp)) > 600) return false; // 10-min window
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const hmac = await crypto.subtle.sign(
    { name: 'HMAC' },
    key,
    new TextEncoder().encode(payload + timestamp)
  );
  const expected = Buffer.from(hmac).toString('base64');
  return signature === expected;
}