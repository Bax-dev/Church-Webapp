import { PastorEditor } from '@/components/portal/pastor-editor'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { routes } from '@/config/routes'
import { getPastors } from '@/lib/server/pastors'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.adminPastors)

export default async function AdminPastorsPage() {
  return (
    <>
      <PortalHeading
        eyebrow="Super Admin"
        title="Pastors"
        text="The pastors shown on the About page, in this order. Add, edit, reorder or remove them, then save to update the site."
      />
      <Panel><PastorEditor initial={await getPastors()} /></Panel>
    </>
  )
}
