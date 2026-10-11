import { eq } from 'drizzle-orm'

import { HttpError, clientIp, ok, readJson, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { db, schema } from '@/lib/server/db'
import { listAdmins, toMember } from '@/lib/server/members'
import { promoteAdminSchema } from '@/lib/schemas'

export const GET = route(async (request) => {
  await requireAdmin(request)
  return ok(await listAdmins())
})

/** Makes an existing, active member a Super Admin (PRD A-10). */
export const POST = route(async (request) => {
  const admin = await requireAdmin(request)
  const { email } = await readJson(request, promoteAdminSchema)
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) })
  if (!user) throw new HttpError(422, 'Please check the highlighted fields.', { email: 'No member uses that email address. They need to sign up first.' })
  if (user.status !== 'ACTIVE') throw new HttpError(422, 'Please check the highlighted fields.', { email: 'That member’s account is not active yet. Approve it first.' })
  if (user.role === 'SUPER_ADMIN') throw new HttpError(422, 'Please check the highlighted fields.', { email: 'That member is already a Super Admin.' })
  const [updated] = await db.update(schema.users).set({ role: 'SUPER_ADMIN' }).where(eq(schema.users.id, user.id)).returning()
  await audit({ actor: admin, target: updated, action: 'admin.grant', detail: 'Role MEMBER → SUPER_ADMIN', oldValue: { role: 'MEMBER' }, newValue: { role: 'SUPER_ADMIN' }, ip: clientIp(request) })
  return ok(toMember(updated), { status: 201 })
})
