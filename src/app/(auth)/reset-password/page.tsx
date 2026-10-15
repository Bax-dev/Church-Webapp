import { LinkExpired, ResetPasswordForm } from '@/components/portal/auth-forms'
import { AuthLayout } from '@/components/portal/auth-layout'
import { routes } from '@/config/routes'
import { peekLinkToken } from '@/lib/server/auth'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.resetPassword)

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams
  const valid = Boolean(token && (await peekLinkToken('reset', token)))
  return (
    <AuthLayout page="resetPassword">
      {valid ? <ResetPasswordForm token={token!} /> : <LinkExpired missing={!token} again={routes.forgotPassword.path} againLabel="Request a new reset link" />}
    </AuthLayout>
  )
}
