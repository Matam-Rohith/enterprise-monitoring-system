import Redis from 'ioredis';
import { logger } from '../utils/logger';

export let redisClient: Redis;

export async function connectRedis(): Promise<void> {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  redisClient.on('connect', () => logger.info('✅ Redis connected'));
  redisClient.on('error', (err) => logger.error('❌ Redis error:', err));

  await redisClient.ping();
}

export async function cacheSet(key: string, value: unknown, ttl = 300): Promise<void> {
  await redisClient.setex(key, ttl, JSON.stringify(value));
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

export async function cacheDel(key: string): Promise<void> {
  await redisClient.del(key);
}
