/** Applying a profile edit, shared by PATCH /api/me (the member) and PATCH /api/admin/members/:id (a Super Admin). */
import { and, eq, ne } from 'drizzle-orm'
import type { z } from 'zod'

import { HttpError } from '@/lib/server/api'
import { audit, diff } from '@/lib/server/audit'
import { createLinkToken, revokeAllSessions } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import type { UserRow } from '@/lib/server/db/schema'
import { emails } from '@/lib/server/email'
import { invalidateStats } from '@/lib/server/members'
import type { adminMemberUpdateSchema } from '@/lib/schemas'

type Changes = z.infer<typeof adminMemberUpdateSchema>

/** A department or district must exist; members may only pick active ones, but may keep one that was deactivated after they chose it. */
async function assertLookup(kind: 'department' | 'district', id: string | undefined, current: string | null, allowInactive: boolean) {
  if (id === undefined || id === current) return
  const table = kind === 'department' ? schema.departments : schema.districts
  const [row] = await db.select().from(table).where(eq(table.id, id))
  if (!row || (!row.isActive && !allowInactive)) throw new HttpError(422, 'Please check the highlighted fields.', { [`${kind}Id`]: `Choose a ${kind} from the list.` })
}

export async function updateProfile({ actor, target, changes, ip, byAdmin }: { actor: UserRow; target: UserRow; changes: Changes; ip: string; byAdmin: boolean }) {
  await assertLookup('department', changes.departmentId, target.departmentId, byAdmin)
  await assertLookup('district', changes.districtId, target.districtId, byAdmin)

  const { email, ...rest } = changes
  const update: Partial<UserRow> = { ...rest }
  let emailPending = false

  if (email && email !== target.email) {
    const taken = await db.query.users.findFirst({ where: and(eq(schema.users.email, email), ne(schema.users.id, target.id)) })
    if (taken) throw new HttpError(422, 'Please check the highlighted fields.', { email: 'Another account already uses that email address.' })
    if (byAdmin) {
      // An admin correcting an address takes effect at once; the member verifies it next time they reset or sign up.
      Object.assign(update, { email, pendingEmail: null, emailVerified: false })
    } else {
      // PRD M-08: the old address keeps working until the new one is confirmed.
      update.pendingEmail = email
      emailPending = true
    }
  }

  if (update.status === 'ACTIVE' && target.status === 'ACTIVE') delete update.status
  const change = diff(target as unknown as Record<string, unknown>, update as Record<string, unknown>)
  if (!change.keys.length) return { member: target, emailPending: false }

  const [updated] = await db.update(schema.users).set(update).where(eq(schema.users.id, target.id)).returning()

  if (emailPending) {
    const token = await createLinkToken('verify-email', JSON.stringify({ userId: target.id, email }), 24 * 3600)
    await emails.verifyEmail(email!, updated.firstName, token)
  }
  if (update.status === 'INACTIVE') await revokeAllSessions(target.id)
  if (update.status === 'ACTIVE' && target.status === 'PENDING' && updated.passwordHash) await emails.approved(updated.email, updated.firstName)

  const action = update.status && update.status !== target.status
    ? { ACTIVE: target.status === 'PENDING' ? 'member.approve' : 'member.reactivate', INACTIVE: 'member.deactivate', PENDING: 'member.update' }[update.status]
    : byAdmin ? 'member.update' : 'profile.update'
  const detail = update.status && change.keys.length === 1 ? `Status ${target.status} → ${update.status}` : change.detail
  await audit({ actor, target: updated, action, detail, oldValue: change.oldValue, newValue: change.newValue, ip })
  await invalidateStats()
  return { member: updated, emailPending }
}
