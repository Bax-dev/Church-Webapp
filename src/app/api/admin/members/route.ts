import { eq } from 'drizzle-orm'

import { HttpError, clientIp, ok, parse, readJson, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { createLinkToken } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import { emails } from '@/lib/server/email'
import { invalidateStats, listMembers, toMember } from '@/lib/server/members'
import { adminMemberCreateSchema, memberQuerySchema } from '@/lib/schemas'

/** Server-side paginated, filtered and sorted member list (PRD A-02, A-03). */
export const GET = route(async (request) => {
  await requireAdmin(request)
  const query = parse(memberQuerySchema, Object.fromEntries([...request.nextUrl.searchParams].filter(([, value]) => value !== '')))
  return ok(await listMembers(query))
})

/** Adds a member by hand (PRD A-05) and emails them the link to set a password. */
export const POST = route(async (request) => {
  const admin = await requireAdmin(request)
  const input = await readJson(request, adminMemberCreateSchema)
  if (await db.query.users.findFirst({ where: eq(schema.users.email, input.email) })) {
    throw new HttpError(422, 'Please check the highlighted fields.', { email: 'A member with that email address already exists.' })
  }
  const [user] = await db.insert(schema.users).values({ ...input, emailVerified: false }).returning()
  await emails.signupLink(user.email, user.firstName, await createLinkToken('setup', user.id, 24 * 3600))
  await audit({ actor: admin, target: user, action: 'member.create', detail: 'Added by an administrator; sign-up link emailed', newValue: input, ip: clientIp(request) })
  await invalidateStats()
  return ok(toMember(user), { status: 201 })
})
