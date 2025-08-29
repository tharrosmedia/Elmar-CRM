import { Hono } from 'hono';
import { getTenant, getTenantDB } from '../utils/db';
import { Env } from '../../worker-configuration';

const jobsRouter = new Hono<{ Bindings: Env & { ACCOUNT_ID: string; CF_API_TOKEN: string } }>();

// Get jobs (expand for POST/PUT, estimates, etc.)
jobsRouter.get('/', async (c) => {
  const tenant = await getTenant(c.env, c.req as unknown as Request); // Cast to standard Request for type compatibility
  const tenantDB = await getTenantDB(c.env, tenant.db_id as string); // Type assertion for db_id (from D1 result)
  const stmt = await tenantDB.prepare('SELECT * FROM jobs LIMIT 10'); // Assume jobs table; await prepare as per type
  const boundStmt = stmt.bind(); // Empty bind since no params
  const { results } = await boundStmt.all(); // No bind needed (no params)
  return c.json(results);
});

export { jobsRouter };