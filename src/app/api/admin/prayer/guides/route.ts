import { guideSchema, longDate } from '@/config/prayer'
import { HttpError, clientIp, ok, readJson, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { guideByDate, insertGuide, listGuides } from '@/lib/server/prayer'

export const GET = route(async (request) => {
  await requireAdmin(request)
  return ok(await listGuides())
})

export const POST = route(async (request) => {
  const admin = await requireAdmin(request)
  const guide = await readJson(request, guideSchema)
  if (await guideByDate(guide.date)) {
    throw new HttpError(409, 'Please check the highlighted fields.', { date: `There is already a guide for ${longDate(guide.date)}. Open it from the list to edit it.` })
  }
  const saved = await insertGuide(guide)
  await audit({ actor: admin, action: 'prayer.guide.create', detail: `Prayer guide for ${longDate(guide.date)}: “${guide.theme}”${guide.published ? '' : ' (draft)'}`, newValue: saved, ip: clientIp(request) })
  return ok(saved, { status: 201 })
})
