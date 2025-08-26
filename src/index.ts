/// <reference path="../worker-configuration.d.ts" />
import { Hono } from 'hono';
import { authRouter } from './routes/auth'; // No extension (bundler resolution)
import { adminRouter } from './routes/admin';
import { webhooksRouter } from './routes/webhooks';
import { jobsRouter } from './routes/jobs';
import { authMiddleware } from './utils/auth';
import { v4 as uuidv4 } from 'uuid';

const app = new Hono<{ Bindings: Env; Variables: { user: { id: string; tenantSlug: string | null; role: string } } }>(); // Define Variables for user (fixes c.get overload/unknown)

// Mount routes with prefixes
app.route('/api/auth', authRouter); // e.g., /api/auth/login
app.use('/api/admin/*', authMiddleware);
app.route('/api/admin', adminRouter); // e.g., /api/admin/onboard-tenant
app.route('/api/webhooks', webhooksRouter); // e.g., /api/webhooks/hcp
app.use('/api/jobs/*', authMiddleware);
app.route('/api/jobs', jobsRouter); // e.g., /api/jobs

// Global error handling (logs with IDs; integrate Sentry)
app.onError((err, c) => {
  const errorId = uuidv4(); // For correlation
  console.error(`Error ID: ${errorId}`, err);
  // Audit log error if user context
  if (c.get('user')?.id) { // Optional chaining (fixes "Property 'id' does not exist")
    c.env.ADMIN_DB.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)').bind(c.get('user').id, 'error', JSON.stringify({ path: c.req.path, message: err.message })).run();
  }
  return c.json({ error: err.message, errorId }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env) { // Fix: Use Env directly (bindings type)
    // Cron: Process webhook queue (idempotent, retries with backoff)
    const { results } = await env.ADMIN_DB.prepare(`
      SELECT * FROM webhook_events WHERE status = 'pending' ORDER BY received_at ASC LIMIT 10
    `).all<{ id: string; attempts?: number }>(); // Fix: Apply type to results, not array
    for (const evt of results || []) {
      try {
        // TODO: Expand processing - get tenant DB/keys, parse payload, upsert idempotently (e.g., INSERT OR REPLACE INTO jobs)
        // Use exponential backoff per-event (e.g., delay = 2 ** attempts * 1000ms + jitter)
        await env.ADMIN_DB.prepare('UPDATE webhook_events SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?')
          .bind('success', evt.id).run();
      } catch (e) {
        const attempts = (Number(evt.attempts) || 0) + 1;
        const status = attempts >= 10 ? 'failed' : 'pending';
        await env.ADMIN_DB.prepare('UPDATE webhook_events SET attempts = ?, status = ?, error = ? WHERE id = ?')
          .bind(attempts, status, (e as Error).message, evt.id).run();
        // Alert on failed (e.g., email via SendGrid if attempts >5)
      }
    }
  },
};