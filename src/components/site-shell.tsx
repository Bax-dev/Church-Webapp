import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUp, Heart, Users } from 'lucide-react'

import { Brand } from '@/components/brand'
import { Rich, SiteImage } from '@/components/content'
import { Header } from '@/components/header'
import { SignOutButton } from '@/components/sign-out-button'
import { SiteBanner, WhatsAppButton } from '@/components/site-widgets'
import type { ImageValue, SiteContent } from '@/config/content'
import { footerColumns, labelled, prayerLink, visibleTo, type NavLink } from '@/config/navigation'
import { routes } from '@/config/routes'
import type { Viewer } from '@/config/session'
import { getContent } from '@/lib/server/content'
import { getProgramSafe } from '@/lib/server/prayer'
import { getSiteWidgetsSafe } from '@/lib/server/settings'
import { getViewer } from '@/lib/server/session'

function Footer({ viewer, site, nav, extras }: { viewer: Viewer; site: SiteContent['site']; nav: SiteContent['navigation']; extras: NavLink[] }) {
  const labels: Record<string, string> = nav.footer
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Brand identity={site.identity} />
            <p className="footer-copy">{site.footer.tagline}</p>
            {site.footer.location && <p className="footer-copy footer-location">{site.footer.location}</p>}
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            {footerColumns.map((column) => {
              // The prayer link (while the programme is on) leads the last column.
              const links = visibleTo(labelled(column.titleKey === 'nextTitle' ? [...extras, ...column.links] : column.links, labels), viewer)
              return links.length > 0 && (
                <div className="footer-column" key={column.titleKey}>
                  <strong>{labels[column.titleKey] || column.title}</strong>
                  {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
                  {column.titleKey === 'membersTitle' && viewer && <SignOutButton className="footer-signout" label={nav.header.signOut} />}
                </div>
              )
            })}
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {site.identity.name}{site.footer.location && ` · ${site.footer.location}`}</span>
          <a className="back-top" href="#top">{nav.footer.backToTop} <ArrowUp size={14} /></a>
        </div>
      </div>
    </footer>
  )
}

/** The header and footer menus depend on who is signed in, so the frame reads the session on every request. */
export async function SiteFrame({ children }: { children: ReactNode }) {
  const [viewer, { site, navigation }, program, widgets] = await Promise.all([getViewer(), getContent(), getProgramSafe(), getSiteWidgetsSafe()])
  const extras = program.enabled ? [{ ...prayerLink, label: program.title }] : []
  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteBanner banner={widgets.banner} />
      <Header viewer={viewer} identity={site.identity} ctaLabel={site.header.ctaLabel} labels={navigation.header} extras={extras} />
      <main id="main-content">{children}</main>
      <Footer viewer={viewer} site={site} nav={navigation} extras={extras} />
      <WhatsAppButton whatsapp={widgets.whatsapp} />
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

/** Inner-page header. With an image, the photo fills the band behind a navy wash that keeps the text readable. */
export function PageIntro({ eyebrow, title, text, image }: { eyebrow: string; title: string; text?: string; image?: ImageValue }) {
  return (
    <section className={`page-intro${image ? ' has-image' : ''}`} aria-labelledby="page-title">
      {image && <SiteImage className="page-intro-photo" image={image} fill priority sizes="100vw" />}
      <div className="container">
        <div className="hero-label eyebrow">{eyebrow}</div>
        <h1 id="page-title"><Rich text={title} /></h1>
        {text && <p>{text}</p>}
      </div>
    </section>
  )
}

export function CTA({ content }: { content: SiteContent['shared']['cta'] }) {
  return (
    <section className="access" aria-labelledby="cta-title">
      <div className="container access-card">
        <div>
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 id="cta-title"><Rich text={content.title} /></h2>
          <p>{content.text}</p>
        </div>
        <div className="access-actions">
          <Link className="button-primary" href={routes.visit.path}>{content.buttonLabel} <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  )
}

export function Pillars({ content, link }: { content: SiteContent['shared']['pillars']; link?: boolean }) {
  return (
    <section className="section why" aria-labelledby="why-title">
      <div className="container why-grid">
        <div className="why-aside">
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 id="why-title"><Rich text={content.title} /></h2>
          <p>{content.text}</p>
          {link && <Link className="pathway-link" href={routes.about.path}>{content.linkLabel} <ArrowRight size={15} /></Link>}
        </div>
        <div className="why-list">
          {content.items.map((pillar, index) => (
            <article className="why-item" key={index}>
              <span className="why-number">{String(index + 1).padStart(2, '0')}</span>
              <div><h3>{pillar.title}</h3><p>{pillar.text}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Beliefs({ content }: { content: SiteContent['about']['beliefs'] }) {
  return (
    <section className="section values" id="what-we-believe" aria-labelledby="values-title">
      <div className="container values-inner">
        <div>
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 id="values-title"><Rich text={content.title} /></h2>
          <p className="values-intro">{content.text}</p>
        </div>
        <div className="values-words">
          {content.items.map((belief, index) => (
            <div className="value" key={index}><strong>{belief.title}</strong><span>{belief.text}</span></div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Pathways({ content }: { content: SiteContent['shared']['pathways'] }) {
  return (
    <section className="section pathways" aria-labelledby="pathways-title">
      <div className="container">
        <div className="pathway-top">
          <div className="section-head">
            <span className="eyebrow">{content.eyebrow}</span>
            <h2 id="pathways-title"><Rich text={content.title} /></h2>
            <p>{content.text}</p>
          </div>
        </div>
        <div className="pathways-grid">
          <article className="pathway-card members">
            <span className="card-note">{content.newcomerNote}</span>
            <span className="card-icon"><Heart size={19} strokeWidth={1.7} /></span>
            <div>
              <h3>{content.newcomerTitle}</h3>
              <p>{content.newcomerText}</p>
              <Link className="pathway-link" href={routes.visit.path}>{content.newcomerLink} <ArrowRight size={15} /></Link>
            </div>
          </article>
          <article className="pathway-card leaders">
            <span className="card-note">{content.memberNote}</span>
            <span className="card-icon"><Users size={19} strokeWidth={1.7} /></span>
            <div>
              <h3>{content.memberTitle}</h3>
              <p>{content.memberText}</p>
              <Link className="pathway-link" href={routes.members.path}>{content.memberLink} <ArrowRight size={15} /></Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
