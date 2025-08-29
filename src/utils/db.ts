import { Env } from '../../worker-configuration';
// Dynamic D1 client via API (for tenant DBs)
export async function getTenantDB(env: Env & { ACCOUNT_ID: string; CF_API_TOKEN: string }, dbId: string) {
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/d1/database/${dbId}`;
  return {
    async prepare(sql: string) {
      return {
        bind(...params: any[]) {
          return {
            async run() {
              const res = await fetch(`${baseUrl}/query`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql, params }),
              });
              const json: any = await res.json();
              if (!json.success) throw new Error(JSON.stringify(json.errors));
              return json.result[0];
            },
            async all() {
              const res = await fetch(`${baseUrl}/query`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql, params }),
              });
              const json: any = await res.json();
              if (!json.success) throw new Error(JSON.stringify(json.errors));
              return { results: json.result[0].results };
            },
          };
        },
      };
    },
  };
}
// Create new D1 DB
export async function createD1Database(env: Env & { ACCOUNT_ID: string; CF_API_TOKEN: string }, name: string) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/d1/database`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const json: any = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors));
  return json.result.uuid;
}
// Get tenant from subdomain
export async function getTenant(env: Env, req: Request) {
  const host = new URL(req.url).hostname;
  const slug = host.split('.')[0];
  const { results } = await env.ADMIN_DB.prepare('SELECT * FROM tenants WHERE slug = ?').bind(slug).all();
  if (!results?.length) throw new Error('Tenant not found');
  return results[0];
}