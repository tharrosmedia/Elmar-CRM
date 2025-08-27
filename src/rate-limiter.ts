// src/rate-limiter.ts
export class RateLimiter {
  state: DurableObjectState;
  constructor(state: DurableObjectState) {
    this.state = state;
  }
  async fetch(request: Request) {
    const { key, window, max } = await request.json();
    const count = (await this.state.storage.get<number>(key)) || 0;
    if (count >= max) return new Response(JSON.stringify({ success: false }), { status: 429 });
    await this.state.storage.put(key, count + 1, { expirationTtl: window });
    return new Response(JSON.stringify({ success: true }));
  }
}