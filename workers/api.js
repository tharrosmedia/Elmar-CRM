import { Hono } from 'hono';

const app = new Hono();

// Middleware: Basic secret check (use your WEBHOOK_SECRET as API key for MVP)
app.use('*', async (c, next) => {
  if (c.req.header('Authorization') !== `Bearer ${c.env.WEBHOOK_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// GET /leads - List leads (paginated simply)
app.get('/leads', async (c) => {
  const { results } = await c.env.ELMAR_CRM.prepare('SELECT * FROM leads ORDER BY updated_at DESC LIMIT 50').all();
  return c.json(results);
});

// POST /leads - Create lead
app.post('/leads', async (c) => {
  const body = await c.req.json(); // { first_name, last_name, email, phone, stage, status, assigned_to, ... }
  const stmt = c.env.ELMAR_CRM.prepare(
    'INSERT INTO leads (first_name, last_name, email, phone, address, url, utm_campaign, utm_source, utm_medium, utm_content, notes, stage, status, assigned_to, first_contact_at, last_contacted_at, contacts_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = await stmt.bind(
    body.first_name, body.last_name, body.email, body.phone, body.address || null, body.url || null,
    body.utm_campaign || null, body.utm_source || null, body.utm_medium || null, body.utm_content || null,
    body.notes || null, body.stage, body.status, body.assigned_to || null, body.first_contact_at || null,
    body.last_contacted_at || null, body.contacts_count || 0
  ).run();
  return c.json({ id: result.meta.last_row_id }, 201);
});

// GET /leads/:id - View lead with timeline
app.get('/leads/:id', async (c) => {
  const lead = await c.env.ELMAR_CRM.prepare('SELECT * FROM leads WHERE id = ?').bind(c.req.param('id')).first();
  if (!lead) return c.json({ error: 'Not found' }, 404);
  const events = await c.env.ELMAR_CRM.prepare('SELECT * FROM timeline_events WHERE lead_id = ? ORDER BY timestamp DESC').bind(lead.id).all();
  return c.json({ ...lead, timeline: events.results });
});

// POST /timeline_events - Log event for lead
app.post('/timeline_events', async (c) => {
  const body = await c.req.json(); // { lead_id, user_id, medium, direction, duration_sec, subject, body, metadata }
  const stmt = c.env.ELMAR_CRM.prepare(
    'INSERT INTO timeline_events (lead_id, user_id, medium, direction, duration_sec, subject, body, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  await stmt.bind(
    body.lead_id, body.user_id || null, body.medium, body.direction, body.duration_sec || null,
    body.subject || null, body.body || null, body.metadata ? JSON.stringify(body.metadata) : null
  ).run();
  // Update lead counters (optimistic for MVP)
  await c.env.ELMAR_CRM.prepare(
    'UPDATE leads SET contacts_count = contacts_count + 1, last_contacted_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(body.lead_id).run();
  return c.json({ success: true }, 201);
});

// Bonus: Simple users endpoint (for assignments)
app.get('/users', async (c) => {
  const { results } = await c.env.ELMAR_CRM.prepare('SELECT id, full_name, role FROM users').all();
  return c.json(results);
});

// Existing webhook route (if any) - e.g., app.post('/webhook', ...)

export default app;