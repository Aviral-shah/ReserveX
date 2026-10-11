import Redis from "ioredis";
import { config } from "./config";

// In-memory fallback storage in case Redis is not running
const inMemorySets = new Map<string, Set<string>>();
const inMemoryKeys = new Map<string, { value: string; expiry: number }>();

const isKeyExpired = (key: string): boolean => {
  const item = inMemoryKeys.get(key);
  if (!item) return true;
  if (Date.now() > item.expiry) {
    inMemoryKeys.delete(key);
    return true;
  }
  return false;
};

let isConnected = false;

// Create Redis client options
let client: Redis | null = null;

try {
  if (config.redisUri) {
    client = new Redis(config.redisUri, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 3 ? null : 2000),
    });
  } else if (config.redisHost) {
    client = new Redis({
      host: config.redisHost,
      port: config.redisPort || 6379,
      password: config.redisPassword || undefined,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 3 ? null : 2000),
    });
  } else {
    client = new Redis({
      host: "127.0.0.1",
      port: config.redisPort || 6379,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
  }

  client.on("connect", () => {
    isConnected = true;
    console.log("✅ [Redis] Connected successfully.");
  });

  client.on("ready", () => {
    isConnected = true;
  });

  client.on("close", () => {
    isConnected = false;
  });

  client.on("error", (err: any) => {
    isConnected = false;
    if (err?.code !== "ECONNREFUSED" && !err?.message?.includes("Connection is closed")) {
      console.error("[Redis warning:]", err.message || err);
    }
  });
} catch (e: any) {
  isConnected = false;
  console.log("[Redis] Using in-memory fallback:", e.message);
}

// Resilient wrapper providing in-memory fallback for all required Redis methods
const redisProxy: any = new Proxy(client || {}, {
  get(target, prop: string) {
    // If real Redis is connected, use real Redis methods
    if (isConnected && client && typeof (client as any)[prop] === "function") {
      return async (...args: any[]) => {
        try {
          return await (client as any)[prop](...args);
        } catch {
          // If Redis call fails mid-operation, gracefully fallback
          return fallbackMethods[prop] ? fallbackMethods[prop](...args) : null;
        }
      };
    }

    // Fallback methods when Redis is disconnected or offline
    if (fallbackMethods[prop]) {
      return fallbackMethods[prop];
    }

    if (client && typeof (client as any)[prop] === "function") {
      return (...args: any[]) => (client as any)[prop](...args);
    }

    return () => Promise.resolve(null);
  },
});

const fallbackMethods: Record<string, (...args: any[]) => any> = {
  smembers: async (key: string) => {
    const set = inMemorySets.get(key);
    return set ? Array.from(set) : [];
  },

  exists: async (key: string) => {
    return isKeyExpired(key) ? 0 : 1;
  },

  srem: async (key: string, member: string) => {
    const set = inMemorySets.get(key);
    if (set) set.delete(member);
    return 1;
  },

  get: async (key: string) => {
    if (isKeyExpired(key)) return null;
    return inMemoryKeys.get(key)?.value || null;
  },

  setex: async (key: string, seconds: number, value: string) => {
    inMemoryKeys.set(key, {
      value: String(value),
      expiry: Date.now() + seconds * 1000,
    });
    return "OK";
  },

  sadd: async (key: string, member: string) => {
    let set = inMemorySets.get(key);
    if (!set) {
      set = new Set<string>();
      inMemorySets.set(key, set);
    }
    set.add(member);
    return 1;
  },

  del: async (key: string) => {
    inMemoryKeys.delete(key);
    inMemorySets.delete(key);
    return 1;
  },
};

export default redisProxy;
