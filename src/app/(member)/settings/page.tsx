import { ChangePasswordForm, DeleteRequest } from '@/components/portal/member-forms'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { routes } from '@/config/routes'
import { getContent } from '@/lib/server/content'
import { requireMember } from '@/lib/server/session'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.settings)

export default async function SettingsPage() {
  const [me, { portal }] = await Promise.all([requireMember(), getContent()])
  return (
    <>
      <PortalHeading eyebrow={portal.settings.eyebrow} title={portal.settings.title} />
      <Panel title="Change password"><ChangePasswordForm /></Panel>
      <Panel title="Your data" className="panel-danger">
        <p className="panel-text">{portal.settings.dataText}</p>
        <DeleteRequest requestedAt={me.deletionRequestedAt?.toISOString() ?? null} />
      </Panel>
    </>
  )
}
