import { clientIp, ok, readJson, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { getSiteWidgets, saveSiteWidgets } from '@/lib/server/settings'
import { siteWidgetsSchema } from '@/lib/schemas'

export const GET = route(async (request) => {
  await requireAdmin(request)
  return ok(await getSiteWidgets())
})

/** The floating WhatsApp button and the top banner: content and on/off switches. */
export const PATCH = route(async (request) => {
  const admin = await requireAdmin(request)
  const next = await readJson(request, siteWidgetsSchema)
  const previous = await getSiteWidgets()
  await saveSiteWidgets(next)
  const state = (on: boolean) => (on ? 'on' : 'off')
  await audit({
    actor: admin, action: 'settings.widgets', ip: clientIp(request), oldValue: previous, newValue: next,
    detail: `WhatsApp button ${state(next.whatsapp.enabled)}, top banner ${state(next.banner.enabled)}`,
  })
  return ok(next)
})
