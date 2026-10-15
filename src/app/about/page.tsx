import { Pastors } from '@/components/pastors'
import { ScriptureBand, Story } from '@/components/sections'
import { Beliefs, CTA, PageIntro, Pillars } from '@/components/site-shell'
import { routes } from '@/config/routes'
import { getContent } from '@/lib/server/content'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.about)

export default async function AboutPage() {
  const { about, shared } = await getContent()
  return (
    <>
      <PageIntro {...about.intro} />
      <Story content={about.story} />
      <Pastors content={about.pastors} />
      <Pillars content={shared.pillars} />
      <ScriptureBand content={about.scripture} />
      <Beliefs content={about.beliefs} />
      <CTA content={shared.cta} />
    </>
  )
}
