import { z } from 'zod'

import { parse, requireAdmin, route, ok } from '@/lib/server/api'
import { auditPage } from '@/lib/server/members'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  targetId: z.string().optional(),
})

/** Newest first, paginated (PRD A-11). The log is append-only: there is no way to edit or delete entries. */
export const GET = route(async (request) => {
  await requireAdmin(request)
  return ok(await auditPage(parse(querySchema, Object.fromEntries(request.nextUrl.searchParams))))
})
