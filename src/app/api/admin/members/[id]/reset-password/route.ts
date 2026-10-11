import { eq } from 'drizzle-orm'

import { HttpError, clientIp, ok, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { createLinkToken } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import { emails } from '@/lib/server/email'

/** Emails the member a reset link, or their sign-up link if they never set a password (PRD A-06). */
export const POST = route<{ id: string }>(async (request, { params }) => {
  const admin = await requireAdmin(request)
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, (await params).id) })
  if (!user) throw new HttpError(404, 'That member does not exist.')
  if (user.passwordHash) await emails.resetLink(user.email, user.firstName, await createLinkToken('reset', user.id, 3600))
  else await emails.signupLink(user.email, user.firstName, await createLinkToken('setup', user.id, 24 * 3600))
  await audit({ actor: admin, target: user, action: 'member.reset_password', detail: user.passwordHash ? 'Password reset email sent' : 'Sign-up link re-sent', ip: clientIp(request) })
  return ok({ email: user.email, kind: user.passwordHash ? 'reset' : 'setup' })
})
