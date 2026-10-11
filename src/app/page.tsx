import Link from 'next/link'
import { ArrowDown, ArrowRight } from 'lucide-react'

import { HeroArt } from '@/components/motion/hero-art'
import { HeroScene } from '@/components/motion/hero-scene'
import { Gallery, Ministries, ScriptureBand } from '@/components/sections'
import { CTA, Pathways, Pillars } from '@/components/site-shell'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'
import { SITE } from '@/config/site'

export const metadata = metadataFor(routes.home)

export default function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <HeroScene />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-label eyebrow">{SITE.name} · {SITE.address.locality}</div>
            <h1 id="hero-title">A home for faith.<br /><em>A family</em> to belong to.</h1>
            <p className="hero-intro">
              Welcome to {SITE.name}, {SITE.address.locality} — a community gathered to worship God, grow in His Word and care for one another and the city around us.
            </p>
            <div className="hero-actions">
              <Link className="button-primary" href={routes.visit.path}>Plan your visit <ArrowRight size={16} /></Link>
              <a className="button-secondary" href="#why-title">Get to know us <ArrowDown size={15} /></a>
            </div>
            <p className="hero-note">{SITE.address.street}, {SITE.address.locality} · All are welcome.</p>
          </div>
          <HeroArt />
        </div>
      </section>

      <div className="marquee" aria-label="Worship, fellowship, service">
        <div className="container marquee-inner">
          <span>Worship</span><i aria-hidden="true" />
          <span>Fellowship</span><i aria-hidden="true" />
          <span>Service</span>
        </div>
      </div>

      <Pillars link />
      <Ministries />
      <ScriptureBand />
      <Pathways />
      <Gallery />
      <CTA />
    </>
  )
}
