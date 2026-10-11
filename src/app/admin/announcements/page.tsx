import { AnnouncementEditor } from '@/components/portal/announcement-editor'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'
import { getAnnouncement } from '@/lib/server/settings'

export const metadata = metadataFor(routes.adminAnnouncements)

export default async function AnnouncementsPage() {
  return (
    <>
      <PortalHeading
        eyebrow="Super Admin"
        title="Announcements"
        text="The announcement appears as a popup on the public website, in the member portal, or both. Each person sees it until they close it; changing the content shows it to everyone again."
      />
      <Panel><AnnouncementEditor initial={(await getAnnouncement()) ?? null} /></Panel>
    </>
  )
}
