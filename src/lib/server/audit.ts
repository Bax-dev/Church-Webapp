/** Audit trail (PRD A-11): who did what to whom, when, from where, with the old and new values. */
import { db, schema } from '@/lib/server/db'
import type { UserRow } from '@/lib/server/db/schema'

type Person = Pick<UserRow, 'id' | 'firstName' | 'lastName'>
const name = (p: Person) => `${p.firstName} ${p.lastName}`

export async function audit(entry: {
  actor: Person | null
  target?: Person | null
  action: string
  detail: string
  oldValue?: unknown
  newValue?: unknown
  ip?: string
}) {
  await db.insert(schema.auditLogs).values({
    actorId: entry.actor?.id ?? null,
    actorName: entry.actor ? name(entry.actor) : 'System',
    targetId: entry.target?.id ?? null,
    targetName: entry.target ? name(entry.target) : null,
    action: entry.action,
    detail: entry.detail,
    oldValue: entry.oldValue ?? null,
    newValue: entry.newValue ?? null,
    ip: entry.ip ?? null,
  })
}

const labels: Record<string, string> = {
  firstName: 'first name', lastName: 'last name', email: 'email', pendingEmail: 'new email', phone: 'phone',
  dateOfBirth: 'date of birth', gender: 'gender', maritalStatus: 'marital status', addressLine: 'address', city: 'city',
  state: 'state', departmentId: 'department', districtId: 'district', status: 'status', role: 'role',
}

/** The fields whose value changes, as old/new objects plus a readable summary like "Phone, district changed". */
export function diff<T extends Record<string, unknown>>(before: T, after: Partial<T>) {
  const oldValue: Record<string, unknown> = {}
  const newValue: Record<string, unknown> = {}
  for (const key of Object.keys(after)) {
    if (after[key] === undefined || (after[key] ?? null) === (before[key] ?? null)) continue
    oldValue[key] = before[key] ?? null
    newValue[key] = after[key] ?? null
  }
  const keys = Object.keys(newValue)
  const words = keys.map((key) => labels[key] ?? key)
  const detail = words.length ? `${words.join(', ').replace(/^./, (c) => c.toUpperCase())} changed` : 'No changes'
  return { oldValue, newValue, keys, detail }
}
