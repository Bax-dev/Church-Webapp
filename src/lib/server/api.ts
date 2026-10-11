/** Route Handler plumbing: the { success, data?, error? } envelope (PRD §8), validation, CSRF origin check and role checks. */
import { eq } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { ACCESS_COOKIE, isBlacklisted, verifyAccess } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import type { UserRow } from '@/lib/server/db/schema'

export class HttpError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>, public headers?: HeadersInit) {
    super(message)
  }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ success: true, data }, init)

const fail = (status: number, message: string, fields?: Record<string, string>, headers?: HeadersInit) =>
  NextResponse.json({ success: false, error: { message, ...(fields && { fields }) } }, { status, headers })

/** First message per field, keyed by the field's top-level name. */
function fieldErrors(error: z.ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    fields[key] ??= issue.message
  }
  return fields
}

export function parse<S extends z.ZodType>(schemaToUse: S, input: unknown): z.infer<S> {
  const result = schemaToUse.safeParse(input)
  if (!result.success) throw new HttpError(422, 'Please check the highlighted fields.', fieldErrors(result.error))
  return result.data
}

export async function readJson<S extends z.ZodType>(request: Request, schemaToUse: S): Promise<z.infer<S>> {
  const body = await request.json().catch(() => {
    throw new HttpError(400, 'The request body must be JSON.')
  })
  return parse(schemaToUse, body)
}

/** CSRF defence on top of SameSite=Lax (PRD §11): a mutating request must come from this site. */
function assertSameOrigin(request: NextRequest) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host || new URL(origin).host !== host) throw new HttpError(403, 'Cross-site requests are not allowed.')
}

type Context<P> = { params: Promise<P> }

/** Wraps a Route Handler with the origin check and turns thrown errors into the JSON envelope. */
export function route<P = Record<string, never>>(fn: (request: NextRequest, context: Context<P>) => Promise<Response>) {
  return async (request: NextRequest, context: Context<P>) => {
    try {
      assertSameOrigin(request)
      return await fn(request, context)
    } catch (error) {
      if (error instanceof HttpError) return fail(error.status, error.message, error.fields, error.headers)
      console.error(`[api] ${request.method} ${request.nextUrl.pathname}`, error)
      return fail(500, 'Something went wrong on our side. Please try again.')
    }
  }
}

export function clientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
}

/**
 * The signed-in user, loaded fresh from the database on every call, so a deactivation, deletion,
 * role change or "sign out everywhere" takes effect immediately rather than when the token expires.
 */
export async function userFromAccessToken(token: string | undefined): Promise<UserRow | undefined> {
  const claims = await verifyAccess(token)
  if (!claims || (await isBlacklisted(claims.jti))) return undefined
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, claims.sub) })
  if (!user || user.status !== 'ACTIVE') return undefined
  if (user.tokensValidAfter && claims.iat * 1000 < user.tokensValidAfter.getTime()) return undefined
  return user
}

/** The id always comes from the token, never the URL or body (PRD §8, IDOR rule). */
export async function requireUser(request: NextRequest) {
  const user = await userFromAccessToken(request.cookies.get(ACCESS_COOKIE)?.value)
  if (!user) throw new HttpError(401, 'Please sign in again.')
  return user
}

/** Re-checks the role server-side even though the proxy already blocks /api/admin for members (PRD §5). */
export async function requireAdmin(request: NextRequest) {
  const user = await requireUser(request)
  if (user.role !== 'SUPER_ADMIN') throw new HttpError(403, 'Only Super Admins can do that.')
  return user
}
