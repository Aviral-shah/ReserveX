"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("./config");
// In-memory fallback storage in case Redis is not running
const inMemorySets = new Map();
const inMemoryKeys = new Map();
const isKeyExpired = (key) => {
    const item = inMemoryKeys.get(key);
    if (!item)
        return true;
    if (Date.now() > item.expiry) {
        inMemoryKeys.delete(key);
        return true;
    }
    return false;
};
let isConnected = false;
// Create Redis client options
let client = null;
try {
    if (config_1.config.redisUri) {
        client = new ioredis_1.default(config_1.config.redisUri, {
            maxRetriesPerRequest: null,
            enableOfflineQueue: false,
            retryStrategy: (times) => (times > 3 ? null : 2000),
        });
    }
    else if (config_1.config.redisHost) {
        client = new ioredis_1.default({
            host: config_1.config.redisHost,
            port: config_1.config.redisPort || 6379,
            password: config_1.config.redisPassword || undefined,
            maxRetriesPerRequest: null,
            enableOfflineQueue: false,
            retryStrategy: (times) => (times > 3 ? null : 2000),
        });
    }
    else {
        client = new ioredis_1.default({
            host: "127.0.0.1",
            port: config_1.config.redisPort || 6379,
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
    client.on("error", (err) => {
        isConnected = false;
        if (err?.code !== "ECONNREFUSED" && !err?.message?.includes("Connection is closed")) {
            console.error("[Redis warning:]", err.message || err);
        }
    });
}
catch (e) {
    isConnected = false;
    console.log("[Redis] Using in-memory fallback:", e.message);
}
// Resilient wrapper providing in-memory fallback for all required Redis methods
const redisProxy = new Proxy(client || {}, {
    get(target, prop) {
        // If real Redis is connected, use real Redis methods
        if (isConnected && client && typeof client[prop] === "function") {
            return async (...args) => {
                try {
                    return await client[prop](...args);
                }
                catch {
                    // If Redis call fails mid-operation, gracefully fallback
                    return fallbackMethods[prop] ? fallbackMethods[prop](...args) : null;
                }
            };
        }
        // Fallback methods when Redis is disconnected or offline
        if (fallbackMethods[prop]) {
            return fallbackMethods[prop];
        }
        if (client && typeof client[prop] === "function") {
            return (...args) => client[prop](...args);
        }
        return () => Promise.resolve(null);
    },
});
const fallbackMethods = {
    smembers: async (key) => {
        const set = inMemorySets.get(key);
        return set ? Array.from(set) : [];
    },
    exists: async (key) => {
        return isKeyExpired(key) ? 0 : 1;
    },
    srem: async (key, member) => {
        const set = inMemorySets.get(key);
        if (set)
            set.delete(member);
        return 1;
    },
    get: async (key) => {
        if (isKeyExpired(key))
            return null;
        return inMemoryKeys.get(key)?.value || null;
    },
    setex: async (key, seconds, value) => {
        inMemoryKeys.set(key, {
            value: String(value),
            expiry: Date.now() + seconds * 1000,
        });
        return "OK";
    },
    sadd: async (key, member) => {
        let set = inMemorySets.get(key);
        if (!set) {
            set = new Set();
            inMemorySets.set(key, set);
        }
        set.add(member);
        return 1;
    },
    del: async (key) => {
        inMemoryKeys.delete(key);
        inMemorySets.delete(key);
        return 1;
    },
};
exports.default = redisProxy;
