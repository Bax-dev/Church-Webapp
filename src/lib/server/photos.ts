/** Profile photos on local disk (PRD M-09; storage is open question §18 Q5, so this is the simplest option). */
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { env } from '@/lib/server/env'

export const PHOTO_ROUTE = '/api/photos'
const MAX_BYTES = 2 * 1024 * 1024
const dir = () => path.resolve(env.uploadDir, 'photos')

/** Trusts the file's first bytes, not its name or the browser's content type. */
export function sniff(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: 'png', type: 'image/png' }
  return undefined
}

export async function savePhoto(userId: string, file: File) {
  if (file.size > MAX_BYTES) return { error: 'Choose an image of 2 MB or less.' } as const
  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniff(bytes)
  if (!kind) return { error: 'Choose a JPG or PNG image.' } as const
  await mkdir(dir(), { recursive: true })
  const name = `${userId}-${randomBytes(6).toString('hex')}.${kind.ext}`
  await writeFile(path.join(dir(), name), bytes)
  return { url: `${PHOTO_ROUTE}/${name}` } as const
}

export async function deletePhoto(url: string | null) {
  const name = url?.startsWith(`${PHOTO_ROUTE}/`) ? url.slice(PHOTO_ROUTE.length + 1) : undefined
  if (name && /^[\w-]+\.(jpg|png)$/.test(name)) await unlink(path.join(dir(), name)).catch(() => {})
}

/** File names are `{userId}-{random}.{ext}`, so the owner can be checked without a database lookup. */
export async function readPhoto(name: string) {
  const match = /^([\w-]+)-[0-9a-f]{12}\.(jpg|png)$/.exec(name)
  if (!match) return undefined
  const bytes = await readFile(path.join(dir(), name)).catch(() => undefined)
  return bytes && { bytes, ownerId: match[1], type: match[2] === 'png' ? 'image/png' : 'image/jpeg' }
}
