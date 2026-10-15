import { LoginForm } from '@/components/portal/auth-forms'
import { AuthLayout } from '@/components/portal/auth-layout'
import { routes } from '@/config/routes'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.login)

export default function LoginPage() {
  return (
    <AuthLayout page="login">
      <LoginForm />
    </AuthLayout>
  )
}
