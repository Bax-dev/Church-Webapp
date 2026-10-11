import { eq } from 'drizzle-orm'

import { HttpError, clientIp, ok, readJson, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { createLinkToken, rateLimit } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import { emails } from '@/lib/server/email'
import { invalidateStats } from '@/lib/server/members'
import { signupSchema } from '@/lib/schemas'

const SETUP_TTL = 24 * 3600

/** Creates a pending account and emails the sign-up link (PRD M-01, M-02). Same answer whether or not the email is known. */
export const POST = route(async (request) => {
  const ip = clientIp(request)
  const limit = await rateLimit(`rl:signup:${ip}`, 10, 3600)
  if (!limit.ok) throw new HttpError(429, 'Too many sign-ups from this connection. Please try again later.', undefined, { 'Retry-After': String(limit.retryAfter) })

  const input = await readJson(request, signupSchema)
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, input.email) })

  if (existing?.passwordHash) {
    await emails.alreadyRegistered(existing.email, existing.firstName)
  } else {
    // A repeat sign-up before the password is set just sends a fresh link.
    const [user] = existing
      ? await db.update(schema.users).set({ firstName: input.firstName, lastName: input.lastName, consentGivenAt: new Date() })
        .where(eq(schema.users.id, existing.id)).returning()
      : await db.insert(schema.users).values({ firstName: input.firstName, lastName: input.lastName, email: input.email, consentGivenAt: new Date() }).returning()
    const token = await createLinkToken('setup', user.id, SETUP_TTL)
    await emails.signupLink(user.email, user.firstName, token)
    if (!existing) {
      await audit({ actor: user, target: user, action: 'auth.signup', detail: 'Account created; sign-up link emailed', ip })
      await invalidateStats()
    }
  }
  return ok({ email: input.email })
})
