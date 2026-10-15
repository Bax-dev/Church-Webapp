import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from '@/lib/server/env'
import * as schema from './schema'

// One pool per process; dev hot reloads would otherwise open a new pool on every edit.
// In production each Lambda instance handles one request at a time, so one connection each is enough and keeps
// many concurrent instances from using up the database's connection limit. Idle connections close after 20s.
const globalForDb = globalThis as unknown as { pcnSql?: postgres.Sql }
const client = globalForDb.pcnSql ?? postgres(env.databaseUrl, env.isProd ? { max: 1, idle_timeout: 20 } : { max: 10 })
if (!env.isProd) globalForDb.pcnSql = client

export const db = drizzle(client, { schema })
export { schema }
