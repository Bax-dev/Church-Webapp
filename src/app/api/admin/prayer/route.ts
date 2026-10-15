import { programSchema } from '@/config/prayer'
import { clientIp, ok, readJson, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { deleteSiteImageIfUnused } from '@/lib/server/content'
import { getProgram, saveProgram } from '@/lib/server/prayer'

export const GET = route(async (request) => {
  await requireAdmin(request)
  return ok(await getProgram())
})

/** Saves the programme settings: on/off, wording, times, flyer and the YouTube / Zoom links. */
export const PUT = route(async (request) => {
  const admin = await requireAdmin(request)
  const program = await readJson(request, programSchema)
  const previous = await getProgram()
  await saveProgram(program)
  if (previous.flyer?.src !== program.flyer?.src) await deleteSiteImageIfUnused(previous.flyer?.src)
  const switched = previous.enabled !== program.enabled ? (program.enabled ? 'switched on' : 'switched off') : 'updated'
  await audit({ actor: admin, action: 'prayer.program', detail: `“${program.title}” ${switched}`, oldValue: previous, newValue: program, ip: clientIp(request) })
  return ok(program)
})
