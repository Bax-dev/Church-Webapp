/**
 * Object storage on S3 or an S3-compatible provider (R2, MinIO, Spaces): member photos, pastor photos and site images.
 * In development with S3_BUCKET empty, `storage` keeps the same keys as files under UPLOAD_DIR instead.
 */
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { env } from '@/lib/server/env'

const globalForS3 = globalThis as unknown as { pcnS3?: S3Client }

function client() {
  globalForS3.pcnS3 ??= new S3Client({
    region: env.s3.region,
    endpoint: env.s3.endpoint,
    forcePathStyle: env.s3.forcePathStyle,
    // Without explicit keys the SDK falls back to its default chain (env, IAM role, ~/.aws).
    credentials: env.s3.accessKeyId && env.s3.secretAccessKey
      ? { accessKeyId: env.s3.accessKeyId, secretAccessKey: env.s3.secretAccessKey }
      : undefined,
  })
  return globalForS3.pcnS3
}

const isMissing = (error: unknown) => error instanceof NoSuchKey || error instanceof NotFound

const s3Storage = {
  async put(key: string, body: Uint8Array | string, options: { contentType?: string; cacheControl?: string } = {}) {
    await client().send(new PutObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
      Body: body,
      ContentType: options.contentType,
      CacheControl: options.cacheControl,
    }))
    return { key }
  },

  /** The object's bytes and content type, or undefined if there is no such key. */
  async get(key: string) {
    try {
      const result = await client().send(new GetObjectCommand({ Bucket: env.s3.bucket, Key: key }))
      if (!result.Body) return undefined
      // Copied into a plain ArrayBuffer so it can be passed straight to `new Response()`.
      return { bytes: new Uint8Array(await result.Body.transformToByteArray()), type: result.ContentType }
    } catch (error) {
      if (isMissing(error)) return undefined
      throw error
    }
  },

  async exists(key: string) {
    try {
      await client().send(new HeadObjectCommand({ Bucket: env.s3.bucket, Key: key }))
      return true
    } catch (error) {
      if (isMissing(error)) return false
      throw error
    }
  },

  /** Deleting a key that does not exist succeeds, as in S3 itself. */
  async delete(key: string) {
    await client().send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: key }))
  },

  /** Every object under a prefix such as "site/", with when it was last written. */
  async list(prefix: string) {
    const objects: { key: string; modified: Date }[] = []
    let token: string | undefined
    do {
      const page = await client().send(new ListObjectsV2Command({ Bucket: env.s3.bucket, Prefix: prefix, ContinuationToken: token }))
      for (const o of page.Contents ?? []) if (o.Key && o.LastModified) objects.push({ key: o.Key, modified: o.LastModified })
      token = page.NextContinuationToken
    } while (token)
    return objects
  },

  /** A time-limited link to download a private object. */
  signedGetUrl(key: string, expiresIn = 300) {
    return getSignedUrl(client(), new GetObjectCommand({ Bucket: env.s3.bucket, Key: key }), { expiresIn })
  },

  /** A time-limited link the browser can PUT a file to directly; it must send the same Content-Type. */
  signedPutUrl(key: string, contentType: string, expiresIn = 300) {
    return getSignedUrl(client(), new PutObjectCommand({ Bucket: env.s3.bucket, Key: key, ContentType: contentType }), { expiresIn })
  },

  /** Only meaningful when S3_PUBLIC_URL points at a publicly readable bucket or CDN. */
  publicUrl(key: string) {
    if (!env.s3.publicUrl) throw new Error('S3_PUBLIC_URL is not set')
    return `${env.s3.publicUrl}/${key.split('/').map(encodeURIComponent).join('/')}`
  },
}

/** Development stand-in: the same keys as files under UPLOAD_DIR. Keys are built by our own code, never from raw input. */
const file = (key: string) => path.resolve(env.uploadDir, key)

const diskStorage = {
  async put(key: string, body: Uint8Array | string, _options: { contentType?: string; cacheControl?: string } = {}) {
    await mkdir(path.dirname(file(key)), { recursive: true })
    await writeFile(file(key), body)
    return { key }
  },
  async get(key: string) {
    const bytes = await readFile(file(key)).catch(() => undefined)
    return bytes && { bytes: new Uint8Array(bytes), type: undefined as string | undefined }
  },
  async delete(key: string) {
    await unlink(file(key)).catch(() => {})
  },
  async list(prefix: string) {
    const dir = path.dirname(file(`${prefix}x`))
    const names = await readdir(dir).catch(() => [] as string[])
    const objects: { key: string; modified: Date }[] = []
    for (const name of names) {
      const info = await stat(path.join(dir, name)).catch(() => undefined)
      if (info?.isFile()) objects.push({ key: `${prefix}${name}`, modified: info.mtime })
    }
    return objects
  },
}

/** S3 when S3_BUCKET is set (always in production), otherwise local disk. */
export const storage = {
  put: (...args: Parameters<typeof s3Storage.put>) => (env.s3.bucket ? s3Storage : diskStorage).put(...args),
  get: (key: string) => (env.s3.bucket ? s3Storage : diskStorage).get(key),
  delete: (key: string) => (env.s3.bucket ? s3Storage : diskStorage).delete(key),
  list: (prefix: string) => (env.s3.bucket ? s3Storage : diskStorage).list(prefix),
  exists: s3Storage.exists,
  signedGetUrl: s3Storage.signedGetUrl,
  signedPutUrl: s3Storage.signedPutUrl,
  publicUrl: s3Storage.publicUrl,
}
