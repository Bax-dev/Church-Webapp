import { eq } from 'drizzle-orm'

import { routes } from '@/config/routes'
import { HttpError, clientIp, ok, readJson, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { consumeLinkToken, hashPassword, issueTokens, revokeAllSessions, setSessionCookies } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import { resetPasswordSchema } from '@/lib/schemas'

/** Sets a new password from an emailed reset link, signs out every other device, and signs this one in. */
export const POST = route(async (request) => {
  const input = await readJson(request, resetPasswordSchema)
  const userId = await consumeLinkToken('reset', input.token)
  const user = userId && await db.query.users.findFirst({ where: eq(schema.users.id, userId) })
  if (!user) throw new HttpError(400, 'This reset link has expired or has already been used. Request a new one.')

  await revokeAllSessions(user.id)
  await db.update(schema.users).set({ passwordHash: await hashPassword(input.password), emailVerified: true }).where(eq(schema.users.id, user.id))
  await audit({ actor: user, target: user, action: 'auth.reset_password', detail: 'Password reset from emailed link', ip: clientIp(request) })

  if (user.status !== 'ACTIVE') return ok({ signedIn: false })
  const response = ok({ signedIn: true, next: user.role === 'SUPER_ADMIN' ? routes.admin.path : routes.dashboard.path })
  setSessionCookies(response.cookies, await issueTokens(user.id, user.role))
  return response
})
