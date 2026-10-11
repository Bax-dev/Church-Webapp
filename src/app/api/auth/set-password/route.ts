import { eq } from 'drizzle-orm'

import { routes } from '@/config/routes'
import { HttpError, clientIp, ok, readJson, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { consumeLinkToken, hashPassword, issueTokens, setSessionCookies } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import { invalidateStats } from '@/lib/server/members'
import { getPortalSettings } from '@/lib/server/settings'
import { setPasswordSchema } from '@/lib/schemas'

/**
 * Consumes the emailed sign-up link: confirms the address and sets the password (PRD M-02).
 * With auto-approval the member is signed straight in; with manual approval they wait for a Super Admin.
 */
export const POST = route(async (request) => {
  const input = await readJson(request, setPasswordSchema)
  const userId = await consumeLinkToken('setup', input.token)
  const user = userId && await db.query.users.findFirst({ where: eq(schema.users.id, userId) })
  if (!user) throw new HttpError(400, 'This link has expired or has already been used. Request a new one from the sign-up page.')

  const { approval } = await getPortalSettings()
  const status = user.status === 'PENDING' && approval === 'auto' ? 'ACTIVE' : user.status
  const [updated] = await db.update(schema.users)
    .set({ passwordHash: await hashPassword(input.password), emailVerified: true, status, ...(status === 'ACTIVE' && { lastLoginAt: new Date() }) })
    .where(eq(schema.users.id, user.id)).returning()
  await audit({ actor: updated, target: updated, action: 'auth.set_password', detail: status === 'ACTIVE' ? 'Email verified; account active' : 'Email verified; awaiting approval', ip: clientIp(request) })
  await invalidateStats()

  if (updated.status !== 'ACTIVE') return ok({ awaitingApproval: true })
  const response = ok({ awaitingApproval: false, next: updated.role === 'SUPER_ADMIN' ? routes.admin.path : routes.dashboard.path })
  setSessionCookies(response.cookies, await issueTokens(updated.id, updated.role))
  return response
})
