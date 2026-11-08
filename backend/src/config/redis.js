import Redis from 'ioredis';
import { REDIS_URL } from './redisConfig.js';

// Fail-safe rules — the app keeps running in all three cases, never crashes:
//  1. No URL / empty / wrong format → cache OFF, app keeps running
//  2. URL exists but is expired/down → connection fails, cache bypassed, app keeps running
//  3. Valid URL → cache ON

let client = null;

const url = typeof REDIS_URL === 'string' ? REDIS_URL.trim() : '';
const isValidUrl = url.startsWith('redis://') || url.startsWith('rediss://');

if (isValidUrl) {
  try {
    client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1, // serverless: do not hang, fail fast
      connectTimeout: 3000,
      enableReadyCheck: false, // Upstash ke saath faster startup
      retryStrategy: (times) => (times <= 3 ? Math.min(times * 150, 1000) : null), // no infinite retries on a dead URL
    });

    let warned = false;
    client.on('error', (err) => {
      if (!warned) {
        warned = true;
        console.warn(`[redis] unavailable (cache bypassed, app keeps running): ${err.message}`);
      }
    });
    client.on('ready', () => {
      warned = false;
      console.log('[redis] connected — GET API caching on');
    });
  } catch (err) {
    client = null;
    console.warn(`[redis] invalid URL (cache bypassed, app keeps running): ${err.message}`);
  }
} else {
  console.warn('[redis] URL empty/invalid — GET API caching OFF, app keeps running');
}

export const isRedisAvailable = () => Boolean(client);

// Safe wrappers — on Redis failure return null/false, never throw (fail-open).
export const redisGet = async (key) => {
  if (!client) return null;
  try {
    return await client.get(key);
  } catch {
    return null;
  }
};

export const redisSetEx = async (key, ttlSeconds, value) => {
  if (!client) return false;
  try {
    await client.set(key, value, 'EX', ttlSeconds);
    return true;
  } catch {
    return false;
  }
};

export const redisIncr = async (key) => {
  if (!client) return 0;
  try {
    return await client.incr(key);
  } catch {
    return 0;
  }
};

export const getRedisClient = () => client;
