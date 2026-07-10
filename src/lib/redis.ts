// ============================================
// MovieVerse — Redis Client
// Caching layer for hot data
// ============================================

import { createClient, type RedisClientType } from 'redis';

const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | undefined;
};

function createRedisClient(): RedisClientType {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('✅ Redis connected');
  });

  return client as RedisClientType;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// ============================================
// CACHE HELPERS
// ============================================

const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Get cached data or fetch and cache it
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  try {
    if (!redis.isOpen) await redis.connect();

    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const data = await fetcher();
    await redis.setEx(key, ttl, JSON.stringify(data));
    return data;
  } catch (error) {
    // If Redis fails, just fetch directly
    console.warn('Redis cache miss/error:', error);
    return fetcher();
  }
}

/**
 * Invalidate cache by key pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (!redis.isOpen) await redis.connect();

    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.warn('Redis invalidation error:', error);
  }
}

/** Cache key generators */
export const CACHE_KEYS = {
  trending: (timeWindow: string, page: number) =>
    `trending:${timeWindow}:${page}`,
  popular: (mediaType: string, page: number) =>
    `popular:${mediaType}:${page}`,
  topRated: (mediaType: string, page: number) =>
    `topRated:${mediaType}:${page}`,
  movieDetail: (id: string) => `movie:${id}`,
  personDetail: (id: string) => `person:${id}`,
  search: (query: string, page: number) =>
    `search:${query}:${page}`,
  genres: (mediaType: string) => `genres:${mediaType}`,
  recommendations: (userId: string) => `recs:${userId}`,
  reviewSummary: (movieId: string) => `reviewSummary:${movieId}`,
} as const;

export default redis;
