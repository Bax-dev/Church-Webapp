import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from '@/lib/server/env'
import * as schema from './schema'

// One pool per process; dev hot reloads would otherwise open a new pool on every edit.
const globalForDb = globalThis as unknown as { pcnSql?: postgres.Sql }
const client = globalForDb.pcnSql ?? postgres(env.databaseUrl, { max: 10 })
if (!env.isProd) globalForDb.pcnSql = client

export const db = drizzle(client, { schema })
export { schema }
