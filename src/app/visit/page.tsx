import { FirstSunday, GettingHere } from '@/components/sections'
import { CTA, PageIntro, Visit } from '@/components/site-shell'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'
import { SITE } from '@/config/site'

export const metadata = metadataFor(routes.visit)

export default function VisitPage() {
  return (
    <>
      <PageIntro
        image="choir"
        eyebrow="Plan your visit"
        title={<>Come as you are.<br /><em>You</em> are welcome.</>}
        text={`Find us on the ${SITE.address.street}, ${SITE.address.locality}, ${SITE.address.region}.`}
      />
      <Visit />
      <FirstSunday />
      <GettingHere />
      <CTA />
    </>
  )
}
