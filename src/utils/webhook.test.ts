// src/utils/webhook.test.ts
import { verifyWebhookSignature } from './webhook';

describe('Webhook Signature', () => {
  it('verifies valid signature', async () => {
    const payload = '{"test":"data"}';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const secret = 'test-secret';
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
    const signature = Buffer.from(hmac).toString('base64');
    expect(await verifyWebhookSignature(payload, signature, timestamp, secret)).toBe(true);
  });
});