import { NextResponse } from 'next/server'

import { ok, route } from '@/lib/server/api'
import { REFRESH_COOKIE, clearSessionCookies, rotateTokens, setSessionCookies } from '@/lib/server/auth'

/** Rotates the token pair (PRD §5). The browser calls this when an API request answers 401. */
export const POST = route(async (request) => {
  const rotated = await rotateTokens(request.cookies.get(REFRESH_COOKIE)?.value)
  if (!rotated) {
    const response = NextResponse.json({ success: false, error: { message: 'Your session has ended. Please sign in again.' } }, { status: 401 })
    clearSessionCookies(response.cookies)
    return response
  }
  const response = ok({ role: rotated.role })
  setSessionCookies(response.cookies, rotated)
  return response
})
