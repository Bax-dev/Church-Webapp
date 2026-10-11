import { SettingsForm } from '@/components/portal/admin-tools'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'
import { getPortalSettings } from '@/lib/server/settings'

export const metadata = metadataFor(routes.adminSettings)

export default async function AdminSettingsPage() {
  const settings = await getPortalSettings()
  return (
    <>
      <PortalHeading eyebrow="Super Admin" title="Portal settings" />
      <Panel><SettingsForm initial={settings.approval} /></Panel>
    </>
  )
}
