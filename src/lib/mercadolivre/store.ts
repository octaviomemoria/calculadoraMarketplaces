import { Redis } from "@upstash/redis";
import type { KeyValueStore } from "./types";

export function createMemoryStore(): KeyValueStore {
  const values = new Map<string, unknown>();
  return {
    async get<T>(key: string) {
      return (values.get(key) as T | undefined) ?? null;
    },
    async set<T>(key: string, value: T) {
      values.set(key, value);
    },
    async del(key: string) {
      values.delete(key);
    },
  };
}

export function createUpstashStore(): KeyValueStore {
  const redis = Redis.fromEnv();
  return {
    get: <T>(key: string) => redis.get<T>(key),
    async set<T>(key: string, value: T, ttlSeconds?: number) {
      if (ttlSeconds) {
        await redis.set(key, value, { ex: ttlSeconds });
      } else {
        await redis.set(key, value);
      }
    },
    del: async (key: string) => {
      await redis.del(key);
    },
  };
}
