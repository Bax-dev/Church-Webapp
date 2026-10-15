import { Fragment } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowRight } from 'lucide-react'

import { Rich } from '@/components/content'
import { HeroArt } from '@/components/motion/hero-art'
import { HeroScene } from '@/components/motion/hero-scene'
import { Pastors } from '@/components/pastors'
import { PrayerBand } from '@/components/prayer'
import { Gallery, Ministries, ScriptureBand } from '@/components/sections'
import { CTA, Pathways, Pillars } from '@/components/site-shell'
import { isLive } from '@/config/prayer'
import { routes } from '@/config/routes'
import { getContent } from '@/lib/server/content'
import { pageMetadata } from '@/lib/server/metadata'
import { getProgramSafe, publicGuide } from '@/lib/server/prayer'

export const generateMetadata = pageMetadata(routes.home)

export default async function Home() {
  const [{ home, shared, prayerPage }, program] = await Promise.all([getContent(), getProgramSafe()])
  const prayer = program.enabled && program.showOnHome
    ? { live: isLive(program), guide: (await publicGuide().catch(() => undefined))?.guide }
    : undefined
  const { hero } = home
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <HeroScene />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-label eyebrow">{hero.eyebrow}</div>
            <h1 id="hero-title"><Rich text={hero.title} /></h1>
            <p className="hero-intro">{hero.intro}</p>
            <div className="hero-actions">
              <Link className="button-primary" href={routes.visit.path}>{hero.primaryLabel} <ArrowRight size={16} /></Link>
              <a className="button-secondary" href="#why-title">{hero.secondaryLabel} <ArrowDown size={15} /></a>
            </div>
            {hero.note && <p className="hero-note">{hero.note}</p>}
          </div>
          <HeroArt content={home.heroArt} />
        </div>
      </section>

      <div className="marquee" aria-label={home.marquee.words.join(', ')}>
        <div className="container marquee-inner">
          {home.marquee.words.map((word, index) => (
            <Fragment key={index}>
              {index > 0 && <i aria-hidden="true" />}
              <span>{word}</span>
            </Fragment>
          ))}
        </div>
      </div>

      {prayer && <PrayerBand program={program} live={prayer.live} guide={prayer.guide} words={prayerPage} />}
      <Pillars content={shared.pillars} link />
      <Ministries content={shared.ministries} />
      <ScriptureBand content={home.scripture} />
      <Pastors content={home.pastors} />
      <Pathways content={shared.pathways} />
      <Gallery content={home.gallery} />
      <CTA content={shared.cta} />
    </>
  )
}
