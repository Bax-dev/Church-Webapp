import { ok, route } from '@/lib/server/api'
import { getAnnouncement } from '@/lib/server/settings'

/** The site popup, read by every page load. `null` when none is published. */
export const GET = route(async () => ok(await getAnnouncement() ?? null, { headers: { 'Cache-Control': 'no-store' } }))
