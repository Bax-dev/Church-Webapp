import { eq } from 'drizzle-orm'

import { HttpError, clientIp, ok, readJson, requireUser, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { hashPassword, issueTokens, revokeAllSessions, setSessionCookies, verifyPassword } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import { changePasswordSchema } from '@/lib/schemas'

/** PRD M-07: needs the current password; signs out every other device and keeps this one signed in. */
export const POST = route(async (request) => {
  const user = await requireUser(request)
  const input = await readJson(request, changePasswordSchema)
  if (!user.passwordHash || !(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw new HttpError(422, 'Please check the highlighted fields.', { currentPassword: 'That is not your current password.' })
  }
  await revokeAllSessions(user.id)
  await db.update(schema.users).set({ passwordHash: await hashPassword(input.password) }).where(eq(schema.users.id, user.id))
  await audit({ actor: user, target: user, action: 'auth.change_password', detail: 'Password changed; other devices signed out', ip: clientIp(request) })
  const response = ok({})
  setSessionCookies(response.cookies, await issueTokens(user.id, user.role))
  return response
})
