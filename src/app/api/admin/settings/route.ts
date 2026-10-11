import { clientIp, ok, readJson, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { getPortalSettings, savePortalSettings } from '@/lib/server/settings'
import { settingsSchema } from '@/lib/schemas'

export const GET = route(async (request) => {
  await requireAdmin(request)
  return ok(await getPortalSettings())
})

/** PRD A-12: auto-approve new sign-ups after email verification, or approve each one by hand. */
export const PATCH = route(async (request) => {
  const admin = await requireAdmin(request)
  const next = await readJson(request, settingsSchema)
  const previous = await getPortalSettings()
  await savePortalSettings({ ...previous, ...next })
  if (previous.approval !== next.approval) {
    await audit({
      actor: admin, action: 'settings.update', ip: clientIp(request), oldValue: previous, newValue: next,
      detail: next.approval === 'auto' ? 'New sign-ups activate after email verification' : 'New sign-ups need approval',
    })
  }
  return ok({ ...previous, ...next })
})
