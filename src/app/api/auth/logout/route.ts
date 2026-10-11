import { ok, route } from '@/lib/server/api'
import { ACCESS_COOKIE, REFRESH_COOKIE, clearSessionCookies, revokeTokens } from '@/lib/server/auth'

/** Revokes this device's tokens immediately and clears the cookies. Safe to call when already signed out. */
export const POST = route(async (request) => {
  await revokeTokens(request.cookies.get(ACCESS_COOKIE)?.value, request.cookies.get(REFRESH_COOKIE)?.value)
  const response = ok({})
  clearSessionCookies(response.cookies)
  return response
})
