// worker-configuration.d.ts
/// <reference types="@cloudflare/workers-types" />

export interface Env {
  [key: `TENANT_DB_${string}`]: D1Database; // Dynamic tenant-specific D1 databases
  ADMIN_DB: D1Database;
  TENANT_CONFIGS: KVNamespace;
  RATE_LIMIT: DurableObjectNamespace;
  SENDGRID: Fetcher;
  ZAPIER_WEBHOOK_SECRET: string;
  HCP_WEBHOOK_SECRET: string;
  DIALPAD_WEBHOOK_SECRET: string;
  DIALPAD_SECRET_PROP: string;
  ACCOUNT_ID?: string; // Optional for admin/jobs routes
  CF_API_TOKEN?: string; // Optional for admin/jobs routes
}