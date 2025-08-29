// src/sendgrid.ts
import { z } from 'zod';
import { Env } from '../worker-configuration';

const sendgridSchema = z.object({
  to: z.string(),
  from: z.string(),
  subject: z.string(),
  text: z.string(),
});

export async function fetch(request: Request, env: Env) {
  const data = sendgridSchema.parse(await request.json());
  const { to, from, subject, text } = data;
  const response = await env.SENDGRID.fetch(request);
  return response;
}