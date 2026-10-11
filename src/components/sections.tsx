import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Baby, BookOpen, Car, Clock, Coffee, HandHeart, MapPin, Music, Sparkles, UserPlus, Users } from 'lucide-react'

import { images, type ImageKey } from '@/config/images'
import { routes } from '@/config/routes'
import { SITE } from '@/config/site'

function Photo({ name, className, sizes = '(max-width: 700px) 100vw, 50vw', priority }: { name: ImageKey; className?: string; sizes?: string; priority?: boolean }) {
  const image = images[name]
  return <Image className={className} src={image.src} alt={image.alt} sizes={sizes} priority={priority} />
}

export const ministries: { key: string; title: string; text: string; image: ImageKey; icon: typeof Music }[] = [
  { key: 'worship', title: 'Sunday worship', text: 'Prayer, hymns and the preaching of the Word, with the whole church family gathered together.', image: 'worship', icon: Sparkles },
  { key: 'choir', title: 'Choir & music', text: 'Lead the congregation in song and grow in faith with others who love to sing.', image: 'choir', icon: Music },
  { key: 'districts', title: 'Districts & Bible study', text: 'Meet with members who live near you to study Scripture, pray and look out for one another.', image: 'bible-study', icon: BookOpen },
  { key: 'youth', title: 'Youth fellowship', text: 'A place for teenagers and young adults to ask big questions and build lasting friendships.', image: 'youth', icon: Users },
  { key: 'children', title: "Children's ministry", text: 'Bible stories, songs and care for our youngest members while their parents worship.', image: 'sunday-school', icon: Baby },
  { key: 'outreach', title: 'Outreach & care', text: "Serve neighbours across Lekki and beyond with practical help and Christ's love.", image: 'outreach', icon: HandHeart },
]

