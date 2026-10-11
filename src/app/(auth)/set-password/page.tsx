import { LinkExpired, SetPasswordForm } from '@/components/portal/auth-forms'
import { AuthLayout } from '@/components/portal/auth-layout'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'
import { peekLinkToken } from '@/lib/server/auth'

export const metadata = metadataFor(routes.setPassword)

type Props = { searchParams: Promise<{ token?: string }> }

/** Where the emailed sign-up link lands: opening it confirms the address, and the password finishes the account. */
export default async function SetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams
  const valid = Boolean(token && (await peekLinkToken('setup', token)))
  return (
    <AuthLayout
      eyebrow="Last step"
      title={<>Choose your <em>password.</em></>}
      text="Your email address is confirmed once you set a password. Then your account is ready, or ready for the church office to approve."
    >
      {valid ? <SetPasswordForm token={token!} /> : <LinkExpired again={routes.signup.path} againLabel="Request a new sign-up link" />}
    </AuthLayout>
  )
}
