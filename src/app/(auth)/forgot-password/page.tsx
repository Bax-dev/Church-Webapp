import { ForgotPasswordForm } from '@/components/portal/auth-forms'
import { AuthLayout } from '@/components/portal/auth-layout'
import { routes } from '@/config/routes'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.forgotPassword)

export default function ForgotPasswordPage() {
  return (
    <AuthLayout page="forgotPassword">
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
