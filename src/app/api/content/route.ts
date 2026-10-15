import { ok, route } from '@/lib/server/api'
import { getContent } from '@/lib/server/content'

/** Every public text and image, as the pages show it. Public. */
export const GET = route(async () => ok(await getContent()))
