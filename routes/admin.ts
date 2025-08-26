/// <reference path="../worker-configuration.d.ts" /> // Ambient for Env
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator'; // If validator error, use zValidator
import { z } from 'zod';
import { createD1Database, getTenantDB } from '../src/utils/db'; // Adjust if needed
import { KV_EXPIRATION_DAYS } from '../src/config/index';

const adminRouter = new Hono<{ Bindings: Env & { ACCOUNT_ID: string; CF_API_TOKEN: string } }>();

// Onboard tenant
adminRouter.post(
  '/onboard-tenant',
  zValidator('json', z.object({
    slug: z.string().min(1),
    hcpKey: z.string().min(1),
    dialpadKey: z.string().min(1),
    hcpOrgId: z.string().optional(),
    dialpadOrgId: z.string().optional(),
    existingDbId: z.string().optional(),
  })),
  async (c) => {
    const { slug, hcpKey, dialpadKey, hcpOrgId, dialpadOrgId, existingDbId } = c.req.valid('json');
    let dbId: string;
    if (existingDbId) {
      dbId = existingDbId;
    } else {
      const dbName = `tenant_${slug}_crm`;
      dbId = await createD1Database(c.env, dbName);
      const tenantDB = await getTenantDB(c.env, dbId);
      // Fix: Await async prepare, then chain bind/run
      const prepared = await tenantDB.prepare('CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');
      await prepared.bind().run();
      // Expand for jobs/estimates: Use batch for multi (modify getTenantDB to support /batch endpoint)
      // e.g., await fetch(... /batch, body: JSON.stringify([{ sql: 'CREATE TABLE jobs ...' }, { sql: 'CREATE INDEX ...' }]));
    }
    await c.env.ADMIN_DB.prepare('INSERT INTO tenants (slug, db_id, hcp_org_id, dialpad_org_id) VALUES (?, ?, ?, ?)').bind(slug, dbId, hcpOrgId ?? null, dialpadOrgId ?? null).run();
    await c.env.TENANT_CONFIGS.put(`tenant_${slug}_hcp_key`, hcpKey, { expirationTtl: KV_EXPIRATION_DAYS });
    await c.env.TENANT_CONFIGS.put(`tenant_${slug}_dialpad_key`, dialpadKey, { expirationTtl: KV_EXPIRATION_DAYS });
    await c.env.ADMIN_DB.prepare('INSERT INTO audit_logs (tenant_slug, action, details) VALUES (?, ?, ?)').bind(slug, 'tenant_created', JSON.stringify({ dbId })).run();
    return c.json({ success: true, dbId }, 201);
  }
);

export { adminRouter };