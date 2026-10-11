import { clientIp, ok, readJson, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { deleteUnusedPastorPhotos, getPastors, savePastors } from '@/lib/server/pastors'
import { pastorsSchema } from '@/config/pastors'

export const GET = route(async (request) => {
  await requireAdmin(request)
  return ok(await getPastors())
})

/** Replaces the whole list, so adding, editing, removing and reordering are all one save. */
export const PUT = route(async (request) => {
  const admin = await requireAdmin(request)
  const { pastors } = await readJson(request, pastorsSchema)
  const previous = await getPastors()
  await savePastors(pastors)
  await deleteUnusedPastorPhotos(previous, pastors)
  await audit({
    actor: admin, action: 'pastors.update', detail: `Pastors list saved (${pastors.length} ${pastors.length === 1 ? 'pastor' : 'pastors'})`,
    oldValue: previous, newValue: pastors, ip: clientIp(request),
  })
  return ok(pastors)
})
