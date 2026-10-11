import { eq } from 'drizzle-orm'

import { ok, readJson, route } from '@/lib/server/api'
import { createLinkToken, rateLimit } from '@/lib/server/auth'
import { db, schema } from '@/lib/server/db'
import { emails } from '@/lib/server/email'
import { forgotPasswordSchema } from '@/lib/schemas'

/** PRD M-04. Always the same answer, so the form cannot reveal who has an account. Three emails per hour per address. */
export const POST = route(async (request) => {
  const { email } = await readJson(request, forgotPasswordSchema)
  const limit = await rateLimit(`rl:reset:${email}`, 3, 3600)
  const user = limit.ok ? await db.query.users.findFirst({ where: eq(schema.users.email, email) }) : undefined

  if (user && user.status !== 'INACTIVE') {
    // Someone who never finished signing up gets their sign-up link again instead.
    if (user.passwordHash) await emails.resetLink(user.email, user.firstName, await createLinkToken('reset', user.id, 3600))
    else await emails.signupLink(user.email, user.firstName, await createLinkToken('setup', user.id, 24 * 3600))
  }
  return ok({})
})
