import Redis from 'ioredis'

import { env } from '@/lib/server/env'

const globalForRedis = globalThis as unknown as { pcnRedis?: Redis }

export const redis = globalForRedis.pcnRedis ?? new Redis(env.redisUrl, { maxRetriesPerRequest: 2 })
if (!env.isProd) globalForRedis.pcnRedis = redis
