// src/index.test.ts
import { describe, it, expect } from 'vitest';
import { Env } from '../worker-configuration';

const env: Env = {
  ADMIN_DB: {} as D1Database,
  TENANT_CONFIGS: {} as KVNamespace, // Changed from KV to TENANT_CONFIGS
  RATE_LIMIT: {} as DurableObjectNamespace,
  SENDGRID: {} as Fetcher,
  ZAPIER_WEBHOOK_SECRET: 'test-secret',
  HCP_WEBHOOK_SECRET: 'test-secret',
  DIALPAD_WEBHOOK_SECRET: 'test-secret',
  DIALPAD_SECRET_PROP: 'test-secret',
};

describe('Index', () => {
  it('should have tenant configs', () => {
    expect(env.TENANT_CONFIGS).toBeDefined(); // Changed from env.KV
  });
});