import { SignupForm } from '@/components/portal/auth-forms'
import { AuthLayout } from '@/components/portal/auth-layout'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'

export const metadata = metadataFor(routes.signup)

export default function SignupPage() {
  return (
    <AuthLayout
      eyebrow="Member portal"
      title={<>Join the <em>family</em> record.</>}
      text="Tell us your name and email address. We will email you a link to set your password, and you can add the rest of your details from your dashboard."
    >
      <SignupForm />
    </AuthLayout>
  )
}
