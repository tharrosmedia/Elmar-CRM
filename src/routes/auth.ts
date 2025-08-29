/// <reference path="../../worker-configuration.d.ts" />
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
// @ts-ignore
import * as argon2 from 'argon2-browser';
import { v4 as uuidv4 } from 'uuid';
import * as webAuthn from '@simplewebauthn/server';
import { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { RP_NAME, HASH_SALT_PREFIX, SESSION_TTL, CHALLENGE_TTL } from '../config';
import { Env } from '../../worker-configuration';

const authRouter = new Hono<{
  Bindings: Env;
  Variables: { user: { id: string; tenantSlug: string | null; role: string } };
}>();

// Signup
authRouter.post(
  '/signup',
  zValidator('json', z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['super_admin', 'admin', 'manager', 'user']),
    tenantSlug: z.string().optional(),
  })),
  async (c) => {
    const { email, password, role, tenantSlug } = c.req.valid('json');
    const { encoded: passwordHash } = await argon2.hash({ pass: password, salt: HASH_SALT_PREFIX + email, type: argon2.ArgonType.Argon2id, time: 3, mem: 65536, parallelism: 4 });
    await c.env.ADMIN_DB.prepare('INSERT INTO users (email, password_hash, role, tenant_slug) VALUES (?, ?, ?, ?)').bind(email, passwordHash, role, tenantSlug ?? null).run();
    await c.env.ADMIN_DB.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').bind('user_created', JSON.stringify({ email, role })).run();
    return c.json({ success: true }, 201);
  }
);

// Login
authRouter.post(
  '/login',
  zValidator('json', z.object({ email: z.string().email(), password: z.string() })),
  async (c) => {
    const { email, password } = c.req.valid('json');
    const { results } = await c.env.ADMIN_DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).all();
    if (!results?.length) return c.json({ error: 'Invalid credentials' }, 401);
    const user = results[0] as { id: string; mfa_secret: string; password_hash: string; tenant_slug: string | null; role: string; mfa_enabled: boolean };
    const { success } = await argon2.verify({ encoded: user.password_hash, pass: password });
    if (!success) return c.json({ error: 'Invalid credentials' }, 401);
    if (user.mfa_enabled) {
      const options = await webAuthn.generateAuthenticationOptions({
        rpID: new URL(c.req.url).hostname,
        allowCredentials: [{ id: user.mfa_secret }],
        userVerification: 'preferred',
      });
      await c.env.TENANT_CONFIGS.put(`mfa_challenge_${user.id}`, JSON.stringify(options.challenge), { expirationTtl: CHALLENGE_TTL });
      return c.json({ mfaRequired: true, options });
    }
    const sessionId = uuidv4();
    const sessionData = JSON.stringify({ userId: user.id, tenantSlug: user.tenant_slug, role: user.role });
    await c.env.TENANT_CONFIGS.put(`session_${sessionId}`, sessionData, { expirationTtl: SESSION_TTL });
    c.header('Set-Cookie', `session_id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL}`);
    await c.env.ADMIN_DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run();
    await c.env.ADMIN_DB.prepare('INSERT INTO audit_logs (user_id, action) VALUES (?, ?)').bind(user.id, 'login').run();
    return c.json({ success: true });
  }
);

// MFA Verify
authRouter.post(
  '/mfa-verify',
  zValidator('json', z.object({ userId: z.string(), response: z.any() })),
  async (c) => {
    const { userId, response } = c.req.valid('json');
    const { results } = await c.env.ADMIN_DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).all();
    if (!results?.length) return c.json({ error: 'Invalid' }, 401);
    const user = results[0] as { id: string; mfa_secret: string; tenant_slug: string | null; role: string };
    const expectedChallenge = await c.env.TENANT_CONFIGS.get(`mfa_challenge_${userId}`);
    if (!expectedChallenge) return c.json({ error: 'Challenge expired' }, 401);
    const { verified } = await webAuthn.verifyAuthenticationResponse({
      response: response as AuthenticationResponseJSON,
      expectedChallenge: JSON.parse(expectedChallenge),
      expectedOrigin: new URL(c.req.url).origin,
      expectedRPID: new URL(c.req.url).hostname,
      credential: { id: user.mfa_secret, publicKey: new Uint8Array(0), counter: 0 },
    });
    if (!verified) return c.json({ error: 'MFA failed' }, 401);
    const sessionId = uuidv4();
    const sessionData = JSON.stringify({ userId: user.id, tenantSlug: user.tenant_slug, role: user.role });
    await c.env.TENANT_CONFIGS.put(`session_${sessionId}`, sessionData, { expirationTtl: SESSION_TTL });
    c.header('Set-Cookie', `session_id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL}`);
    await c.env.TENANT_CONFIGS.delete(`mfa_challenge_${userId}`);
    return c.json({ success: true });
  }
);

// MFA Setup
authRouter.post('/mfa-setup', async (c) => {
  const user = c.var.user;
  const rpID = new URL(c.req.url).hostname;
  const userID = Buffer.from(user.id);
  const result = await c.env.ADMIN_DB.prepare('SELECT email FROM users WHERE id = ?').bind(user.id).first<{ email: string }>();
  if (!result) return c.json({ error: 'User not found' }, 404);
  const userName = result.email;
  const options = await webAuthn.generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID,
    userName,
    userDisplayName: userName,
    attestationType: 'none',
    excludeCredentials: [],
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
    supportedAlgorithmIDs: [-7, -257],
  });
  await c.env.TENANT_CONFIGS.put(`mfa_setup_challenge_${user.id}`, JSON.stringify(options.challenge), { expirationTtl: CHALLENGE_TTL });
  return c.json({ options });
});

// MFA Setup Verify
authRouter.post(
  '/mfa-setup-verify',
  zValidator('json', z.object({ response: z.any() })),
  async (c) => {
    const user = c.var.user;
    const { response } = c.req.valid('json');
    const expectedChallenge = await c.env.TENANT_CONFIGS.get(`mfa_setup_challenge_${user.id}`);
    if (!expectedChallenge) return c.json({ error: 'Challenge expired' }, 401);
    const { verified, registrationInfo } = await webAuthn.verifyRegistrationResponse({
      response: response as RegistrationResponseJSON,
      expectedChallenge: JSON.parse(expectedChallenge),
      expectedOrigin: new URL(c.req.url).origin,
      expectedRPID: new URL(c.req.url).hostname,
      supportedAlgorithmIDs: [-7, -257],
    });
    if (!verified || !registrationInfo) return c.json({ error: 'Setup failed' }, 401);
    const credentialIDBase64 = registrationInfo.credential.id;
    await c.env.ADMIN_DB.prepare('UPDATE users SET mfa_enabled = TRUE, mfa_secret = ? WHERE id = ?').bind(credentialIDBase64, user.id).run();
    await c.env.TENANT_CONFIGS.delete(`mfa_setup_challenge_${user.id}`);
    await c.env.ADMIN_DB.prepare('INSERT INTO audit_logs (user_id, action) VALUES (?, ?)').bind(user.id, 'mfa_enabled').run();
    return c.json({ success: true });
  }
);

// Logout
authRouter.post('/logout', async (c) => {
  const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
  if (sessionId) await c.env.TENANT_CONFIGS.delete(`session_${sessionId}`);
  c.header('Set-Cookie', 'session_id=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return c.json({ success: true });
});

export { authRouter };