/** Image cards for each area of church life. */
export function Ministries({ limit, link = true }: { limit?: number; link?: boolean }) {
  const list = limit ? ministries.slice(0, limit) : ministries
  return (
    <section className="section ministries" aria-labelledby="ministries-title">
      <div className="container">
        <div className="pathway-top">
          <div className="section-head">
            <span className="eyebrow">Church life</span>
            <h2 id="ministries-title">Something for<br />every season of life.</h2>
            <p>From Sunday worship to midweek fellowship, there are many ways to belong at {SITE.name}.</p>
          </div>
          {link && <Link className="button-secondary" href={routes.getInvolved.path}>All the ways to get involved <ArrowRight size={15} /></Link>}
        </div>
        <div className="ministry-grid">
          {list.map(({ key, title, text, image, icon: Icon }) => (
            <article className="ministry-card" key={key}>
              <div className="ministry-photo"><Photo name={image} sizes="(max-width: 700px) 100vw, (max-width: 900px) 50vw, 380px" /></div>
              <div className="ministry-body">
                <span className="card-icon"><Icon size={17} strokeWidth={1.7} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/** A full-bleed photo band with a Scripture verse over it. */
export function ScriptureBand({ image = 'worship' }: { image?: ImageKey }) {
  return (
    <section className="scripture" aria-label="Scripture">
      <Photo name={image} className="scripture-photo" sizes="100vw" />
      <div className="container scripture-inner">
        <blockquote>
          <p>“They devoted themselves to the apostles’ teaching and to fellowship, to the breaking of bread and to prayer.”</p>
          <cite>Acts 2:42</cite>
        </blockquote>
      </div>
    </section>
  )
}

/** A mosaic of photos from church life. */
export function Gallery() {
  const tiles: ImageKey[] = ['worship', 'youth', 'outreach', 'choir', 'sunday-school']
  return (
    <section className="section gallery" aria-labelledby="gallery-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Life together</span>
          <h2 id="gallery-title">Worship, fellowship<br />and service.</h2>
        </div>
        <div className="gallery-grid">
          {tiles.map((name, index) => (
            <figure key={name} className={`gallery-tile tile-${index + 1}`}>
              <Photo name={name} sizes={index === 0 ? '(max-width: 700px) 100vw, 60vw' : '(max-width: 700px) 50vw, 30vw'} />
            </figure>
          ))}
        </div>
        <p className="image-note">Images on this site are illustrations, not photographs of the Centre or its members.</p>
      </div>
    </section>
  )
}

/** About page: our story, with the Presbyterian heritage. */
export function Story() {
  return (
    <section className="section story" aria-labelledby="story-title">
      <div className="container story-layout">
        <div className="story-photo"><Photo name="bible-study" sizes="(max-width: 700px) 100vw, 45vw" /></div>
        <div className="story-copy">
          <span className="eyebrow">Our heritage</span>
          <h2 id="story-title">Part of a long<br />Presbyterian story.</h2>
          <p>
            Presbyterian churches trace their roots to the Reformation, with a deep love for Scripture, for God’s grace,
            and for a church shared and led together. In Nigeria, that story began in 1846 when missionaries from Scotland
            arrived in Calabar, and it has grown into congregations across the country.
          </p>
          <p>{SITE.name} carries that story into Lekki today: a congregation that worships, studies and serves together.</p>
          <ul className="story-points">
            <li><strong>Led by elders</strong><span>Ministers and elected elders share the leadership and pastoral care of the congregation.</span></li>
            <li><strong>Rooted in the Word</strong><span>Preaching and teaching from the Bible shape everything we do.</span></li>
            <li><strong>Connected</strong><span>Departments and districts make a large church feel like a family.</span></li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/** Get involved page: how a newcomer becomes part of the church. */
export function JoinSteps() {
  const steps = [
    { icon: Coffee, title: 'Visit on a Sunday', text: 'Worship with us and stay afterwards to meet people. No need to sign up first.' },
    { icon: UserPlus, title: 'Say hello', text: 'Tell an usher or elder you are new. They will introduce you and answer your questions.' },
    { icon: Users, title: 'Find your people', text: 'Join the district near your home and a department where you can grow and serve.' },
    { icon: HandHeart, title: 'Serve together', text: 'Use your gifts in worship, care, outreach and teaching, alongside others.' },
  ]
  return (
    <section className="section join" aria-labelledby="join-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Your next step</span>
          <h2 id="join-title">How to become<br />part of the family.</h2>
        </div>
        <ol className="step-grid">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li className="step" key={title}>
              <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="card-icon"><Icon size={17} strokeWidth={1.7} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Visit page: what a first Sunday looks like, in order. */
export function FirstSunday() {
  const moments = [
    { title: 'Arrive a little early', text: 'Ushers at the door will welcome you and help you find a seat. Families with young children are very welcome.' },
    { title: 'Worship together', text: 'The service includes hymns and songs, prayers, Bible readings and a sermon. Join in as much or as little as you like.' },
    { title: 'Bring the children', text: 'Children are welcome in worship. Ask an usher about children’s activities on the day.' },
    { title: 'Stay and meet people', text: 'After the service, stay and chat. Let someone know you are new and we will be glad to introduce you.' },
  ]
  return (
    <section className="section first-sunday" aria-labelledby="first-sunday-title">
      <div className="container first-sunday-layout">
        <div>
          <div className="section-head">
            <span className="eyebrow">Your first Sunday</span>
            <h2 id="first-sunday-title">What happens<br />when you visit.</h2>
          </div>
          <ol className="moment-list">
            {moments.map((moment) => (
              <li key={moment.title}><strong>{moment.title}</strong><span>{moment.text}</span></li>
            ))}
          </ol>
        </div>
        <div className="first-sunday-photo"><Photo name="sunday-school" sizes="(max-width: 700px) 100vw, 45vw" /></div>
      </div>
    </section>
  )
}

/** Visit page: where to find us. */
export function GettingHere() {
  const query = encodeURIComponent(`${SITE.name}, ${SITE.address.street}, ${SITE.address.locality}, ${SITE.address.region}, Nigeria`)
  return (
    <section className="section getting-here" aria-labelledby="getting-here-title">
      <div className="container getting-here-card">
        <div>
          <span className="eyebrow">Getting here</span>
          <h2 id="getting-here-title">Find us in Lekki.</h2>
          <ul className="icon-list">
            <li><span className="card-icon"><MapPin size={17} strokeWidth={1.7} /></span><div><small>Address</small><strong>{SITE.address.street}</strong><span>{SITE.address.locality}, {SITE.address.region}</span></div></li>
            <li><span className="card-icon"><Car size={17} strokeWidth={1.7} /></span><div><small>Travel</small><strong>Allow extra time for traffic</strong><span>The expressway can be busy, especially on Sunday mornings.</span></div></li>
            <li><span className="card-icon"><Clock size={17} strokeWidth={1.7} /></span><div><small>Service times</small><strong>Ask us before your visit</strong><span>Check our latest announcement, or ask any member.</span></div></li>
          </ul>
        </div>
        <div className="getting-here-actions">
          <a className="button-primary" href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noreferrer">
            Open in Google Maps <ArrowRight size={16} />
          </a>
          <Link className="pathway-link" href={routes.faqs.path}>Read common questions <ArrowRight size={15} /></Link>
        </div>
      </div>
    </section>
  )
}

/** Member hub: districts feature with photo. */
export function DistrictsFeature() {
  return (
    <section className="section districts-feature" aria-labelledby="districts-title">
      <div className="container story-layout reverse">
        <div className="story-copy">
          <span className="eyebrow">Districts</span>
          <h2 id="districts-title">Fellowship close<br />to home.</h2>
          <p>
            Every member belongs to a district: a smaller group of members who live in the same part of Lekki and beyond.
            Districts meet to study the Bible and pray, and they are often the first to know when someone needs a visit, a meal or a phone call.
          </p>
          <p>Departments bring members together around a shared way of serving, from the choir to ushering to outreach.</p>
          <Link className="pathway-link" href={routes.getInvolved.path}>See how to get involved <ArrowRight size={15} /></Link>
        </div>
        <div className="story-photo"><Photo name="gathering" sizes="(max-width: 700px) 100vw, 45vw" /></div>
      </div>
    </section>
  )
}
