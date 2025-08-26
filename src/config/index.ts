export const RP_NAME = 'Elmar CRM';  // WebAuthn Relying Party name
export const HASH_SALT_PREFIX = 'elmar-crm-salt-';  // Prefix for Argon2 salt (rotate via Secrets)
export const SESSION_TTL = 1800;  // 30min in seconds
export const CHALLENGE_TTL = 60;  // 1min for MFA challenges
export const KV_EXPIRATION_DAYS = 90 * 86400;  // For API keys (7776000s)