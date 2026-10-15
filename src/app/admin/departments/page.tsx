import { LookupManager } from '@/components/portal/admin-tools'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { routes } from '@/config/routes'
import { listLookups, lookupCounts } from '@/lib/server/members'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.adminDepartments)

export default async function AdminDepartmentsPage() {
  const [items, counts] = await Promise.all([listLookups('department'), lookupCounts('department')])
  return (
    <>
      <PortalHeading
        eyebrow="Super Admin"
        title="Departments"
        text="Members choose from the active departments when they edit their profile. Deactivate one to hide it without losing its history."
      />
      <Panel><LookupManager kind="department" initial={items.map((item) => ({ ...item, members: counts[item.id] ?? 0 }))} /></Panel>
    </>
  )
}
