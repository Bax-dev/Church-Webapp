/** Server configuration (PRD §13). Read once; throws early in production if a secret is missing. */

const isProd = process.env.NODE_ENV === 'production'

function read(name: string, devDefault?: string) {
  const value = process.env[name]
  if (value) return value
  if (devDefault !== undefined && !isProd) return devDefault
  throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`)
}

/** "15m", "7d", "3600" → seconds. */
function seconds(value: string) {
  const match = /^(\d+)\s*([smhd]?)$/.exec(value.trim())
  if (!match) throw new Error(`Invalid duration "${value}"`)
  const unit = { '': 1, s: 1, m: 60, h: 3600, d: 86_400 }[match[2] as '' | 's' | 'm' | 'h' | 'd']
  return Number(match[1]) * unit
}

export const env = {
  isProd,
  get databaseUrl() { return read('DATABASE_URL') },
  get accessSecret() { return new TextEncoder().encode(read('JWT_ACCESS_SECRET', 'dev-access-secret-change-me-0123456789')) },
  get refreshSecret() { return new TextEncoder().encode(read('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me-0123456789')) },
  get accessTtl() { return seconds(process.env.ACCESS_TOKEN_TTL ?? '15m') },
  get refreshTtl() { return seconds(process.env.REFRESH_TOKEN_TTL ?? '7d') },
  get appUrl() { return read('APP_URL', 'http://localhost:3000').replace(/\/$/, '') },
  smtp: {
    get host() { return process.env.SMTP_HOST },
    get port() { return Number(process.env.SMTP_PORT ?? 587) },
    get user() { return process.env.SMTP_USER },
    get pass() { return process.env.SMTP_PASS },
    get from() { return process.env.EMAIL_FROM ?? 'Presbyterian Centre <no-reply@localhost>' },
  },
  /** Development only: a file that unsent emails are appended to. */
  get mailOutbox() { return env.smtp.host ? undefined : process.env.MAIL_OUTBOX },
  /** Development only, when S3_BUCKET is empty: uploads are kept on local disk here. */
  get uploadDir() { return process.env.UPLOAD_DIR ?? 'uploads' },
  /** Object storage. S3_ENDPOINT is only needed for S3-compatible providers (R2, MinIO, Spaces). */
  s3: {
    /** Empty in development means local disk (see uploadDir). */
    get bucket() { return read('S3_BUCKET', '') },
    get region() { return process.env.S3_REGION ?? process.env.AWS_REGION ?? 'us-east-1' },
    get endpoint() { return process.env.S3_ENDPOINT || undefined },
    get accessKeyId() { return process.env.S3_ACCESS_KEY_ID || undefined },
    get secretAccessKey() { return process.env.S3_SECRET_ACCESS_KEY || undefined },
    get forcePathStyle() { return process.env.S3_FORCE_PATH_STYLE === 'true' },
    /** Public base URL for objects (e.g. a CDN), when the bucket is publicly readable. */
    get publicUrl() { return process.env.S3_PUBLIC_URL?.replace(/\/$/, '') || undefined },
  },
  /** Key store (kv.ts). Empty DYNAMODB_TABLE in development means in-memory. */
  dynamo: {
    get table() { return read('DYNAMODB_TABLE', '') },
    /** Only for DynamoDB Local, e.g. http://localhost:8000. */
    get endpoint() { return process.env.DYNAMODB_ENDPOINT || undefined },
  },
  resend: {
    get apiKey() { return process.env.RESEND_API_KEY || undefined },
    get from() { return process.env.RESEND_FROM ?? env.smtp.from },
  },
}
