import { LoginForm } from '@/components/portal/auth-forms'
import { AuthLayout } from '@/components/portal/auth-layout'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'

export const metadata = metadataFor(routes.login)

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Member portal"
      title={<>Welcome <em>back.</em></>}
      text="Sign in to view and update the details the church holds about you."
    >
      <LoginForm />
    </AuthLayout>
  )
}
