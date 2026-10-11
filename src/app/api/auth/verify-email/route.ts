import { and, eq, ne } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { routes } from '@/config/routes'
import { clientIp, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { consumeLinkToken } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import { env } from '@/lib/server/env'

/** The link in the "confirm your new email" message (PRD M-08). Swaps the address in, then lands on the profile. */
export const GET = route(async (request) => {
  const back = (result: string) => NextResponse.redirect(`${env.appUrl}${routes.profile.path}/?email=${result}`)
  const token = request.nextUrl.searchParams.get('token')
  const raw = token && await consumeLinkToken('verify-email', token)
  if (!raw) return back('expired')

  const { userId, email } = JSON.parse(raw) as { userId: string; email: string }
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) })
  if (!user || user.pendingEmail !== email) return back('expired')
  const taken = await db.query.users.findFirst({ where: and(eq(schema.users.email, email), ne(schema.users.id, userId)) })
  if (taken) return back('taken')

  await db.update(schema.users).set({ email, pendingEmail: null, emailVerified: true }).where(eq(schema.users.id, userId))
  await audit({ actor: user, target: user, action: 'profile.email_verified', detail: 'Email changed', oldValue: { email: user.email }, newValue: { email }, ip: clientIp(request) })
  return back('verified')
})
