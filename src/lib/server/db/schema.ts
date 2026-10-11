/** PostgreSQL schema (PRD §7). Migrations are generated from this file with `yarn db:generate`. */
import { sql } from 'drizzle-orm'
import { boolean, date, index, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['MEMBER', 'SUPER_ADMIN'])
export const statusEnum = pgEnum('status', ['PENDING', 'ACTIVE', 'INACTIVE'])
export const maritalStatusEnum = pgEnum('marital_status', ['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED', 'SEPARATED'])

const id = () => text('id').primaryKey().default(sql`gen_random_uuid()::text`)
const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' })

export const departments = pgTable('departments', {
  id: id(),
  name: text('name').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
})

export const districts = pgTable('districts', {
  id: id(),
  name: text('name').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
})

// Sign-up collects only name and email (PRD M-01), so the rest of the profile is nullable until the member fills it in.
export const users = pgTable('users', {
  id: id(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  /** A new address waiting for verification (PRD M-08); `email` keeps working until it is confirmed. */
  pendingEmail: text('pending_email'),
  phone: text('phone'),
  passwordHash: text('password_hash'),
  dateOfBirth: date('date_of_birth', { mode: 'string' }),
  gender: text('gender'),
  maritalStatus: maritalStatusEnum('marital_status'),
  addressLine: text('address_line'),
  city: text('city'),
  state: text('state'),
  country: text('country').notNull().default('Nigeria'),
  photoUrl: text('photo_url'),
  role: roleEnum('role').notNull().default('MEMBER'),
  status: statusEnum('status').notNull().default('PENDING'),
  emailVerified: boolean('email_verified').notNull().default(false),
  consentGivenAt: at('consent_given_at'),
  deletionRequestedAt: at('deletion_requested_at'),
  lastLoginAt: at('last_login_at'),
  /** Access tokens issued before this instant are rejected (password change, reset, deactivation). */
  tokensValidAfter: at('tokens_valid_after'),
  departmentId: text('department_id').references(() => departments.id, { onDelete: 'set null' }),
  districtId: text('district_id').references(() => districts.id, { onDelete: 'set null' }),
  createdAt: at('created_at').notNull().defaultNow(),
  updatedAt: at('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index('users_name_idx').on(t.lastName, t.firstName),
  index('users_department_idx').on(t.departmentId),
  index('users_district_idx').on(t.districtId),
  index('users_status_idx').on(t.status),
])

// Names are copied in so the log still reads correctly after a member is deleted (the history is kept).
export const auditLogs = pgTable('audit_logs', {
  id: id(),
  actorId: text('actor_id'),
  actorName: text('actor_name').notNull(),
  targetId: text('target_id').references(() => users.id, { onDelete: 'set null' }),
  targetName: text('target_name'),
  action: text('action').notNull(),
  detail: text('detail').notNull().default(''),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  ip: text('ip'),
  createdAt: at('created_at').notNull().defaultNow(),
}, (t) => [
  index('audit_actor_idx').on(t.actorId),
  index('audit_target_idx').on(t.targetId),
  index('audit_created_idx').on(t.createdAt),
])

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
})

export type UserRow = typeof users.$inferSelect
export type LookupRow = typeof departments.$inferSelect
export type AuditRow = typeof auditLogs.$inferSelect
