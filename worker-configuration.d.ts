// worker-configuration.d.ts
/// <reference types="@cloudflare/workers-types" />
/// <reference path="durable-object-augmentation.d.ts" />

export interface Env {
  [key: `TENANT_DB_${string}`]: D1Database; // Dynamic per-tenant D1 databases
  ADMIN_DB: D1Database; // Admin D1 for webhook_events, audit_logs, dead_letter_queue
  TENANT_CONFIGS: KVNamespace; // Tenant-specific configs
  RATE_LIMIT: DurableObjectNamespace; // Per-tenant rate limiting
  SENDGRID: Fetcher; // Service binding for email alerts
  ZAPIER_WEBHOOK_SECRET: string; // Token for Zapier leads webhook
  HCP_WEBHOOK_SECRET: string; // HCP webhook signature secret
  DIALPAD_WEBHOOK_SECRET: string; // Dialpad webhook secret
  DIALPAD_SECRET_PROP: string; // Dialpad prop secret
  ACCOUNT_ID?: string; // For admin/jobs routes
  CF_API_TOKEN?: string; // For API calls
  DB?: D1Database; // Optional fallback D1 database
}