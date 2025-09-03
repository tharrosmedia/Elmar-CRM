/// <reference path="../worker-configuration.d.ts" />
import { Env } from '../worker-configuration'; // Retained for IDE support
import { Context, Next } from 'hono'; // No StatusCode import needed

export async function handleSendgrid(c: Context<{ Bindings: Env }>, next?: Next) {
  try {
    const { to, from, subject, text } = await c.req.json() as { to: string; from: string; subject: string; text: string };
    const sendgridRequest = new Request(c.env.SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, from, subject, text }),
    });
    const response = await fetch(sendgridRequest);
    if (!response.ok) throw new Error(`SendGrid API error: ${response.statusText}`);
    const data = await response.text(); // Extract response body as text
    const status = response.status as 200 | 201 | 202 | 400 | 401 | 403 | 404 | 429 | 500; // Explicit StatusCode union
    const headers: Record<string, string | string[]> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value; // Convert Headers to HeaderRecord
    });
    return c.newResponse(data, status, headers); // Use casted status
  } catch (e) {
    console.error('SendGrid error:', e);
    return c.newResponse('Internal server error', { status: 500 });
  }
}