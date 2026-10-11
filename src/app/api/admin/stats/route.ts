import { ok, requireAdmin, route } from '@/lib/server/api'
import { adminStats } from '@/lib/server/members'

export const GET = route(async (request) => {
  await requireAdmin(request)
  return ok(await adminStats())
})
