/// <reference path="../../worker-configuration.d.ts" />
import { createMiddleware } from 'hono/factory';

export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: { user: { id: string; tenantSlug: string | null; role: string } } }>(async (c, next) => {
  const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
  if (!sessionId) return c.json({ error: 'Unauthorized' }, 401);
  const session = await c.env.TENANT_CONFIGS.get(`session_${sessionId}`);
  if (!session) return c.json({ error: 'Session expired' }, 401);
  const { userId, tenantSlug, role } = JSON.parse(session);
  c.set('user', { id: userId, tenantSlug, role });
  // RBAC: Example path-based; expand for granular perms
  if (c.req.path.startsWith('/api/admin') && role !== 'super_admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
});