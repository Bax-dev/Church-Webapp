import { clientIp, ok, readJson, requireUser, route } from '@/lib/server/api'
import { toMember } from '@/lib/server/members'
import { updateProfile } from '@/lib/server/profile'
import { profileSchema } from '@/lib/schemas'

/** The signed-in member's own record. The id comes from the token only (PRD §8). */
export const GET = route(async (request) => ok(toMember(await requireUser(request))))

export const PATCH = route(async (request) => {
  const user = await requireUser(request)
  const changes = await readJson(request, profileSchema)
  const { member, emailPending } = await updateProfile({ actor: user, target: user, changes, ip: clientIp(request), byAdmin: false })
  return ok({ member: toMember(member), emailPending })
})
