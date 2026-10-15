import { z } from 'zod'

import { lookupName, maritalStatusLabels, monthNames, statusLabels, type MaritalStatus, type Status } from '@/config/portal'
import { clientIp, parse, requireAdmin, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { getContent } from '@/lib/server/content'
import { toCsv, toPdf, toXlsx } from '@/lib/server/export'
import { allMembers, listLookups } from '@/lib/server/members'
import { memberQuerySchema } from '@/lib/schemas'

const exportSchema = memberQuerySchema.omit({ page: true, limit: true }).extend({ format: z.enum(['csv', 'xlsx', 'pdf']).default('csv') })

const types = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
}

/** Downloads the members matching the same filters as the table (PRD A-08). Every export is audited. */
export const GET = route(async (request) => {
  const admin = await requireAdmin(request)
  const { format, ...query } = parse(exportSchema, Object.fromEntries([...request.nextUrl.searchParams].filter(([, value]) => value !== '')))
  const [members, departments, districts, content] = await Promise.all([allMembers(query), listLookups('department'), listLookups('district'), getContent()])
  const church = content.site.identity.name

  const filters = Object.entries(query).filter(([key, value]) => value !== undefined && key !== 'sort' && key !== 'dir')
  // In words, e.g. "Department: Choir · Status: Active", for the PDF heading and the audit log.
  const describe = ([key, value]: [string, unknown]) => {
    if (key === 'department') return `Department: ${lookupName(departments, String(value))}`
    if (key === 'district') return `District: ${lookupName(districts, String(value))}`
    if (key === 'status') return `Status: ${statusLabels[value as Status]}`
    if (key === 'marital') return `Marital status: ${maritalStatusLabels[value as MaritalStatus]}`
    if (key === 'birthMonth') return `Birthday month: ${monthNames[Number(value) - 1]}`
    if (key === 'q') return `Search: “${value}”`
    return `${key}: ${value}`
  }
  const filterText = filters.length ? filters.map(describe).join(' · ') : 'all members'
  const body = format === 'csv' ? toCsv(members, departments, districts)
    : format === 'xlsx' ? await toXlsx(members, departments, districts, church)
    : await toPdf(members, departments, districts, filterText, church)

  await audit({ actor: admin, action: `export.${format}`, detail: `Exported ${members.length} ${members.length === 1 ? 'member' : 'members'} (${filterText})`, newValue: Object.fromEntries(filters), ip: clientIp(request) })

  const stamp = new Date().toISOString().slice(0, 10)
  return new Response(new Uint8Array(typeof body === 'string' ? Buffer.from(body) : body), {
    headers: {
      'Content-Type': types[format],
      'Content-Disposition': `attachment; filename="members-${stamp}.${format}"`,
      'Cache-Control': 'no-store',
    },
  })
})
