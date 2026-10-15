import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from '@/lib/server/env'
import * as schema from './schema'

type Db = PostgresJsDatabase<typeof schema>

// One pool per process; dev hot reloads would otherwise open a new pool on every edit.
// In production each Lambda instance handles one request at a time, so one connection each is enough and keeps
// many concurrent instances from using up the database's connection limit. Idle connections close after 20s.
const globalForDb = globalThis as unknown as { pcnDb?: Db }

function open(): Db {
  if (globalForDb.pcnDb) return globalForDb.pcnDb
  const client = postgres(env.databaseUrl, env.isProd ? { max: 1, idle_timeout: 20 } : { max: 10 })
  const instance = drizzle(client, { schema })
  // Production keeps it too: a warm Lambda reuses the connection across requests.
  globalForDb.pcnDb = instance
  return instance
}

/**
 * Opened on first use, not on import: building the app imports every route, and that must not need DATABASE_URL.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = open()
    const value = Reflect.get(instance, prop, instance)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
export { schema }
