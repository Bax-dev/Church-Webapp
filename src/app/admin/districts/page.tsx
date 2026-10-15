import { LookupManager } from '@/components/portal/admin-tools'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { routes } from '@/config/routes'
import { listLookups, lookupCounts } from '@/lib/server/members'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.adminDistricts)

export default async function AdminDistrictsPage() {
  const [items, counts] = await Promise.all([listLookups('district'), lookupCounts('district')])
  return (
    <>
      <PortalHeading
        eyebrow="Super Admin"
        title="Districts"
        text="Members choose from the active districts when they edit their profile. Deactivate one to hide it without losing its history."
      />
      <Panel><LookupManager kind="district" initial={items.map((item) => ({ ...item, members: counts[item.id] ?? 0 }))} /></Panel>
    </>
  )
}
