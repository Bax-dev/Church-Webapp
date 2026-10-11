import { eq } from 'drizzle-orm'

import { routes } from '@/config/routes'
import { HttpError, clientIp, ok, readJson, route } from '@/lib/server/api'
import { burnPasswordCheck, clearRateLimit, issueTokens, rateLimit, setSessionCookies, verifyPassword } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import { loginSchema } from '@/lib/schemas'

const WRONG = 'That email and password do not match an account. Check them and try again.'

/** PRD M-03. Five attempts per 15 minutes per IP and email, then a temporary lockout. */
export const POST = route(async (request) => {
  const input = await readJson(request, loginSchema)
  const key = `rl:login:${clientIp(request)}:${input.email}`
  const limit = await rateLimit(key, 5, 15 * 60)
  if (!limit.ok) {
    const minutes = Math.ceil(limit.retryAfter / 60)
    throw new HttpError(429, `Too many attempts. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}, or reset your password.`, undefined, { 'Retry-After': String(limit.retryAfter) })
  }

  const user = await db.query.users.findFirst({ where: eq(schema.users.email, input.email) })
  if (!user?.passwordHash) {
    await burnPasswordCheck(input.password)
    throw new HttpError(401, WRONG)
  }
  if (!(await verifyPassword(user.passwordHash, input.password))) throw new HttpError(401, WRONG)

  // Only someone who knows the password learns the account state.
  if (user.status === 'PENDING') throw new HttpError(403, 'Your account is waiting for approval from the church office. We will email you when it is ready.')
  if (user.status === 'INACTIVE') throw new HttpError(403, 'This account has been deactivated. Please contact the church office.')

  await clearRateLimit(key)
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id))
  const response = ok({ role: user.role, next: user.role === 'SUPER_ADMIN' ? routes.admin.path : routes.dashboard.path })
  setSessionCookies(response.cookies, await issueTokens(user.id, user.role))
  return response
})
