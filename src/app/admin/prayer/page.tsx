import { PrayerAdmin } from '@/components/portal/prayer-admin'
import { PortalHeading } from '@/components/portal/ui'
import { routes } from '@/config/routes'
import { pageMetadata } from '@/lib/server/metadata'
import { getProgram, listGuides } from '@/lib/server/prayer'

export const generateMetadata = pageMetadata(routes.adminPrayer)

export default async function AdminPrayerPage() {
  const [program, guides] = await Promise.all([getProgram(), listGuides()])
  return (
    <>
      <PortalHeading
        eyebrow="Super Admin"
        title="Prayer programme"
        text="Switch the programme on or off, set its YouTube and Zoom links, and post each night’s prayer guide."
      />
      <PrayerAdmin program={program} guides={guides} />
    </>
  )
}
