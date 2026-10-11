import { ok, route } from '@/lib/server/api'
import { listLookups } from '@/lib/server/members'

/** Active departments and districts for the profile dropdowns. */
export const GET = route(async () => {
  const [departments, districts] = await Promise.all([listLookups('department', true), listLookups('district', true)])
  return ok({ departments, districts })
})
