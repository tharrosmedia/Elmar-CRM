import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { webhooksRouter } from './routes/webhooks';
import { jobsRouter } from './routes/jobs';
import { authMiddleware } from './utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { verifyWebhookSignature } from './utils/webhook';
import { RateLimiter } from './rate-limiter';
import { Env } from '../worker-configuration';

const app = new Hono<{
  Bindings: Env;
  Variables: { user: { id: string; tenantSlug: string | null; role: string } };
}>();

// Global middleware
app.use(
  '/api/*',
  cors({
    origin: ['https://crm.elmarhvac.com', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Signature', 'X-CRM-Webhook-Token'],
    credentials: true,
  })
);
app.use('/api/*', secureHeaders());
app.use('/api/*', async (c, next) => {
  const tenantSlug = c.get('user')?.tenantSlug || 'unknown';
  const rateLimitKey = `rate:${tenantSlug}:${c.req.path}`;
  const rateLimiter = c.env.RATE_LIMIT.get(c.env.RATE_LIMIT.idFromName(rateLimitKey));
  const { success } = await (rateLimiter as any).limit({ key: rateLimitKey, window: 60, max: 100 }); // Cast to any or define interface
  if (!success) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  await next();
});
// Mount routes
app.route('/api/auth', authRouter);
app.use('/api/admin/*', authMiddleware);
app.route('/api/admin', adminRouter);
app.use('/api/webhooks/*', async (c, next) => {
  // Bypass signature verification for /leads (uses X-CRM-Webhook-Token)
  if (c.req.path.endsWith('/leads')) {
    await next();
    return;
  }
  // Apply signature verification for HCP and Dialpad webhooks
  const signature = c.req.header('X-Webhook-Signature') || '';
  const timestamp = c.req.header('X-Webhook-Timestamp') || '';
  const payload = await c.req.text();
  const secret = c.req.path.includes('/hcp') ? c.env.HCP_WEBHOOK_SECRET : c.env.DIALPAD_WEBHOOK_SECRET;
  const isValid = await verifyWebhookSignature(payload, signature, timestamp, secret);
  if (!isValid) {
    return c.json({ error: 'Invalid webhook signature' }, 401);
  }
  await next();
});
app.route('/api/webhooks', webhooksRouter);
app.use('/api/jobs/*', authMiddleware);
app.route('/api/jobs', jobsRouter);
// Global error handling
app.onError(async (err, c) => {
  const errorId = uuidv4();
  console.error(`Error ID: ${errorId}`, err);
  const user = c.get('user');
  if (user?.id) {
    const details = JSON.stringify({ path: c.req.path, message: err.message });
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedDetails = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(details)
    );
    await c.env.ADMIN_DB.prepare('INSERT INTO audit_logs (user_id, action, details, iv) VALUES (?, ?, ?, ?)')
      .bind(user.id, 'error', Buffer.from(encryptedDetails).toString('base64'), Buffer.from(iv).toString('base64'))
      .run();
  }
  return c.json({ error: 'Internal server error', errorId }, 500);
});
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env) {
    const { results } = await env.ADMIN_DB.prepare(`
      SELECT * FROM webhook_events WHERE status = 'pending' ORDER BY received_at ASC LIMIT 10
    `).all<{ id: string; tenantSlug: string; payload: string; attempts?: number; eventType: string }>();
    for (const evt of results || []) {
      try {
        const tenantConfig = await env.TENANT_CONFIGS.get(`tenant:${evt.tenantSlug}`, 'json');
        if (!tenantConfig) throw new Error(`Tenant ${evt.tenantSlug} not found`);
        const payload = JSON.parse(evt.payload);
        const externalId = payload.externalId || evt.id;
        const tenantDb = env[`TENANT_DB_${evt.tenantSlug}`] || env.DB;
        if (!tenantDb) throw new Error(`No DB for tenant ${evt.tenantSlug}`);
        if (evt.eventType.startsWith('job.')) {
          await tenantDb
            .prepare(
              'INSERT OR REPLACE INTO jobs (external_id, tenant_slug, data, version) VALUES (?, ?, ?, ?)'
            )
            .bind(externalId, evt.tenantSlug, JSON.stringify(payload), 1)
            .run();
        } else if (evt.eventType === 'zapier_lead_create') {
          const { first_name, last_name, email, phone, address, url, utm_campaign, utm_source, utm_medium, utm_content } = payload;
          await tenantDb
            .prepare(
              `INSERT OR IGNORE INTO leads (
                external_id, tenant_slug, first_name, last_name, email, phone, address, url,
                utm_campaign, utm_source, utm_medium, utm_content
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              externalId,
              evt.tenantSlug,
              first_name,
              last_name,
              email || null,
              phone || null,
              address || null,
              url || null,
              utm_campaign || null,
              utm_source || null,
              utm_medium || null,
              utm_content || null
            )
            .run();
        }
        await env.ADMIN_DB.prepare(
          'UPDATE webhook_events SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?'
        )
          .bind('success', evt.id)
          .run();
      } catch (e) {
        const attempts = (Number(evt.attempts) || 0) + 1;
        const status = attempts >= 10 ? 'failed' : 'pending';
        const errorMessage = (e as Error).message;
        if (status === 'failed') {
          await env.ADMIN_DB.prepare(
            'INSERT INTO dead_letter_queue (event_id, tenant_slug, payload, error) VALUES (?, ?, ?, ?)'
          )
            .bind(evt.id, evt.tenantSlug, evt.payload, errorMessage)
            .run();
        }
        await env.ADMIN_DB.prepare(
          'UPDATE webhook_events SET attempts = ?, status = ?, error = ? WHERE id = ?'
        )
          .bind(attempts, status, errorMessage, evt.id)
          .run();
        if (attempts > 5) {
          await env.SENDGRID.fetch(new Request('https://api.sendgrid.com/v3/mail/send',{
            method: 'POST',
            headers: new Headers({ 'Content-Type': 'application/json'}), // Use Headers constructor
            body: JSON.stringify({
              to: 'info@elmarair.com',
              from: 'info@elmarair.com',
              subject: `Webhook Failure: ${evt.id}`,
              text: `Failed to process webhook ${evt.id} after ${attempts} attempts: ${errorMessage}`,
            }) as BodyInit, // Cast string as BodyInit
          }));
        }
      }
    }
  },
};
// Export Durable Objects
export { RateLimiter };