/** Departments and districts share one set of handlers (PRD A-07). */
import { eq, sql } from 'drizzle-orm'

import { HttpError, clientIp, ok, readJson, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { db, schema } from '@/lib/server/db'
import { invalidateStats, listLookups, lookupCounts } from '@/lib/server/members'
import { lookupCreateSchema, lookupUpdateSchema } from '@/lib/schemas'

type Kind = 'department' | 'district'
const tableFor = (kind: Kind) => (kind === 'department' ? schema.departments : schema.districts)

async function assertUnique(kind: Kind, name: string, except?: string) {
  const table = tableFor(kind)
  const [clash] = await db.select({ id: table.id }).from(table).where(sql`lower(${table.name}) = lower(${name})`)
  if (clash && clash.id !== except) throw new HttpError(422, 'Please check the highlighted fields.', { name: `A ${kind} with that name already exists.` })
}

export function collectionHandlers(kind: Kind) {
  return {
    GET: route(async (request) => {
      await requireAdmin(request)
      const [items, counts] = await Promise.all([listLookups(kind), lookupCounts(kind)])
      return ok(items.map((item) => ({ ...item, members: counts[item.id] ?? 0 })))
    }),
    POST: route(async (request) => {
      const admin = await requireAdmin(request)
      const { name } = await readJson(request, lookupCreateSchema)
      await assertUnique(kind, name)
      const [item] = await db.insert(tableFor(kind)).values({ name }).returning()
      await audit({ actor: admin, action: `${kind}.create`, detail: `Added “${name}”`, newValue: item, ip: clientIp(request) })
      await invalidateStats()
      return ok({ ...item, members: 0 }, { status: 201 })
    }),
  }
}

export function itemHandlers(kind: Kind) {
  const table = tableFor(kind)
  const find = async (id: string) => {
    const [item] = await db.select().from(table).where(eq(table.id, id))
    if (!item) throw new HttpError(404, `That ${kind} does not exist.`)
    return item
  }
  return {
    PATCH: route<{ id: string }>(async (request, { params }) => {
      const admin = await requireAdmin(request)
      const item = await find((await params).id)
      const changes = await readJson(request, lookupUpdateSchema)
      if (changes.name) await assertUnique(kind, changes.name, item.id)
      const [updated] = await db.update(table).set(changes).where(eq(table.id, item.id)).returning()
      const detail = changes.name && changes.name !== item.name ? `Renamed “${item.name}” to “${changes.name}”`
        : changes.isActive === false ? `“${item.name}” marked inactive` : `“${item.name}” marked active`
      await audit({ actor: admin, action: `${kind}.update`, detail, oldValue: item, newValue: updated, ip: clientIp(request) })
      await invalidateStats()
      return ok({ ...updated, members: (await lookupCounts(kind))[item.id] ?? 0 })
    }),
    /** Only an unused entry can be deleted; one with members is deactivated instead, so their records keep it. */
    DELETE: route<{ id: string }>(async (request, { params }) => {
      const admin = await requireAdmin(request)
      const item = await find((await params).id)
      const used = (await lookupCounts(kind))[item.id] ?? 0
      if (used) throw new HttpError(409, `${used} ${used === 1 ? 'member is' : 'members are'} in “${item.name}”. Move them first, or deactivate it instead.`)
      await db.delete(table).where(eq(table.id, item.id))
      await audit({ actor: admin, action: `${kind}.delete`, detail: `Deleted “${item.name}”`, oldValue: item, ip: clientIp(request) })
      await invalidateStats()
      return ok({ id: item.id })
    }),
  }
}
