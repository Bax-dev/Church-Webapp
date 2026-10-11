/**
 * Object storage on S3 or an S3-compatible provider (R2, MinIO, Spaces). Not wired in yet:
 * profile photos still live on local disk (see photos.ts).
 */
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
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

export const storage = {
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
      return { bytes: await result.Body.transformToByteArray(), type: result.ContentType }
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
