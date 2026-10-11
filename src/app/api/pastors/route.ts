import { ok, route } from '@/lib/server/api'
import { getPastors } from '@/lib/server/pastors'

/** The pastors shown on the About page, in display order. Public. */
export const GET = route(async () => ok(await getPastors()))
