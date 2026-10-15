/** Session helpers for server components and layouts. */
import { cache } from 'react'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { routes } from '@/config/routes'
import type { Viewer } from '@/config/session'
import { userFromAccessToken } from '@/lib/server/api'
import { ACCESS_COOKIE } from '@/lib/server/auth'

/** The signed-in, active user for this request (once per render), or undefined. The proxy has already refreshed an expired token. */
export const currentUser = cache(async () => userFromAccessToken((await cookies()).get(ACCESS_COOKIE)?.value))

export async function getViewer(): Promise<Viewer> {
  const user = await currentUser()
  return user ? { id: user.id, role: user.role, firstName: user.firstName, lastName: user.lastName, photoUrl: user.photoUrl } : null
}

export async function requireMember() {
  const user = await currentUser()
  if (!user) redirect(`${routes.login.path}/`)
  return user
}

/** Members who wander into /admin get a 404 rather than a hint that the area exists. */
export async function requireAdmin() {
  const user = await requireMember()
  if (user.role !== 'SUPER_ADMIN') notFound()
  return user
}
