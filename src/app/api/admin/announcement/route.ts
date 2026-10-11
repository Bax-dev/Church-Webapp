import { clientIp, ok, readJson, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { getAnnouncement, saveAnnouncement } from '@/lib/server/settings'
import { announcementSchema } from '@/lib/schemas'

/** Content without the id, independent of key order. */
const content = (a: Record<string, unknown>) =>
  JSON.stringify(Object.keys(a).filter((key) => key !== 'id' && a[key] !== undefined).sort().map((key) => [key, a[key]]))

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'announcement'
}

export const GET = route(async (request) => {
  await requireAdmin(request)
  return ok(await getAnnouncement() ?? null)
})

/** Publishes the popup. A content change gets a new id, so people who closed the previous one see this one. */
export const PUT = route(async (request) => {
  const admin = await requireAdmin(request)
  const input = await readJson(request, announcementSchema)
  const previous = await getAnnouncement()
  const draft = { ...input, delaySeconds: input.delaySeconds ?? 1 }
  const sameContent = previous && content(previous) === content(draft)
  const announcement = { ...draft, id: sameContent ? previous.id : `${slug(input.title)}-${Date.now().toString(36)}` }
  await saveAnnouncement(announcement)
  await audit({ actor: admin, action: 'announcement.publish', detail: `${input.enabled ? 'Published' : 'Switched off'} “${input.title}”`, oldValue: previous ?? null, newValue: announcement, ip: clientIp(request) })
  return ok(announcement)
})
