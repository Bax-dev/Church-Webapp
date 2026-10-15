import { AdminManager } from '@/components/portal/admin-tools'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { routes } from '@/config/routes'
import { listAdmins } from '@/lib/server/members'
import { requireAdmin } from '@/lib/server/session'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.adminUsers)

export default async function AdminUsersPage() {
  const [me, admins] = await Promise.all([requireAdmin(), listAdmins()])
  return (
    <>
      <PortalHeading eyebrow="Super Admin" title="Administrators" text="Super Admins can see and change every member record. Keep this list short, and make sure there is always a backup." />
      <Panel>
        <AdminManager selfId={me.id} admins={admins} />
        <p className="field-hint">Two-step sign-in for administrators is planned for phase 3 of the portal.</p>
      </Panel>
    </>
  )
}
