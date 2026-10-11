/**
 * First-run data (PRD acceptance criterion 8): the first Super Admin, departments, districts, settings and the welcome popup.
 * Safe to run again: existing rows are left alone.
 *
 *   yarn db:seed            the essentials
 *   yarn db:seed --sample   also 24 sample members, for trying the admin tools locally (never in production)
 */
import { hash } from '@node-rs/argon2'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '../src/lib/server/db/schema'

const url = process.env.DATABASE_URL
if (!url) throw new Error('Set DATABASE_URL (see .env.example).')
const client = postgres(url, { max: 1 })
const db = drizzle(client, { schema })

// The PRD leaves the real lists open (§18 Q2); these are placeholders to rename or replace from the admin pages.
const departmentNames = ['Choir', "Men's Fellowship", "Women's Guild", 'Youth Fellowship', "Children's Ministry", 'Ushering', 'Evangelism', 'Media & Technical']
const districtNames = ['Lekki Phase 1', 'Ikate', 'Chevron', 'Ajah', 'Sangotedo', 'Awoyaya']

async function upsertLookups(table: typeof schema.departments | typeof schema.districts, names: string[]) {
  await db.insert(table).values(names.map((name) => ({ name }))).onConflictDoNothing()
  return db.select().from(table)
}

const departments = await upsertLookups(schema.departments, departmentNames)
const districts = await upsertLookups(schema.districts, districtNames)

await db.insert(schema.settings).values([
  { key: 'portal', value: { approval: 'manual' } },
  {
    key: 'announcement',
    value: {
      id: 'welcome-2026-10',
      enabled: true,
      title: 'You are warmly invited.',
      message: 'Whether this is your first visit or you have worshipped with us for years, we would love to see you this Sunday. Come as you are.',
      link: { label: 'Plan your visit', href: '/visit' },
      audience: 'everyone',
      startsOn: '2026-10-01',
      endsOn: '2026-12-31',
      pages: 'all',
      delaySeconds: 1.5,
    },
  },
]).onConflictDoNothing()

const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
const adminPassword = process.env.SEED_ADMIN_PASSWORD
if (adminEmail && adminPassword) {
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, adminEmail) })
  if (existing) {
    console.log(`Super Admin ${adminEmail} already exists; left unchanged.`)
  } else {
    await db.insert(schema.users).values({
      firstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'Church',
      lastName: process.env.SEED_ADMIN_LAST_NAME ?? 'Office',
      email: adminEmail,
      passwordHash: await hash(adminPassword),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      consentGivenAt: new Date(),
    })
    console.log(`Created Super Admin ${adminEmail}.`)
  }
} else {
  console.log('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set; no Super Admin created.')
}

