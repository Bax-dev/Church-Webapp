import { eq } from 'drizzle-orm'

import { HttpError, clientIp, ok, readJson, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { revokeAllSessions } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import { invalidateStats, toMember } from '@/lib/server/members'
import { deletePhoto } from '@/lib/server/photos'
import { updateProfile } from '@/lib/server/profile'
import { adminMemberUpdateSchema } from '@/lib/schemas'

type Params = { id: string }

async function find(id: string) {
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, id) })
  if (!user) throw new HttpError(404, 'That member does not exist.')
  return user
}

export const GET = route<Params>(async (request, { params }) => {
  await requireAdmin(request)
  return ok(toMember(await find((await params).id)))
})

/** Edit, approve, deactivate or reactivate (PRD A-04). */
export const PATCH = route<Params>(async (request, { params }) => {
  const admin = await requireAdmin(request)
  const target = await find((await params).id)
  const changes = await readJson(request, adminMemberUpdateSchema)
  if (target.id === admin.id && changes.status && changes.status !== 'ACTIVE') throw new HttpError(422, 'You cannot deactivate your own account.')
  const { member } = await updateProfile({ actor: admin, target, changes, ip: clientIp(request), byAdmin: true })
  return ok(toMember(member))
})

/** Deletes the record; the audit trail keeps the name (PRD A-04). */
export const DELETE = route<Params>(async (request, { params }) => {
  const admin = await requireAdmin(request)
  const target = await find((await params).id)
  if (target.id === admin.id) throw new HttpError(422, 'You cannot delete your own account. Ask another Super Admin.')
  await revokeAllSessions(target.id)
  await audit({ actor: admin, target, action: 'member.delete', detail: `Deleted ${target.firstName} ${target.lastName} (${target.email})`, oldValue: toMember(target), ip: clientIp(request) })
  await db.delete(schema.users).where(eq(schema.users.id, target.id))
  await deletePhoto(target.photoUrl)
  await invalidateStats()
  return ok({ id: target.id })
})
