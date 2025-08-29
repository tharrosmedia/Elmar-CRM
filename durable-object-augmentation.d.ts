// durable-object-augmentation.d.ts
/// <reference types="@cloudflare/workers-types" />

interface DurableObjectStorage {
  deleteAlarm(key: string): Promise<void>;
  setAlarm(time: number | { time: number }): Promise<void>;
}

// Augment DurableObject to include the updated storage interface
declare module '@cloudflare/workers-types' {
  interface DurableObject {
    ctx: {
      storage: DurableObjectStorage;
    };
  }
}