/** Applies the SQL migrations in drizzle/ (generated from src/lib/server/db/schema.ts with `yarn db:generate`). */
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) throw new Error('Set DATABASE_URL (see .env.example).')

const client = postgres(url, { max: 1 })
await migrate(drizzle(client), { migrationsFolder: 'drizzle' })
await client.end()
console.log('Database is up to date.')
