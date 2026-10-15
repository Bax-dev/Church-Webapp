import { LinkExpired, SetPasswordForm } from '@/components/portal/auth-forms'
import { AuthLayout } from '@/components/portal/auth-layout'
import { routes } from '@/config/routes'
import { peekLinkToken } from '@/lib/server/auth'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.setPassword)

type Props = { searchParams: Promise<{ token?: string }> }

/** Where the emailed sign-up link lands: opening it confirms the address, and the password finishes the account. */
export default async function SetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams
  const valid = Boolean(token && (await peekLinkToken('setup', token)))
  return (
    <AuthLayout page="setPassword">
      {valid ? <SetPasswordForm token={token!} /> : <LinkExpired missing={!token} again={routes.signup.path} againLabel="Request a new sign-up link" />}
    </AuthLayout>
  )
}
