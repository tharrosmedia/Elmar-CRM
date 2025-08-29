// src/rate-limiter.ts
/// <reference path="../worker-configuration.d.ts" />
/// <reference path="../durable-object-augmentation.d.ts" />
import { DurableObject } from 'cloudflare:workers';
import { z } from 'zod';

const rateLimitSchema = z.object({
  key: z.string(),
  window: z.number().int().positive(),
  max: z.number().int().positive(),
});

export class RateLimiter extends DurableObject {
  async fetch(request: Request) {
    try {
      const data = rateLimitSchema.parse(await request.json());
      const { key, window, max } = data;
      const count = (await this.ctx.storage.get<number>(key)) || 0;
      if (count >= max) {
        return new Response('Rate limit exceeded', { status: 429 });
      }
      await this.ctx.storage.put(key, count + 1);
      // Schedule alarm to delete the key after window seconds
      const alarmTime = Date.now() + window * 1000;
      await this.ctx.storage.deleteAlarm(key);
      await this.ctx.storage.setAlarm({ time: alarmTime });
      return new Response('OK');
    } catch (e) {
      if (e instanceof z.ZodError) {
        return new Response(JSON.stringify({ error: 'Invalid input', details: e.issues }), { status: 400 });
      }
      return new Response('Internal server error', { status: 500 });
    }
  }

  // Alarm handler to clean up expired keys
  async alarm() {
    const keys = await this.ctx.storage.list();
    for (const [key] of keys) {
      const count = await this.ctx.storage.get<number>(key);
      if (count && count > 0) {
        await this.ctx.storage.delete(key);
      }
    }
  }
}