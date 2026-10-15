import { z } from 'zod'

import { isLive } from '@/config/prayer'
import { ok, parse, route } from '@/lib/server/api'
import { guideByDate, getProgram, publicGuide } from '@/lib/server/prayer'

const querySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })

/**
 * Public: the prayer programme and tonight's guide (or the guide for ?date=yyyy-mm-dd).
 * When the programme is switched off this says only { enabled: false }.
 */
export const GET = route(async (request) => {
  const program = await getProgram()
  if (!program.enabled) return ok({ enabled: false }, { headers: { 'Cache-Control': 'no-store' } })
  const { date } = parse(querySchema, Object.fromEntries(request.nextUrl.searchParams))
  const guide = date ? await guideByDate(date).then((g) => (g?.published ? { guide: g, isToday: false } : undefined)) : await publicGuide()
  return ok({ enabled: true, program, live: isLive(program), guide: guide?.guide ?? null }, { headers: { 'Cache-Control': 'no-store' } })
})
