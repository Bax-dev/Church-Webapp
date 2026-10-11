/** Pastors for the About page: one ordered list in the settings table, photos on local disk next to member photos. */
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { eq } from 'drizzle-orm'

import { PASTOR_PHOTO_ROUTE, parsePastors, type Pastor } from '@/config/pastors'
import { db, schema } from '@/lib/server/db'
import { env } from '@/lib/server/env'
import { sniff } from '@/lib/server/photos'

const KEY = 'pastors'
const MAX_BYTES = 2 * 1024 * 1024
const dir = () => path.resolve(env.uploadDir, 'pastors')
const FILE_NAME = /^[0-9a-f]{16}\.(jpg|png)$/

export async function getPastors(): Promise<Pastor[]> {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, KEY) })
  return parsePastors(row?.value)
}

export async function savePastors(pastors: Pastor[]) {
  await db.insert(schema.settings).values({ key: KEY, value: pastors }).onConflictDoUpdate({ target: schema.settings.key, set: { value: pastors } })
}

export async function savePastorPhoto(file: File) {
  if (file.size > MAX_BYTES) return { error: 'Choose an image of 2 MB or less.' } as const
  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniff(bytes)
  if (!kind) return { error: 'Choose a JPG or PNG image.' } as const
  await mkdir(dir(), { recursive: true })
  const name = `${randomBytes(8).toString('hex')}.${kind.ext}`
  await writeFile(path.join(dir(), name), bytes)
  return { url: `${PASTOR_PHOTO_ROUTE}/${name}` } as const
}

/** Removes photo files that were in `before` but are no longer used by `after`. */
export async function deleteUnusedPastorPhotos(before: Pastor[], after: Pastor[]) {
  const kept = new Set(after.map((p) => p.photoUrl))
  for (const url of before.map((p) => p.photoUrl)) {
    const name = url && !kept.has(url) ? url.slice(PASTOR_PHOTO_ROUTE.length + 1) : undefined
    if (name && FILE_NAME.test(name)) await unlink(path.join(dir(), name)).catch(() => {})
  }
}

export async function readPastorPhoto(name: string) {
  if (!FILE_NAME.test(name)) return undefined
  const bytes = await readFile(path.join(dir(), name)).catch(() => undefined)
  return bytes && { bytes, type: name.endsWith('.png') ? 'image/png' : 'image/jpeg' }
}
