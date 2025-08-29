import { Hono } from 'hono';
import { z } from 'zod';
import { createHmac } from 'crypto';
import { Env } from '../../worker-configuration';

const webhooksRouter = new Hono<{ Bindings: Env }>();

// Zapier Lead Webhook
webhooksRouter.post('/leads', async (c) => {
  const token = c.req.header('X-CRM-Webhook-Token');
  if (token !== c.env.ZAPIER_WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  let payload;
  try {
    payload = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
  // Validate payload with Zod
  const schema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    url: z.string().url().optional(),
    utm_campaign: z.string().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_content: z.string().optional(),
  });
  try {
    schema.parse(payload);
  } catch (e) {
    return c.json({ error: 'Invalid payload', details: (e as z.ZodError).issues }, 400);
  }
  // Generate idempotency key (hash of payload)
  const payloadString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(payloadString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const externalEventId = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Store in webhook_events
  const tenantSlug = 'elmar'; // TODO: Extract dynamically if needed
  try {
    await c.env.ADMIN_DB.prepare(
      `INSERT OR IGNORE INTO webhook_events (tenant_slug, event_type, external_event_id, payload, status, received_at)
       VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`
    )
      .bind(tenantSlug, 'zapier_lead_create', externalEventId, payloadString)
      .run();
    return c.json({ message: 'Webhook received' }, 202);
  } catch (e) {
    console.error('Error storing webhook:', e);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// HCP Webhook
webhooksRouter.post('/hcp', async (c) => {
  const body = await c.req.text();
  const signature = c.req.header('X-HCP-Signature');
  if (!signature) return c.text('Missing signature', 401);
  const hmac = createHmac('sha256', c.env.HCP_WEBHOOK_SECRET);
  hmac.update(body);
  if (signature !== hmac.digest('hex')) return c.text('Invalid signature', 401);
  const schema = z.object({ event_type: z.string(), data: z.object({ id: z.string() }) });
  const payload = schema.parse(JSON.parse(body));
  const externalEventId = payload.data.id;
  const tenantSlug = 'elmar'; // TODO: Extract from payload/lookup via hcp_org_id
  await c.env.ADMIN_DB.prepare('INSERT OR IGNORE INTO webhook_events (tenant_slug, event_type, external_event_id, payload) VALUES (?, ?, ?, ?)').bind(tenantSlug, payload.event_type, externalEventId, body).run();
  return c.text('Received', 200);
});

// Add Dialpad webhook similarly: /dialpad, verify per docs
export { webhooksRouter };