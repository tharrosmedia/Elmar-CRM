// src/index.test.ts
import { describe, it, expect } from 'vitest';
describe('Worker Bindings', () => {
  it('has required Env bindings', () => {
    const env: Env = {
      ADMIN_DB: {} as D1Database,
      KV: {} as KVNamespace,
      RATE_LIMIT: {} as DurableObjectNamespace,
      SENDGRID: {} as Fetcher,
      HCP_WEBHOOK_SECRET: 'test',
      DIALPAD_WEBHOOK_SECRET: 'test',
      WEBHOOK_SECRET: 'test',
      TENANT_DB_tenant_a: {} as D1Database,
    };
    expect(env.ADMIN_DB).toBeDefined();
    expect(env.KV).toBeDefined();
    expect(env.RATE_LIMIT).toBeDefined();
    expect(env.SENDGRID).toBeDefined();
  });
});