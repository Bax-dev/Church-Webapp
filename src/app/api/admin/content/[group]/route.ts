import { contentForm, contentGroups, checkGroup, type ContentGroup } from '@/config/content'
import { HttpError, clientIp, ok, requireAdmin, route } from '@/lib/server/api'
import { audit, diff } from '@/lib/server/audit'
import { getRawContent, saveContentGroup } from '@/lib/server/content'

const groupOf = async (params: Promise<{ group: string }>) => {
  const { group } = await params
  if (!contentGroups.includes(group as ContentGroup)) throw new HttpError(404, 'There is no such content group.')
  return group as ContentGroup
}

export const GET = route<{ group: string }>(async (request, { params }) => {
  await requireAdmin(request)
  const group = await groupOf(params)
  return ok((await getRawContent())[group])
})

/** Replaces one group (a page, or the shared sections). Field problems come back keyed by path, like "hero.title". */
export const PUT = route<{ group: string }>(async (request, { params }) => {
  const admin = await requireAdmin(request)
  const group = await groupOf(params)
  const body = await request.json().catch(() => {
    throw new HttpError(400, 'The request body must be JSON.')
  })
  const { value, problems } = checkGroup(group, body)
  if (Object.keys(problems).length) throw new HttpError(422, 'Please check the highlighted fields.', problems)

  const { before, after } = await saveContentGroup(group, value)
  const changed = Object.keys(diff(
    Object.fromEntries(Object.entries(before).map(([k, v]) => [k, JSON.stringify(v)])),
    Object.fromEntries(Object.entries(after).map(([k, v]) => [k, JSON.stringify(v)])),
  ).newValue)
  const sections = contentForm[group].sections as Record<string, { label: string }>
  await audit({
    actor: admin, action: 'content.update', ip: clientIp(request), oldValue: { [group]: before }, newValue: { [group]: after },
    detail: changed.length
      ? `${contentForm[group].label}: ${changed.map((key) => sections[key]?.label ?? key).join(', ')} updated`
      : `${contentForm[group].label}: saved with no changes`,
  })
  return ok(after)
})
