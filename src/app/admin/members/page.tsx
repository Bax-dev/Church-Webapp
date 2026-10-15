import { AddMemberForm, MembersTable, ShareSignupLink } from '@/components/portal/admin-tools'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { routes } from '@/config/routes'
import { listLookups } from '@/lib/server/members'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.adminMembers)

export default async function AdminMembersPage() {
  const [departments, districts] = await Promise.all([listLookups('department'), listLookups('district')])
  return (
    <>
      <PortalHeading
        eyebrow="Super Admin"
        title="Members"
        text="Search, filter and export the member directory. To add members, share the sign-up link: they enter their name and email, then set a password from the link we email them."
        actions={<ShareSignupLink />}
      />
      <Panel><AddMemberForm /></Panel>
      <Panel><MembersTable departments={departments} districts={districts} /></Panel>
    </>
  )
}
