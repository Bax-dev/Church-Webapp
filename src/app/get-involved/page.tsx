import { JoinSteps, Ministries } from '@/components/sections'
import { CTA, PageIntro, Pathways } from '@/components/site-shell'
import { routes } from '@/config/routes'
import { getContent } from '@/lib/server/content'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.getInvolved)

export default async function GetInvolvedPage() {
  const { getInvolved, shared } = await getContent()
  return (
    <>
      <PageIntro {...getInvolved.intro} />
      <JoinSteps content={getInvolved.steps} />
      <Ministries content={shared.ministries} link={false} />
      <Pathways content={shared.pathways} />
      <CTA content={shared.cta} />
    </>
  )
}
