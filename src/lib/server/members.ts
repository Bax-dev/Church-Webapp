/** Member queries shared by the API routes and the server-rendered portal pages. */
import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'

import type { AuditEntry, Lookup, Member, Page } from '@/config/portal'
import { lagosToday, upcomingBirthdays } from '@/config/portal'
import type { MemberQuery } from '@/lib/schemas'
import { db, schema } from '@/lib/server/db'
import type { AuditRow, UserRow } from '@/lib/server/db/schema'
import { kv } from '@/lib/server/kv'

const { users, departments, districts, auditLogs } = schema
const iso = (date: Date | null) => (date ? date.toISOString() : null)

/** The public shape of a user: never includes the password hash or token bookkeeping. */
export function toMember(row: UserRow): Member {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    pendingEmail: row.pendingEmail,
    phone: row.phone,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    maritalStatus: row.maritalStatus,
    addressLine: row.addressLine,
    city: row.city,
    state: row.state,
    country: row.country,
    photoUrl: row.photoUrl,
    role: row.role,
    status: row.status,
    emailVerified: row.emailVerified,
    departmentId: row.departmentId,
    districtId: row.districtId,
    deletionRequestedAt: iso(row.deletionRequestedAt),
    lastLoginAt: iso(row.lastLoginAt),
    createdAt: row.createdAt.toISOString(),
  }
}

export function toAuditEntry(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    actor: row.actorName,
    target: row.targetName,
    targetId: row.targetId,
    action: row.action,
    detail: row.detail,
    ip: row.ip,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function getMember(id: string) {
  const row = await db.query.users.findFirst({ where: eq(users.id, id) })
  return row && toMember(row)
}

export async function listLookups(kind: 'department' | 'district', activeOnly = false): Promise<Lookup[]> {
  const table = kind === 'department' ? departments : districts
  return db.select().from(table).where(activeOnly ? eq(table.isActive, true) : undefined).orderBy(asc(table.name))
}

/** Members per department or district, keyed by id. */
export async function lookupCounts(kind: 'department' | 'district', onlyActiveMembers = false) {
  const column = kind === 'department' ? users.departmentId : users.districtId
  const rows = await db.select({ id: column, value: count() }).from(users)
    .where(onlyActiveMembers ? eq(users.status, 'ACTIVE') : undefined).groupBy(column)
  return Object.fromEntries(rows.filter((row) => row.id).map((row) => [row.id!, row.value])) as Record<string, number>
}

function memberFilters(query: Partial<MemberQuery>) {
  const where: SQL[] = []
  const q = query.q?.trim()
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
    const digits = q.replace(/\D/g, '')
    const match = [
      ilike(sql`${users.firstName} || ' ' || ${users.lastName}`, like),
      ilike(users.email, like),
    ]
    if (digits.length > 2) match.push(sql`regexp_replace(coalesce(${users.phone}, ''), '\\D', '', 'g') like ${`%${digits}%`}`)
    where.push(or(...match)!)
  }
  if (query.department) where.push(eq(users.departmentId, query.department))
  if (query.district) where.push(eq(users.districtId, query.district))
  if (query.marital) where.push(eq(users.maritalStatus, query.marital))
  if (query.status) where.push(eq(users.status, query.status))
  if (query.birthMonth) where.push(sql`extract(month from ${users.dateOfBirth}) = ${query.birthMonth}`)
  return where.length ? and(...where) : undefined
}

function memberOrder(query: Pick<MemberQuery, 'sort' | 'dir'>) {
  const dir = query.dir === 'desc' ? desc : asc
  if (query.sort === 'createdAt') return [dir(users.createdAt)]
  // Birthdays sort by month and day, so the list reads like a calendar rather than by age.
  if (query.sort === 'dateOfBirth') return [sql`${users.dateOfBirth} is null`, dir(sql`to_char(${users.dateOfBirth}, 'MM-DD')`), asc(users.lastName)]
  return [dir(users.lastName), dir(users.firstName)]
}

export async function listMembers(query: MemberQuery): Promise<Page<Member>> {
  const where = memberFilters(query)
  const [{ total }] = await db.select({ total: count() }).from(users).where(where)
  const pages = Math.max(1, Math.ceil(total / query.limit))
  const page = Math.min(query.page, pages)
  const rows = await db.select().from(users).where(where).orderBy(...memberOrder(query))
    .limit(query.limit).offset((page - 1) * query.limit)
  return { items: rows.map(toMember), total, page, pages }
}

