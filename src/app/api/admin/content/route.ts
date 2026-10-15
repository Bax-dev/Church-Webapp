import { ok, requireAdmin, route } from '@/lib/server/api'
import { getRawContent } from '@/lib/server/content'

/** The content as edited, with {church}-style placeholders left in. */
export const GET = route(async (request) => {
  await requireAdmin(request)
  return ok(await getRawContent())
})