if (process.argv.includes('--sample')) {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to add sample members in production.')
  type Seed = [first: string, last: string, gender: string, dob: string, marital: 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'DIVORCED' | 'SEPARATED', status: 'PENDING' | 'ACTIVE' | 'INACTIVE', dep: number, dis: number, joined: string]
  const seeds: Seed[] = [
    ['Adaeze', 'Okafor', 'Female', '1990-10-18', 'MARRIED', 'ACTIVE', 0, 0, '2024-02-11'],
    ['Tunde', 'Bakare', 'Male', '1985-03-02', 'MARRIED', 'ACTIVE', 1, 1, '2023-06-04'],
    ['Ngozi', 'Eze', 'Female', '1978-10-25', 'WIDOWED', 'ACTIVE', 2, 2, '2022-09-18'],
    ['Emeka', 'Nwosu', 'Male', '1999-11-07', 'SINGLE', 'ACTIVE', 3, 3, '2025-01-12'],
    ['Funmilayo', 'Adeyemi', 'Female', '1994-07-30', 'SINGLE', 'PENDING', 0, 4, '2026-10-02'],
    ['Ibrahim', 'Okonkwo', 'Male', '1982-12-14', 'MARRIED', 'ACTIVE', 6, 0, '2023-11-26'],
    ['Chiamaka', 'Obi', 'Female', '2001-10-21', 'SINGLE', 'ACTIVE', 3, 1, '2026-10-05'],
    ['Segun', 'Afolabi', 'Male', '1975-05-09', 'DIVORCED', 'INACTIVE', 5, 2, '2021-04-18'],
    ['Blessing', 'Udoh', 'Female', '1988-01-27', 'MARRIED', 'ACTIVE', 4, 3, '2024-08-25'],
    ['Kelechi', 'Ibe', 'Male', '1996-10-13', 'SINGLE', 'ACTIVE', 7, 4, '2025-05-11'],
    ['Folake', 'Ogunleye', 'Female', '1969-11-02', 'MARRIED', 'ACTIVE', 2, 0, '2020-03-08'],
    ['Chinedu', 'Agu', 'Male', '1992-08-19', 'MARRIED', 'ACTIVE', 1, 1, '2024-12-01'],
    ['Yetunde', 'Lawal', 'Female', '1987-04-04', 'SEPARATED', 'ACTIVE', 5, 2, '2023-02-19'],
    ['Oluwaseun', 'Martins', 'Male', '2004-10-29', 'SINGLE', 'PENDING', 3, 3, '2026-10-08'],
    ['Amaka', 'Chukwu', 'Female', '1980-02-15', 'MARRIED', 'ACTIVE', 4, 4, '2022-07-10'],
    ['Babatunde', 'Coker', 'Male', '1958-06-22', 'WIDOWED', 'ACTIVE', 1, 0, '2019-10-06'],
    ['Ifeoma', 'Nnamdi', 'Female', '1997-09-08', 'SINGLE', 'ACTIVE', 0, 1, '2025-09-14'],
    ['Victor', 'Etim', 'Male', '1991-11-30', 'MARRIED', 'ACTIVE', 6, 2, '2024-04-21'],
    ['Grace', 'Akpan', 'Female', '1984-12-03', 'MARRIED', 'INACTIVE', 2, 3, '2021-12-12'],
    ['Daniel', 'Oyelaran', 'Male', '2000-03-17', 'SINGLE', 'ACTIVE', 7, 4, '2026-03-29'],
    ['Esther', 'Babalola', 'Female', '1973-10-15', 'MARRIED', 'ACTIVE', 2, 0, '2020-11-15'],
    ['Michael', 'Ojo', 'Male', '1989-07-11', 'MARRIED', 'ACTIVE', 1, 1, '2023-08-13'],
    ['Joy', 'Ekpo', 'Female', '1995-06-26', 'SINGLE', 'ACTIVE', 4, 2, '2026-07-19'],
    ['Samuel', 'Adewale', 'Male', '1966-01-09', 'MARRIED', 'ACTIVE', 5, 3, '2019-05-26'],
  ]
  const byName = (list: { id: string; name: string }[], name: string) => list.find((item) => item.name === name)!.id
  // Every sample member can sign in with this password, so the member area can be tried as well.
  const passwordHash = await hash('Member1234')
  await db.insert(schema.users).values(seeds.map(([firstName, lastName, gender, dateOfBirth, maritalStatus, status, dep, dis, joined], index) => ({
    firstName, lastName, gender, dateOfBirth, maritalStatus, status,
    email: `${firstName}.${lastName}@example.com`.toLowerCase(),
    phone: `+234 803 ${110 + index * 31} ${String(2000 + index * 263).slice(-4)}`,
    addressLine: `${12 + index} Admiralty Way`,
    city: districtNames[dis],
    state: 'Lagos',
    passwordHash,
    emailVerified: status !== 'PENDING',
    consentGivenAt: new Date(`${joined}T10:00:00Z`),
    departmentId: byName(departments, departmentNames[dep]),
    districtId: byName(districts, districtNames[dis]),
    createdAt: new Date(`${joined}T10:00:00Z`),
  }))).onConflictDoNothing()
  console.log(`Sample members added (password for each: Member1234). Departments: ${departments.length}, districts: ${districts.length}.`)
}

const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(schema.users)
console.log(`Seed complete. ${total} users in the database.`)
await client.end()
