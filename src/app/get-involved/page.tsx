import { JoinSteps, Ministries } from '@/components/sections'
import { CTA, PageIntro, Pathways } from '@/components/site-shell'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'

export const metadata = metadataFor(routes.getInvolved)

export default function GetInvolvedPage() {
  return (
    <>
      <PageIntro
        image="outreach"
        eyebrow="Get involved"
        title={<>There is a place<br />for <em>you</em> here.</>}
        text="From your first visit to serving in a department or district, find your way into the life of the church."
      />
      <JoinSteps />
      <Ministries link={false} />
      <Pathways />
      <CTA />
    </>
  )
}
