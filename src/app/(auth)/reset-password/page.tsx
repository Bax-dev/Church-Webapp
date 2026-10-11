import { LinkExpired, ResetPasswordForm } from '@/components/portal/auth-forms'
import { AuthLayout } from '@/components/portal/auth-layout'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'
import { peekLinkToken } from '@/lib/server/auth'

export const metadata = metadataFor(routes.resetPassword)

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams
  const valid = Boolean(token && (await peekLinkToken('reset', token)))
  return (
    <AuthLayout
      eyebrow="Account help"
      title={<>Choose a new <em>password.</em></>}
      text="Reset links work once and expire after an hour. Setting a new password signs you out on your other devices."
    >
      {valid ? <ResetPasswordForm token={token!} /> : <LinkExpired again={routes.forgotPassword.path} againLabel="Request a new reset link" />}
    </AuthLayout>
  )
}
