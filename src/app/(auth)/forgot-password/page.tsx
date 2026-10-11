import { ForgotPasswordForm } from '@/components/portal/auth-forms'
import { AuthLayout } from '@/components/portal/auth-layout'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'

export const metadata = metadataFor(routes.forgotPassword)

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Account help"
      title={<>Forgot your <em>password?</em></>}
      text="Enter the email address you signed up with and we will send you a link to choose a new one."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
