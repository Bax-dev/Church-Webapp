/** Site content (src/config/content.ts): stored as one JSON value in the settings table, merged over the defaults. */
import { randomBytes } from 'node:crypto'
import { cache } from 'react'
import { eq } from 'drizzle-orm'

import {
  SITE_IMAGE_ROUTE, contentDefaults, fillTokens, isUploadSrc, readContent, uploadedImages, type ContentGroup, type SiteContent,
} from '@/config/content'
import { db, schema } from '@/lib/server/db'
import { getProgram } from '@/lib/server/prayer'
import { sniff } from '@/lib/server/photos'
import { storage } from '@/lib/server/s3'

const KEY = 'content'
const MAX_BYTES = 5 * 1024 * 1024
const FILE_NAME = /^[0-9a-f]{16}\.(jpg|png)$/
const PREFIX = 'site/'
const key = (name: string) => `${PREFIX}${name}`

async function readStored() {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, KEY) })
  return row?.value
}

/** The content as an admin edits it: placeholders like {church} left in. */
export async function getRawContent(): Promise<SiteContent> {
  return readContent(await readStored())
}

/**
 * The content as pages show it, with placeholders filled in. Once per request.
 * If the database is unreachable the site still renders, with the default content.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  try {
    return fillTokens(await getRawContent())
  } catch (error) {
    console.error('[content] could not load site content; showing defaults', error)
    return fillTokens(contentDefaults)
  }
})

/** Every uploaded site image something still uses: the page content, plus the prayer programme's flyer. */
export async function siteImagesInUse(content?: SiteContent) {
  const kept = uploadedImages(content ?? await getRawContent())
  const flyer = (await getProgram()).flyer?.src
  if (flyer && isUploadSrc(flyer)) kept.add(flyer)
  return kept
}

/** Deletes one uploaded site image if nothing uses it any more. */
export async function deleteSiteImageIfUnused(src: string | undefined) {
  if (!src || !isUploadSrc(src) || (await siteImagesInUse()).has(src)) return
  const name = src.slice(SITE_IMAGE_ROUTE.length + 1)
  if (FILE_NAME.test(name)) await storage.delete(key(name)).catch(() => {})
}

/** Uploads that were never saved into any page; kept for a day in case an editor is still open. */
async function deleteAbandonedUploads(kept: Set<string>) {
  const objects = await storage.list(PREFIX).catch(() => [])
  const dayAgo = Date.now() - 24 * 3600 * 1000
  for (const { key: objectKey, modified } of objects) {
    const name = objectKey.slice(PREFIX.length)
    if (!FILE_NAME.test(name) || kept.has(`${SITE_IMAGE_ROUTE}/${name}`)) continue
    if (modified.getTime() < dayAgo) await storage.delete(objectKey).catch(() => {})
  }
}

/** Saves one group, and deletes uploaded images that nothing points at any more. */
export async function saveContentGroup<G extends ContentGroup>(group: G, value: SiteContent[G]) {
  const before = await getRawContent()
  const after = { ...before, [group]: value }
  await db.insert(schema.settings).values({ key: KEY, value: after }).onConflictDoUpdate({ target: schema.settings.key, set: { value: after } })
  const kept = await siteImagesInUse(after)
  for (const url of uploadedImages(before)) {
    const name = url.slice(SITE_IMAGE_ROUTE.length + 1)
    if (!kept.has(url) && FILE_NAME.test(name)) await storage.delete(key(name)).catch(() => {})
  }
  await deleteAbandonedUploads(kept)
  return { before: before[group], after: value }
}

export async function saveSiteImage(file: File) {
  if (file.size > MAX_BYTES) return { error: 'Choose an image of 5 MB or less.' } as const
  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniff(bytes)
  if (!kind) return { error: 'Choose a JPG or PNG image.' } as const
  const name = `${randomBytes(8).toString('hex')}.${kind.ext}`
  await storage.put(key(name), bytes, { contentType: kind.type })
  return { src: `${SITE_IMAGE_ROUTE}/${name}` } as const
}

export async function readSiteImage(name: string) {
  if (!FILE_NAME.test(name)) return undefined
  const bytes = (await storage.get(key(name)))?.bytes
  return bytes && { bytes, type: name.endsWith('.png') ? 'image/png' : 'image/jpeg' }
}
