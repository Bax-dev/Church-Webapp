import { LookupManager } from '@/components/portal/admin-tools'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'
import { listLookups, lookupCounts } from '@/lib/server/members'

export const metadata = metadataFor(routes.adminDistricts)

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
