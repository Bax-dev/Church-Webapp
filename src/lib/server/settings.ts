/** Key/value app settings (PRD §7 Setting), including the site announcement. */
import { eq } from 'drizzle-orm'

import { parseAnnouncement, type Announcement } from '@/config/announcement'
import type { PortalSettings } from '@/config/portal'
import { db, schema } from '@/lib/server/db'

const DEFAULTS: PortalSettings = { approval: 'manual' }

async function read(key: string) {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, key) })
  return row?.value
}

async function write(key: string, value: unknown) {
  await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } })
}

export async function getPortalSettings(): Promise<PortalSettings> {
  const value = (await read('portal')) as Partial<PortalSettings> | undefined
  return { ...DEFAULTS, ...value }
}

export const savePortalSettings = (value: PortalSettings) => write('portal', value)

export async function getAnnouncement(): Promise<Announcement | undefined> {
  return parseAnnouncement(await read('announcement'))
}

export const saveAnnouncement = (value: Announcement) => write('announcement', value)
