import { guideSchema, longDate } from '@/config/prayer'
import { HttpError, clientIp, ok, readJson, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { deleteGuide, getGuide, guideByDate, updateGuide } from '@/lib/server/prayer'

type Params = { id: string }

async function find(id: string) {
  const guide = await getGuide(id)
  if (!guide) throw new HttpError(404, 'That prayer guide does not exist.')
  return guide
}

export const GET = route<Params>(async (request, { params }) => {
  await requireAdmin(request)
  return ok(await find((await params).id))
})

export const PUT = route<Params>(async (request, { params }) => {
  const admin = await requireAdmin(request)
  const before = await find((await params).id)
  const guide = await readJson(request, guideSchema)
  const clash = guide.date !== before.date && (await guideByDate(guide.date))
  if (clash) throw new HttpError(409, 'Please check the highlighted fields.', { date: `There is already a guide for ${longDate(guide.date)}.` })
  const saved = await updateGuide(before.id, guide)
  await audit({ actor: admin, action: 'prayer.guide.update', detail: `Prayer guide for ${longDate(guide.date)} saved${guide.published ? '' : ' as a draft'}`, oldValue: before, newValue: saved, ip: clientIp(request) })
  return ok(saved)
})

export const DELETE = route<Params>(async (request, { params }) => {
  const admin = await requireAdmin(request)
  const removed = await deleteGuide((await find((await params).id)).id)
  await audit({ actor: admin, action: 'prayer.guide.delete', detail: `Deleted the prayer guide for ${longDate(removed!.date)}`, oldValue: removed, ip: clientIp(request) })
  return ok({ id: removed!.id })
})