/** Every matching member, for exports. */
export async function allMembers(query: Partial<MemberQuery>) {
  const rows = await db.select().from(users).where(memberFilters(query))
    .orderBy(...memberOrder({ sort: query.sort ?? 'name', dir: query.dir ?? 'asc' }))
  return rows.map(toMember)
}

export const STATS_CACHE_KEY = 'cache:admin:stats'
export const invalidateStats = () => kv.del(STATS_CACHE_KEY)

export type AdminStats = {
  total: number
  active: number
  pending: number
  newThisMonth: number
  byDepartment: { label: string; value: number }[]
  byDistrict: { label: string; value: number }[]
  birthdays: { id: string; name: string; dateOfBirth: string; inDays: number }[]
  awaiting: { id: string; name: string; createdAt: string }[]
  deletionRequests: { id: string; name: string; requestedAt: string }[]
}

/** Dashboard figures (PRD A-01), cached in the key store for five minutes and cleared whenever a member changes. */
export async function adminStats(): Promise<AdminStats> {
  const cached = await kv.get(STATS_CACHE_KEY)
  if (cached) return JSON.parse(cached) as AdminStats

  const monthStart = `${lagosToday().slice(0, 7)}-01`
  const [[totals], depCounts, disCounts, deps, dists, people] = await Promise.all([
    db.select({
      total: count(),
      active: sql<number>`count(*) filter (where ${users.status} = 'ACTIVE')`.mapWith(Number),
      pending: sql<number>`count(*) filter (where ${users.status} = 'PENDING')`.mapWith(Number),
      newThisMonth: sql<number>`count(*) filter (where (${users.createdAt} at time zone 'Africa/Lagos')::date >= ${monthStart}::date)`.mapWith(Number),
    }).from(users),
    lookupCounts('department'),
    lookupCounts('district'),
    listLookups('department'),
    listLookups('district'),
    db.select({
      id: users.id, firstName: users.firstName, lastName: users.lastName, dateOfBirth: users.dateOfBirth,
      status: users.status, createdAt: users.createdAt, deletionRequestedAt: users.deletionRequestedAt,
    }).from(users),
  ])

  const name = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`
  const stats: AdminStats = {
    ...totals,
    byDepartment: deps.map((d) => ({ label: d.name, value: depCounts[d.id] ?? 0 })),
    byDistrict: dists.map((d) => ({ label: d.name, value: disCounts[d.id] ?? 0 })),
    birthdays: upcomingBirthdays(people.filter((p) => p.status === 'ACTIVE')).slice(0, 6)
      .map(({ member, inDays }) => ({ id: member.id, name: name(member), dateOfBirth: member.dateOfBirth!, inDays })),
    awaiting: people.filter((p) => p.status === 'PENDING').sort((a, b) => +b.createdAt - +a.createdAt).slice(0, 10)
      .map((p) => ({ id: p.id, name: name(p), createdAt: p.createdAt.toISOString() })),
    deletionRequests: people.filter((p) => p.deletionRequestedAt)
      .map((p) => ({ id: p.id, name: name(p), requestedAt: p.deletionRequestedAt!.toISOString() })),
  }
  await kv.set(STATS_CACHE_KEY, JSON.stringify(stats), 300)
  return stats
}

/** The rows the Reports page groups (PRD A-09): active members only. */
export async function activeMembers() {
  const rows = await db.select().from(users).where(eq(users.status, 'ACTIVE')).orderBy(asc(users.lastName))
  return rows.map(toMember)
}

export async function auditPage({ page = 1, limit = 25, targetId }: { page?: number; limit?: number; targetId?: string }): Promise<Page<AuditEntry>> {
  const where = targetId ? eq(auditLogs.targetId, targetId) : undefined
  const [{ total }] = await db.select({ total: count() }).from(auditLogs).where(where)
  const pages = Math.max(1, Math.ceil(total / limit))
  const current = Math.min(Math.max(1, page), pages)
  const rows = await db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt))
    .limit(limit).offset((current - 1) * limit)
  return { items: rows.map(toAuditEntry), total, page: current, pages }
}

export async function listAdmins() {
  const rows = await db.select().from(users).where(eq(users.role, 'SUPER_ADMIN')).orderBy(asc(users.lastName))
  return rows.map(toMember)
}

/** How many active members share this department (for the member dashboard). */
export async function departmentPeers(departmentId: string | null) {
  if (!departmentId) return 0
  const [{ value }] = await db.select({ value: count() }).from(users)
    .where(and(eq(users.departmentId, departmentId), eq(users.status, 'ACTIVE')))
  return value
}
