/** The prayer programme (settings table) and its daily guides (prayer_guides table). See src/config/prayer.ts. */
import { cache } from 'react'
import { and, desc, eq, lte } from 'drizzle-orm'

import { guideSchema, lagosNow, readProgram, type PrayerGuide, type PrayerProgram, type StoredGuide } from '@/config/prayer'
import { db, schema } from '@/lib/server/db'

const KEY = 'prayer'
const { prayerGuides } = schema

export async function getProgram(): Promise<PrayerProgram> {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, KEY) })
  return readProgram(row?.value)
}

/** For pages: once per request, and never fails the page (an unreachable database means "switched off"). */
export const getProgramSafe = cache(async (): Promise<PrayerProgram> => {
  try {
    return await getProgram()
  } catch (error) {
    console.error('[prayer] could not load the prayer programme', error)
    return readProgram({ enabled: false })
  }
})

export async function saveProgram(program: PrayerProgram) {
  await db.insert(schema.settings).values({ key: KEY, value: program }).onConflictDoUpdate({ target: schema.settings.key, set: { value: program } })
}

type Row = typeof prayerGuides.$inferSelect

function toGuide(row: Row): StoredGuide {
  // The body is checked on save; anything missing from an older row falls back to empty.
  const parsed = guideSchema.partial().safeParse(row.body)
  const body = parsed.success ? parsed.data : {}
  return {
    text: '', focus: [], keyVerse: '', keyVerseRef: '', exposition: [], prayers: [], declarations: [], finalPrayer: [],
    ...body,
    id: row.id, date: row.date, theme: row.theme, published: row.published, updatedAt: row.updatedAt.toISOString(),
  }
}

const bodyOf = ({ date: _date, theme: _theme, published: _published, ...body }: PrayerGuide) => body

export async function listGuides() {
  const rows = await db.select().from(prayerGuides).orderBy(desc(prayerGuides.date))
  return rows.map((row) => ({ id: row.id, date: row.date, theme: row.theme, published: row.published, updatedAt: row.updatedAt.toISOString() }))
}

export async function getGuide(id: string) {
  const [row] = await db.select().from(prayerGuides).where(eq(prayerGuides.id, id))
  return row && toGuide(row)
}

export async function guideByDate(date: string) {
  const [row] = await db.select().from(prayerGuides).where(eq(prayerGuides.date, date))
  return row && toGuide(row)
}

export async function insertGuide(guide: PrayerGuide) {
  const [row] = await db.insert(prayerGuides).values({ date: guide.date, theme: guide.theme, published: guide.published, body: bodyOf(guide) }).returning()
  return toGuide(row)
}

export async function updateGuide(id: string, guide: PrayerGuide) {
  const [row] = await db.update(prayerGuides).set({ date: guide.date, theme: guide.theme, published: guide.published, body: bodyOf(guide) })
    .where(eq(prayerGuides.id, id)).returning()
  return row && toGuide(row)
}

export async function deleteGuide(id: string) {
  const [row] = await db.delete(prayerGuides).where(eq(prayerGuides.id, id)).returning()
  return row && toGuide(row)
}

/**
 * The guide the public sees for `date` (Lagos today by default): that day's if published,
 * otherwise the latest published one before it, flagged so the page can say which day it is from.
 */
export async function publicGuide(date = lagosNow().date) {
  const [row] = await db.select().from(prayerGuides)
    .where(and(eq(prayerGuides.published, true), lte(prayerGuides.date, date)))
    .orderBy(desc(prayerGuides.date)).limit(1)
  return row && { guide: toGuide(row), isToday: row.date === date }
}

/** Published guides up to today, newest first, for the archive list. */
export async function publishedGuides(limit = 30) {
  const rows = await db.select({ id: prayerGuides.id, date: prayerGuides.date, theme: prayerGuides.theme }).from(prayerGuides)
    .where(and(eq(prayerGuides.published, true), lte(prayerGuides.date, lagosNow().date)))
    .orderBy(desc(prayerGuides.date)).limit(limit)
  return rows
}
