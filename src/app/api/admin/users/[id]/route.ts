import { eq } from 'drizzle-orm'

import { HttpError, clientIp, ok, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { revokeAllSessions } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import { listAdmins, toMember } from '@/lib/server/members'

/** Removes Super Admin rights. There must always be at least one other active Super Admin (PRD §18 Q6). */
export const DELETE = route<{ id: string }>(async (request, { params }) => {
  const admin = await requireAdmin(request)
  const id = (await params).id
  if (id === admin.id) throw new HttpError(422, 'You cannot remove your own admin rights. Ask another Super Admin.')
  const admins = await listAdmins()
  const target = admins.find((a) => a.id === id)
  if (!target) throw new HttpError(404, 'That person is not a Super Admin.')
  if (admins.filter((a) => a.status === 'ACTIVE' && a.id !== id).length < 1) throw new HttpError(422, 'There must always be at least one active Super Admin.')

  const [updated] = await db.update(schema.users).set({ role: 'MEMBER' }).where(eq(schema.users.id, id)).returning()
  // Their current tokens still say SUPER_ADMIN; force a fresh sign-in so the new role applies everywhere.
  await revokeAllSessions(id)
  await audit({ actor: admin, target: updated, action: 'admin.revoke', detail: 'Role SUPER_ADMIN → MEMBER', oldValue: { role: 'SUPER_ADMIN' }, newValue: { role: 'MEMBER' }, ip: clientIp(request) })
  return ok(toMember(updated))
})
