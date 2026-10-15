import { Expect, FirstSunday, GettingHere } from '@/components/sections'
import { CTA, PageIntro } from '@/components/site-shell'
import { routes } from '@/config/routes'
import { getContent } from '@/lib/server/content'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.visit)

export default async function VisitPage() {
  const { visit, shared, site } = await getContent()
  return (
    <>
      <PageIntro {...visit.intro} />
      <Expect content={visit.expect} />
      <FirstSunday content={visit.firstSunday} />
      <GettingHere content={visit.gettingHere} site={site} />
      <CTA content={shared.cta} />
    </>
  )
}
