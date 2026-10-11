/**
 * JWT sessions backed by Redis (PRD §5).
 * Access token: 15 min, in an httpOnly cookie. Refresh token: 7 days, its jti stored at refresh:{userId}:{jti} and rotated on use.
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { hash, verify } from '@node-rs/argon2'
import { eq } from 'drizzle-orm'
import { jwtVerify, SignJWT } from 'jose'

import type { Role } from '@/config/portal'
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/config/session'
import { db, schema } from '@/lib/server/db'
import { env } from '@/lib/server/env'
import { redis } from '@/lib/server/redis'

export { ACCESS_COOKIE, REFRESH_COOKIE }

export type AccessClaims = { sub: string; role: Role; jti: string; iat: number; exp: number }

/** Argon2id with the library defaults (19 MiB, 2 passes). */
export const hashPassword = (password: string) => hash(password)
export const verifyPassword = (passwordHash: string, password: string) => verify(passwordHash, password).catch(() => false)

// Verifying against a throwaway hash when the email is unknown keeps login timing the same either way.
let dummyHash: Promise<string> | undefined
export async function burnPasswordCheck(password: string) {
  dummyHash ??= hashPassword(randomUUID())
  await verifyPassword(await dummyHash, password)
}

export async function verifyAccess(token: string | undefined): Promise<AccessClaims | undefined> {
  if (!token) return undefined
  try {
    const { payload } = await jwtVerify(token, env.accessSecret, { algorithms: ['HS256'] })
    if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string') return undefined
    if (payload.role !== 'MEMBER' && payload.role !== 'SUPER_ADMIN') return undefined
    return payload as AccessClaims
  } catch {
    return undefined
  }
}

/** The role an active account has right now, or undefined if it cannot sign in. */
export async function currentRole(userId: string): Promise<Role | undefined> {
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId), columns: { status: true, role: true } })
  return user?.status === 'ACTIVE' ? user.role : undefined
}

export async function isBlacklisted(jti: string) {
  return (await redis.exists(`blacklist:${jti}`)) === 1
}

export type TokenPair = { access: string; refresh: string }

export async function issueTokens(userId: string, role: Role): Promise<TokenPair> {
  const now = Math.floor(Date.now() / 1000)
  const refreshJti = randomUUID()
  const access = await new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId).setJti(randomUUID()).setIssuedAt(now).setExpirationTime(now + env.accessTtl)
    .sign(env.accessSecret)
  const refresh = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId).setJti(refreshJti).setIssuedAt(now).setExpirationTime(now + env.refreshTtl)
    .sign(env.refreshSecret)
  await redis.set(`refresh:${userId}:${refreshJti}`, '1', 'EX', env.refreshTtl)
  return { access, refresh }
}

/** Seconds a rotated refresh token keeps working, so parallel requests (prefetches, two tabs) do not log the member out. */
const ROTATION_GRACE = 30

/** Exchanges a refresh token for a new pair, or returns undefined if it is invalid, revoked or the account cannot sign in. */
export async function rotateTokens(refreshToken: string | undefined): Promise<(TokenPair & { userId: string; role: Role }) | undefined> {
  if (!refreshToken) return undefined
  let sub: string, jti: string
  try {
    const { payload } = await jwtVerify(refreshToken, env.refreshSecret, { algorithms: ['HS256'] })
    if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string') return undefined
    ;({ sub, jti } = payload as { sub: string; jti: string })
  } catch {
    return undefined
  }
  const key = `refresh:${sub}:${jti}`
  const state = await redis.get(key)
  if (!state) return undefined
  // The account may have been deactivated, deleted or had its role changed since the token was issued.
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, sub), columns: { status: true, role: true } })
  if (!user || user.status !== 'ACTIVE') {
    await redis.del(key)
    return undefined
  }
  if (state === '1') await redis.set(key, 'rotated', 'EX', ROTATION_GRACE)
  return { ...(await issueTokens(sub, user.role)), userId: sub, role: user.role }
}

/** Logout: drop this device's refresh token and blacklist its access token until it would have expired. */
export async function revokeTokens(access: string | undefined, refresh: string | undefined) {
  const claims = await verifyAccess(access)
  if (claims) {
    const ttl = claims.exp - Math.floor(Date.now() / 1000)
    if (ttl > 0) await redis.set(`blacklist:${claims.jti}`, '1', 'EX', ttl)
  }
  if (refresh) {
    try {
      const { payload } = await jwtVerify(refresh, env.refreshSecret, { algorithms: ['HS256'] })
      await redis.del(`refresh:${payload.sub}:${payload.jti}`)
    } catch { /* already invalid */ }
  }
}

/** Logout everywhere: every refresh token goes, and access tokens issued before now stop working. */
export async function revokeAllSessions(userId: string) {
  let cursor = '0'
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', `refresh:${userId}:*`, 'COUNT', 200)
    if (keys.length) await redis.del(...keys)
    cursor = next
  } while (cursor !== '0')
  // Whole seconds, because JWT iat is in seconds: a token issued later this second is still accepted.
  await db.update(schema.users).set({ tokensValidAfter: new Date(Math.floor(Date.now() / 1000) * 1000) }).where(eq(schema.users.id, userId))
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
})

type CookieJar = { set(name: string, value: string, options: ReturnType<typeof cookieOptions>): unknown }

export function setSessionCookies(jar: CookieJar, tokens: TokenPair) {
  jar.set(ACCESS_COOKIE, tokens.access, cookieOptions(env.accessTtl))
  jar.set(REFRESH_COOKIE, tokens.refresh, cookieOptions(env.refreshTtl))
}

export function clearSessionCookies(jar: CookieJar) {
  jar.set(ACCESS_COOKIE, '', cookieOptions(0))
  jar.set(REFRESH_COOKIE, '', cookieOptions(0))
}

// One-time links (PRD §5): a random 32-byte token emailed to the member; only its SHA-256 is stored, under a TTL.
export type LinkKind = 'setup' | 'reset' | 'verify-email'
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

export async function createLinkToken(kind: LinkKind, value: string, ttlSeconds: number) {
  const token = randomBytes(32).toString('base64url')
  await redis.set(`${kind}:${sha256(token)}`, value, 'EX', ttlSeconds)
  return token
}

/** Reads without using it up, so a page can say "this link has expired" before the member types a password. */
export const peekLinkToken = (kind: LinkKind, token: string) => redis.get(`${kind}:${sha256(token)}`)
export const consumeLinkToken = (kind: LinkKind, token: string) => redis.getdel(`${kind}:${sha256(token)}`)

/** Fixed-window counter. Returns the seconds to wait when the limit is reached. */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, windowSeconds)
  if (count <= max) return { ok: true }
  return { ok: false, retryAfter: Math.max(1, await redis.ttl(key)) }
}

export const clearRateLimit = (key: string) => redis.del(key)
