import { eq } from 'drizzle-orm'

import { routes } from '@/config/routes'
import { clientIp, ok, requireUser, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { db, schema } from '@/lib/server/db'
import { emails } from '@/lib/server/email'
import { env } from '@/lib/server/env'
import { invalidateStats, listAdmins } from '@/lib/server/members'

/** PRD M-10: flags the record and tells every Super Admin, who confirm with the member before deleting it. */
export const POST = route(async (request) => {
  const user = await requireUser(request)
  if (!user.deletionRequestedAt) {
    const requestedAt = new Date()
    await db.update(schema.users).set({ deletionRequestedAt: requestedAt }).where(eq(schema.users.id, user.id))
    await audit({ actor: user, target: user, action: 'member.delete_request', detail: 'Asked for their account to be deleted', ip: clientIp(request) })
    await invalidateStats()
    const url = `${env.appUrl}${routes.adminMembers.path}/${user.id}/`
    for (const admin of await listAdmins()) await emails.deletionRequested(admin.email, `${user.firstName} ${user.lastName}`, url)
    return ok({ requestedAt: requestedAt.toISOString() })
  }
  return ok({ requestedAt: user.deletionRequestedAt.toISOString() })
})
