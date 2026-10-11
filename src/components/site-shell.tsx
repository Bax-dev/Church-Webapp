import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUp, Check, Heart, Users } from 'lucide-react'

import gatheringImage from '@/assets/community-gathering.png'
import { Brand } from '@/components/brand'
import { Header } from '@/components/header'
import { SignOutButton } from '@/components/sign-out-button'
import { images, type ImageKey } from '@/config/images'
import { footerColumns, visibleTo } from '@/config/navigation'
import { routes } from '@/config/routes'
import type { Viewer } from '@/config/session'
import { SITE } from '@/config/site'
import { getViewer } from '@/lib/server/session'

function Footer({ viewer }: { viewer: Viewer }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Brand />
            <p className="footer-copy">A community gathered to worship God, grow in His Word and serve one another.</p>
            <p className="footer-copy footer-location">{SITE.address.street}, {SITE.address.locality}</p>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            {footerColumns.map((column) => {
              const links = visibleTo(column.links, viewer)
              return links.length > 0 && (
                <div className="footer-column" key={column.title}>
                  <strong>{column.title}</strong>
                  {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
                  {column.title === 'Members' && viewer && <SignOutButton className="footer-signout" />}
                </div>
              )
            })}
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {SITE.name} · {SITE.address.street}, {SITE.address.locality}</span>
          <a className="back-top" href="#top">Back to the top <ArrowUp size={14} /></a>
        </div>
      </div>
    </footer>
  )
}

/** The header and footer menus depend on who is signed in, so the frame reads the session on every request. */
export async function SiteFrame({ children }: { children: ReactNode }) {
  const viewer = await getViewer()
  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header viewer={viewer} />
      <main id="main-content">{children}</main>
      <Footer viewer={viewer} />
    </div>
  )
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

/** Inner-page header. With `image`, the photo fills the band behind a navy wash that keeps the text readable. */
export function PageIntro({ eyebrow, title, text, image }: { eyebrow: string; title: ReactNode; text?: string; image?: ImageKey }) {
  const photo = image && images[image]
  return (
    <section className={`page-intro${photo ? ' has-image' : ''}`} aria-labelledby="page-title">
      {photo && <Image className="page-intro-photo" src={photo.src} alt={photo.alt} fill priority sizes="100vw" />}
      <div className="container">
        <div className="hero-label eyebrow">{eyebrow}</div>
        <h1 id="page-title">{title}</h1>
        {text && <p>{text}</p>}
      </div>
    </section>
  )
}

export function CTA() {
  return (
    <section className="access" aria-labelledby="cta-title">
      <div className="container access-card">
        <div>
          <span className="eyebrow">You are welcome here</span>
          <h2 id="cta-title">Come and worship with us.</h2>
          <p>Whoever you are and wherever you are on your journey, there is a place for you at {SITE.name}.</p>
        </div>
        <div className="access-actions">
          <Link className="button-primary" href={routes.visit.path}>Plan your visit <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  )
}

export const pillars = [
  { title: 'Worship', text: 'We gather to praise God, pray together and celebrate the sacraments as one body.' },
  { title: 'The Word', text: 'Scripture shapes our life together, through preaching, teaching and study.' },
  { title: 'Fellowship', text: 'Through departments and districts, members know one another and share life beyond Sunday.' },
  { title: 'Service', text: "We seek to reflect Christ's love in Lekki, Lagos and beyond through care and outreach." },
]

export function Pillars({ link }: { link?: boolean }) {
  return (
    <section className="section why" aria-labelledby="why-title">
      <div className="container why-grid">
        <div className="why-aside">
          <span className="eyebrow">Who we are</span>
          <h2 id="why-title">A Presbyterian church family in the heart of Lekki.</h2>
          <p>We are a congregation rooted in the Reformed tradition, seeking to love God, follow Jesus Christ and serve our neighbours together.</p>
          {link && <Link className="pathway-link" href={routes.about.path}>More about us <ArrowRight size={15} /></Link>}
        </div>
        <div className="why-list">
          {pillars.map((pillar, index) => (
            <article className="why-item" key={pillar.title}>
              <span className="why-number">{String(index + 1).padStart(2, '0')}</span>
              <div><h3>{pillar.title}</h3><p>{pillar.text}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export const beliefs = [
  { title: 'Grace', text: "Salvation is God's gift, received through faith in Jesus Christ." },
  { title: 'Scripture', text: 'The Bible is the Word of God and our guide for faith and life.' },
  { title: 'Community', text: 'We are called to belong to one another as the family of God.' },
  { title: 'Service', text: 'Our faith is lived out in love for our neighbours.' },
]

export function Beliefs() {
  return (
    <section className="section values" id="what-we-believe" aria-labelledby="values-title">
      <div className="container values-inner">
        <div>
          <span className="eyebrow">What we believe</span>
          <h2 id="values-title">Grace at the centre<br />of everything.</h2>
          <p className="values-intro">As a Presbyterian church, we hold to the historic Christian faith as expressed in the Reformed tradition.</p>
        </div>
        <div className="values-words">
          {beliefs.map((belief) => (
            <div className="value" key={belief.title}><strong>{belief.title}</strong><span>{belief.text}</span></div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Pathways() {
  return (
    <section className="section pathways" aria-labelledby="pathways-title">
      <div className="container">
        <div className="pathway-top">
          <div className="section-head">
            <span className="eyebrow">Get involved</span>
            <h2 id="pathways-title">Many members.<br />One body.</h2>
            <p>Whether you are visiting for the first time or have worshipped with us for years, there is a place for you at {SITE.name}.</p>
          </div>
        </div>
        <div className="pathways-grid">
          <article className="pathway-card members">
            <span className="card-note">New here</span>
            <span className="card-icon"><Heart size={19} strokeWidth={1.7} /></span>
            <div>
              <h3>We would love to meet you.</h3>
              <p>Join us for worship and come as you are. Our congregation will be glad to welcome you, answer your questions and help you find your way.</p>
              <Link className="pathway-link" href={routes.visit.path}>Plan your visit <ArrowRight size={15} /></Link>
            </div>
          </article>
          <article className="pathway-card leaders">
            <span className="card-note">Members</span>
            <span className="card-icon"><Users size={19} strokeWidth={1.7} /></span>
            <div>
              <h3>Serve, grow and stay connected.</h3>
              <p>Find your place in a department or district, serve alongside others and grow in fellowship. Sign in to the member portal to keep your details up to date.</p>
              <Link className="pathway-link" href={routes.members.path}>Explore the member hub <ArrowRight size={15} /></Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export function Visit() {
  return (
    <section className="section experience" aria-labelledby="experience-title">
      <div className="container experience-layout">
        <div className="experience-art">
          <Image src={gatheringImage} alt="Illustrative image of a community gathering; not a photograph of the Centre." />
        </div>
        <div className="experience-copy">
          <span className="eyebrow">What to expect</span>
          <h2 id="experience-title">Join us for worship.</h2>
          <p>{SITE.name} is on the {SITE.address.street}, {SITE.address.locality}, {SITE.address.region}. Whoever you are and wherever you are on your journey, you are welcome.</p>
          <ul className="feature-list">
            <li><Check size={17} /><span>Come as you are, there is no dress code to worry about</span></li>
            <li><Check size={17} /><span>Expect prayer, singing and the preaching of God&apos;s Word</span></li>
            <li><Check size={17} /><span>Stay after the service to meet members of the congregation</span></li>
            <li><Check size={17} /><span>Ask anyone you meet about joining a department or district</span></li>
          </ul>
        </div>
      </div>
    </section>
  )
}
