/// <reference path="../../worker-configuration.d.ts" />
import { Hono } from 'hono';
import { z } from 'zod';
import { createHmac } from 'crypto';

const webhooksRouter = new Hono<{ Bindings: Env }>();

// HCP Webhook
webhooksRouter.post('/hcp', async (c) => {
  const body = await c.req.text();
  const signature = c.req.header('X-HCP-Signature');
  if (!signature) return c.text('Missing signature', 401);

  const hmac = createHmac('sha256', c.env.WEBHOOK_SECRET);
  hmac.update(body);
  if (signature !== hmac.digest('hex')) return c.text('Invalid signature', 401);

  const schema = z.object({ event_type: z.string(), data: z.object({ id: z.string() }) });
  const payload = schema.parse(JSON.parse(body));
  const externalEventId = payload.data.id;

  const tenantSlug = 'elmar';  // TODO: Extract from payload/lookup via hcp_org_id

  await c.env.ADMIN_DB.prepare('INSERT OR IGNORE INTO webhook_events (tenant_slug, event_type, external_event_id, payload) VALUES (?, ?, ?, ?)').bind(tenantSlug, payload.event_type, externalEventId, body).run();

  return c.text('Received', 200);
});

// Add Dialpad webhook similarly: /dialpad, verify per docs

export { webhooksRouter };