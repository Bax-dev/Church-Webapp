import Link from 'next/link'
import { ArrowRight, Car, Check, Clock, MapPin } from 'lucide-react'

import { ContentIcon, Lines, Rich, SiteImage } from '@/components/content'
import type { SiteContent } from '@/config/content'
import { routes } from '@/config/routes'

// Every section takes its text and images from the site content (src/config/content.ts), edited at /admin/content.
type C = SiteContent

/** Image cards for each area of church life. */
export function Ministries({ content, link = true }: { content: C['shared']['ministries']; link?: boolean }) {
  return (
    <section className="section ministries" aria-labelledby="ministries-title">
      <div className="container">
        <div className="pathway-top">
          <div className="section-head">
            <span className="eyebrow">{content.eyebrow}</span>
            <h2 id="ministries-title"><Rich text={content.title} /></h2>
            <p>{content.text}</p>
          </div>
          {link && <Link className="button-secondary" href={routes.getInvolved.path}>{content.buttonLabel} <ArrowRight size={15} /></Link>}
        </div>
        <div className="ministry-grid">
          {content.items.map((item, index) => (
            <article className="ministry-card" key={index}>
              <div className="ministry-photo"><SiteImage image={item.image} sizes="(max-width: 700px) 100vw, (max-width: 900px) 50vw, 380px" /></div>
              <div className="ministry-body">
                <span className="card-icon"><ContentIcon name={item.icon} /></span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/** A full-bleed photo band with a Scripture verse over it. */
export function ScriptureBand({ content }: { content: C['home']['scripture'] }) {
  return (
    <section className="scripture" aria-label="Scripture">
      <SiteImage image={content.image} className="scripture-photo" sizes="100vw" />
      <div className="container scripture-inner">
        <blockquote>
          <p>{content.quote}</p>
          <cite>{content.citation}</cite>
        </blockquote>
      </div>
    </section>
  )
}

/** A mosaic of photos from church life. */
export function Gallery({ content }: { content: C['home']['gallery'] }) {
  return (
    <section className="section gallery" aria-labelledby="gallery-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 id="gallery-title"><Rich text={content.title} /></h2>
        </div>
        <div className="gallery-grid">
          {content.tiles.map((tile, index) => (
            <figure key={index} className={`gallery-tile tile-${index + 1}`}>
              <SiteImage image={tile.image} sizes={index === 0 ? '(max-width: 700px) 100vw, 60vw' : '(max-width: 700px) 50vw, 30vw'} />
            </figure>
          ))}
        </div>
        {content.note && <p className="image-note">{content.note}</p>}
        {content.linkLabel && <Link className="button-secondary gallery-link" href={routes.gallery.path}>{content.linkLabel} <ArrowRight size={15} /></Link>}
      </div>
    </section>
  )
}

/** About page: our story, with the Presbyterian heritage. */
export function Story({ content }: { content: C['about']['story'] }) {
  return (
    <section className="section story" aria-labelledby="story-title">
      <div className="container story-layout">
        <div className="story-photo"><SiteImage image={content.image} sizes="(max-width: 700px) 100vw, 45vw" /></div>
        <div className="story-copy">
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 id="story-title"><Rich text={content.title} /></h2>
          {content.paragraphs.map((paragraph, index) => <p key={index}><Lines text={paragraph} /></p>)}
          {content.points.length > 0 && (
            <ul className="story-points">
              {content.points.map((point, index) => <li key={index}><strong>{point.title}</strong><span>{point.text}</span></li>)}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

/** Get involved page: how a newcomer becomes part of the church. */
export function JoinSteps({ content }: { content: C['getInvolved']['steps'] }) {
  return (
    <section className="section join" aria-labelledby="join-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 id="join-title"><Rich text={content.title} /></h2>
        </div>
        <ol className="step-grid">
          {content.items.map((step, index) => (
            <li className="step" key={index}>
              <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="card-icon"><ContentIcon name={step.icon} /></span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Visit page: what to expect, with a checklist. */
export function Expect({ content }: { content: C['visit']['expect'] }) {
  return (
    <section className="section experience" aria-labelledby="experience-title">
      <div className="container experience-layout">
        <div className="experience-art"><SiteImage image={content.image} sizes="(max-width: 700px) 100vw, 50vw" /></div>
        <div className="experience-copy">
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 id="experience-title"><Rich text={content.title} /></h2>
          <p>{content.text}</p>
          {content.points.length > 0 && (
            <ul className="feature-list">
              {content.points.map((point, index) => <li key={index}><Check size={17} /><span>{point}</span></li>)}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

/** Visit page: what a first Sunday looks like, in order. */
export function FirstSunday({ content }: { content: C['visit']['firstSunday'] }) {
  return (
    <section className="section first-sunday" aria-labelledby="first-sunday-title">
      <div className="container first-sunday-layout">
        <div>
          <div className="section-head">
            <span className="eyebrow">{content.eyebrow}</span>
            <h2 id="first-sunday-title"><Rich text={content.title} /></h2>
          </div>
          <ol className="moment-list">
            {content.moments.map((moment, index) => <li key={index}><strong>{moment.title}</strong><span>{moment.text}</span></li>)}
          </ol>
        </div>
        <div className="first-sunday-photo"><SiteImage image={content.image} sizes="(max-width: 700px) 100vw, 45vw" /></div>
      </div>
    </section>
  )
}

/** Visit page: where to find us. The address comes from Church details. */
export function GettingHere({ content, site }: { content: C['visit']['gettingHere']; site: C['site'] }) {
  const { street, locality, region } = site.address
  const query = encodeURIComponent(`${site.identity.name}, ${street}, ${locality}, ${region}, Nigeria`)
  return (
    <section className="section getting-here" aria-labelledby="getting-here-title">
      <div className="container getting-here-card">
        <div>
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 id="getting-here-title"><Rich text={content.title} /></h2>
          <ul className="icon-list">
            <li><span className="card-icon"><MapPin size={17} strokeWidth={1.7} /></span><div><small>{content.addressLabel}</small><strong>{street}</strong><span>{locality}, {region}</span></div></li>
            <li><span className="card-icon"><Car size={17} strokeWidth={1.7} /></span><div><small>{content.travelLabel}</small><strong>{content.travelTitle}</strong><span>{content.travelText}</span></div></li>
            <li><span className="card-icon"><Clock size={17} strokeWidth={1.7} /></span><div><small>{content.timesLabel}</small><strong>{content.timesTitle}</strong><span>{content.timesText}</span></div></li>
          </ul>
        </div>
        <div className="getting-here-actions">
          <a className="button-primary" href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noreferrer">
            {content.mapsLabel} <ArrowRight size={16} />
          </a>
          <Link className="pathway-link" href={routes.faqs.path}>{content.faqLabel} <ArrowRight size={15} /></Link>
        </div>
      </div>
    </section>
  )
}

/** Member hub: districts feature with photo. */
export function DistrictsFeature({ content }: { content: C['members']['districts'] }) {
  return (
    <section className="section districts-feature" aria-labelledby="districts-title">
      <div className="container story-layout reverse">
        <div className="story-copy">
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 id="districts-title"><Rich text={content.title} /></h2>
          {content.paragraphs.map((paragraph, index) => <p key={index}><Lines text={paragraph} /></p>)}
          <Link className="pathway-link" href={routes.getInvolved.path}>{content.linkLabel} <ArrowRight size={15} /></Link>
        </div>
        <div className="story-photo"><SiteImage image={content.image} sizes="(max-width: 700px) 100vw, 45vw" /></div>
      </div>
    </section>
  )
}
