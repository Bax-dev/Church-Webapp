/**
 * Shapes, labels and formatting shared by the member portal's pages, forms and API (PRD §6, §7).
 * The data itself lives in PostgreSQL; see src/lib/server.
 */

export type Role = 'MEMBER' | 'SUPER_ADMIN'
export type Status = 'PENDING' | 'ACTIVE' | 'INACTIVE'
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'DIVORCED' | 'SEPARATED'

export type Lookup = { id: string; name: string; isActive: boolean }

/** A member record as the API returns it. Everything after sign-up is optional until the member fills it in. */
export type Member = {
  id: string
  firstName: string
  lastName: string
  email: string
  pendingEmail: string | null
  phone: string | null
  /** ISO date, yyyy-mm-dd */
  dateOfBirth: string | null
  gender: string | null
  maritalStatus: MaritalStatus | null
  addressLine: string | null
  city: string | null
  state: string | null
  country: string
  photoUrl: string | null
  role: Role
  status: Status
  emailVerified: boolean
  departmentId: string | null
  districtId: string | null
  /** ISO timestamps */
  deletionRequestedAt: string | null
  lastLoginAt: string | null
  createdAt: string
}

export type AuditEntry = {
  id: string
  actor: string
  target: string | null
  targetId: string | null
  action: string
  detail: string
  ip: string | null
  /** ISO timestamp */
  createdAt: string
}

export type Page<T> = { items: T[]; total: number; page: number; pages: number }

export const maritalStatusLabels: Record<MaritalStatus, string> = {
  SINGLE: 'Single',
  MARRIED: 'Married',
  WIDOWED: 'Widowed',
  DIVORCED: 'Divorced',
  SEPARATED: 'Separated',
}

export const statusLabels: Record<Status, string> = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

export const roleLabels: Record<Role, string> = {
  MEMBER: 'Member',
  SUPER_ADMIN: 'Super Admin',
}

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Fields the dashboard counts towards "profile complete". */
export const profileFields = ['phone', 'dateOfBirth', 'maritalStatus', 'addressLine', 'city', 'departmentId', 'districtId'] as const

/** Who is allowed to choose the approval mode for new sign-ups (PRD A-12). */
export type ApprovalMode = 'auto' | 'manual'
export type PortalSettings = { approval: ApprovalMode }

export const lookupName = (list: Lookup[], id?: string | null) => list.find((item) => item.id === id)?.name ?? '—'
export const fullName = (member: Pick<Member, 'firstName' | 'lastName'>) => `${member.firstName} ${member.lastName}`
export const initials = (member: Pick<Member, 'firstName' | 'lastName'>) => `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase()

export function formatDate(iso: string | null | undefined, withYear = true) {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${monthNames[m - 1].slice(0, 3)}${withYear ? ` ${y}` : ''}`
}

/** Timestamps are shown in Lagos time whatever the server's or viewer's zone, so the log reads the same everywhere. */
export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${formatDate(`${get('year')}-${get('month')}-${get('day')}`)}, ${get('hour')}:${get('minute')}`
}

/** Today's date in Lagos as yyyy-mm-dd. */
export function lagosToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(now)
}

export function birthMonth(member: Pick<Member, 'dateOfBirth'>) {
  return member.dateOfBirth ? Number(member.dateOfBirth.slice(5, 7)) : 0
}

/** Members whose birthday falls within the next `days` days of `today` (yyyy-mm-dd), soonest first. */
export function upcomingBirthdays<T extends Pick<Member, 'dateOfBirth'>>(list: T[], today = lagosToday(), days = 30) {
  const [year, month, day] = today.split('-').map(Number)
  const start = Date.UTC(year, month - 1, day)
  return list
    .filter((member) => member.dateOfBirth)
    .map((member) => {
      const [, m, d] = member.dateOfBirth!.split('-').map(Number)
      let next = Date.UTC(year, m - 1, d)
      if (next < start) next = Date.UTC(year + 1, m - 1, d)
      return { member, inDays: Math.round((next - start) / 86_400_000) }
    })
    .filter((entry) => entry.inDays <= days)
    .sort((a, b) => a.inDays - b.inDays)
}
