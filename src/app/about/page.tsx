import { Pastors } from '@/components/pastors'
import { ScriptureBand, Story } from '@/components/sections'
import { Beliefs, CTA, PageIntro, Pillars } from '@/components/site-shell'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'

export const metadata = metadataFor(routes.about)

export default function AboutPage() {
  return (
    <>
      <PageIntro
        image="worship"
        eyebrow="About us"
        title={<>Rooted in faith.<br /><em>Growing</em> together.</>}
        text="Presbyterian Centre is a congregation in Lekki seeking to love God, follow Jesus Christ and serve our neighbours together."
      />
      <Story />
      <Pastors />
      <Pillars />
      <ScriptureBand image="choir" />
      <Beliefs />
      <CTA />
    </>
  )
}
