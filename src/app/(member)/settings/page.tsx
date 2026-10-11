import { ChangePasswordForm, DeleteRequest } from '@/components/portal/member-forms'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'
import { requireMember } from '@/lib/server/session'

export const metadata = metadataFor(routes.settings)

export default async function SettingsPage() {
  const me = await requireMember()
  return (
    <>
      <PortalHeading eyebrow="Settings" title="Account settings" />
      <Panel title="Change password"><ChangePasswordForm /></Panel>
      <Panel title="Your data" className="panel-danger">
        <p className="panel-text">
          You can ask for a copy of your details, a correction, or for your account and personal data to be deleted, as the Nigeria Data Protection Act 2023 allows.
        </p>
        <DeleteRequest requestedAt={me.deletionRequestedAt?.toISOString() ?? null} />
      </Panel>
    </>
  )
}
