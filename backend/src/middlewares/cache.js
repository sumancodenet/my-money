import { isRedisAvailable, redisGet, redisSetEx, redisIncr } from '../config/redis.js';

// GET API caching (per-user, versioned invalidation — no KEYS scan, Upstash-safe)
// Key: cache:v{version}:{userId}:{originalUrl-with-query}
// Mutation (POST/PATCH/DELETE success) → INCR cachever:{userId} → old keys expire by TTL.

const verKey = (userId) => `cachever:${userId}`;

const getVersion = async (userId) => {
  // Missing version key → treat as 0 (read-only; INCR will create it on mutation)
  // redisGet error → null → cache bypass
  const raw = await redisGet(verKey(userId));
  if (raw === null) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 0 : n;
};

/** Apply on GET routes — MUST run AFTER protect (req.user.id needed). */
export const cacheable = (ttlSeconds = 45) => async (req, res, next) => {
  if (!isRedisAvailable() || req.method !== 'GET') return next();
  const userId = req.user?.id;
  if (!userId) return next(); // fail-open: no user → skip caching

  const version = await getVersion(userId);
  if (version === null) return next(); // Redis down → bypass

  const cacheKey = `cache:v${version}:${userId}:${req.originalUrl}`;

  const hit = await redisGet(cacheKey);
  if (hit) {
    try {
      const { status, body } = JSON.parse(hit);
      res.setHeader('X-Cache', 'HIT');
      return res.status(status).json(body);
    } catch {
      // corrupted entry → treat as miss
    }
  }

  res.setHeader('X-Cache', 'MISS');

  // Response capture — cache only 2xx (never cache errors)
  const origJson = res.json.bind(res);
  res.json = (body) => {
    try {
      const status = res.statusCode || 200;
      if (status >= 200 && status < 300) {
        redisSetEx(cacheKey, ttlSeconds, JSON.stringify({ status, body }));
      }
    } catch {
      /* ignore */
    }
    return origJson(body);
  };
  next();
};

/** For mutations — add router.use() AFTER protect. */
export const invalidateUserCache = (req, res, next) => {
  if (req.method === 'GET' || !isRedisAvailable()) return next();
  const userId = req.user?.id;
  if (!userId) return next();

  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      await redisIncr(verKey(userId)); // O(1) invalidation, all cached GETs become fresh
    }
  });
  next();
};
