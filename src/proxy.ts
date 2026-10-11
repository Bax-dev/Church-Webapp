/**
 * Runs before every page and admin API request (PRD §4 middleware.ts, renamed proxy.ts in Next 16).
 * - Pages: an expired access token is refreshed here, so server components always see a current session.
 * - Member and admin pages need a session; sign-in pages send a signed-in visitor to their dashboard.
 * - /api/admin answers 401/403 early. Every handler still re-checks the role itself.
 */
import { NextResponse, type NextRequest } from 'next/server'

import { routes } from '@/config/routes'
import { ACCESS_COOKIE, REFRESH_COOKIE, clearSessionCookies, currentRole, rotateTokens, setSessionCookies, verifyAccess } from '@/lib/server/auth'

const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)
const MEMBER_AREA = [routes.dashboard.path, routes.profile.path, routes.settings.path]
const GUEST_ONLY = [routes.login.path, routes.signup.path, routes.forgotPassword.path]

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/\/$/, '') || '/'

  if (under(path, '/api/admin')) {
    const claims = await verifyAccess(request.cookies.get(ACCESS_COOKIE)?.value)
    if (!claims) return NextResponse.json({ success: false, error: { message: 'Please sign in again.' } }, { status: 401 })
    // The token's role can be up to 15 minutes old, so a member just made a Super Admin still carries MEMBER: confirm with the database before refusing.
    if (claims.role !== 'SUPER_ADMIN' && (await currentRole(claims.sub)) !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: { message: 'Only Super Admins can do that.' } }, { status: 403 })
    }
    return NextResponse.next()
  }

  let claims: { role: string } | undefined = await verifyAccess(request.cookies.get(ACCESS_COOKIE)?.value)
  let refreshed: Awaited<ReturnType<typeof rotateTokens>>
  let expired = false
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  if (!claims && refreshToken) {
    refreshed = await rotateTokens(refreshToken)
    if (refreshed) {
      claims = { role: refreshed.role }
      // Hand the new token to this render as well as to the browser.
      request.cookies.set(ACCESS_COOKIE, refreshed.access)
      request.cookies.set(REFRESH_COOKIE, refreshed.refresh)
    } else {
      expired = true
    }
  }

  const finish = (response: NextResponse) => {
    if (refreshed) setSessionCookies(response.cookies, refreshed)
    else if (expired) clearSessionCookies(response.cookies)
    return response
  }
  const redirect = (to: string) => finish(NextResponse.redirect(new URL(to, request.url)))

  const needsSession = MEMBER_AREA.some((prefix) => under(path, prefix)) || under(path, routes.admin.path)
  if (needsSession && !claims) return redirect(`${routes.login.path}/?next=${encodeURIComponent(path)}`)
  if (claims && GUEST_ONLY.some((prefix) => under(path, prefix))) {
    return redirect(`${claims.role === 'SUPER_ADMIN' ? routes.admin.path : routes.dashboard.path}/`)
  }

  return finish(NextResponse.next({ request: { headers: request.headers } }))
}

export const config = {
  // Pages and /api/admin; not static files, images, or the other API routes (those refresh from the browser).
  matcher: ['/api/admin/:path*', '/((?!api|_next/static|_next/image|.*\\.[\\w]+$).*)'],
}
