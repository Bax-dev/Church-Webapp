import { SignupForm } from '@/components/portal/auth-forms'
import { AuthLayout } from '@/components/portal/auth-layout'
import { routes } from '@/config/routes'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.signup)

export default function SignupPage() {
  return (
    <AuthLayout page="signup">
      <SignupForm />
    </AuthLayout>
  )
}
