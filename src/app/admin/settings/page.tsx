import { SettingsForm, SiteWidgetsForm } from '@/components/portal/admin-tools'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { routes } from '@/config/routes'
import { getPortalSettings, getSiteWidgets } from '@/lib/server/settings'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.adminSettings)

export default async function AdminSettingsPage() {
  const [settings, widgets] = await Promise.all([getPortalSettings(), getSiteWidgets()])
  return (
    <>
      <PortalHeading eyebrow="Super Admin" title="Portal settings" />
      <Panel><SettingsForm initial={settings.approval} /></Panel>
      <Panel title="WhatsApp button & top banner"><SiteWidgetsForm initial={widgets} /></Panel>
    </>
  )
}
