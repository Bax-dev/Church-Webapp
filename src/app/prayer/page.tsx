import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

import { SiteImage } from '@/components/content'
import { GuideView, JoinButtons, LiveBadge, YouTubeEmbed } from '@/components/prayer'
import { metadataFor } from '@/config/meta'
import { flyerImage, isLive, longDate } from '@/config/prayer'
import { routes } from '@/config/routes'
import { getContent } from '@/lib/server/content'
import { guideByDate, getProgramSafe, publicGuide, publishedGuides } from '@/lib/server/prayer'
import { currentUser } from '@/lib/server/session'

type Props = { searchParams: Promise<{ date?: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const [program, { site }] = await Promise.all([getProgramSafe(), getContent()])
  return metadataFor({ ...routes.prayer, title: program.title, description: program.tagline || routes.prayer.description }, site)
}

/** The prayer programme: how to join, tonight's guide (or ?date=), and recent guides. Hidden while switched off, except to Super Admins. */
export default async function PrayerPage({ searchParams }: Props) {
  const [program, user, { prayerPage: words }] = await Promise.all([getProgramSafe(), currentUser(), getContent()])
  const isAdmin = user?.role === 'SUPER_ADMIN'
  if (!program.enabled && !isAdmin) notFound()

  const { date } = await searchParams
  const valid = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined
  const [picked, archive] = await Promise.all([
    valid ? guideByDate(valid).then((g) => (g && (g.published || isAdmin) ? { guide: g, isToday: false } : undefined)) : publicGuide(),
    publishedGuides(30),
  ])
  const live = isLive(program)
  const flyer = flyerImage(program)

  return (
    <>
      {!program.enabled && (
        <div className="container"><p className="form-result is-info prayer-admin-note">This page is switched off, so only Super Admins can see it. Switch it on at <Link href={routes.adminPrayer.path}>Admin → Prayer programme</Link>.</p></div>
      )}
      <section className="section prayer-hero" aria-labelledby="page-title">
        <div className={`container prayer-band-inner${flyer ? '' : ' no-flyer'}`}>
          {flyer && <div className="prayer-flyer"><SiteImage image={flyer} priority sizes="(max-width: 700px) 100vw, 420px" /></div>}
          <div className="prayer-band-copy">
            <LiveBadge program={program} live={live} words={words} />
            <h1 id="page-title">{program.title}</h1>
            {program.host && <p className="prayer-host">{words.labels.hostPrefix} {program.host}</p>}
            {program.tagline && <p className="prayer-tagline">{program.tagline}</p>}
            <p className="prayer-schedule">{program.scheduleLabel}{program.welcome && ` · ${program.welcome}`}</p>
            <JoinButtons program={program} live={live} words={words} />
            {program.note && <p className="prayer-note">{program.note}</p>}
          </div>
        </div>
      </section>

      {program.youtube.enabled && (
        <section className="section prayer-watch" aria-label="Watch">
          <div className="container"><YouTubeEmbed url={program.youtube.url} title={`${program.title} on YouTube`} /></div>
        </section>
      )}

      <section className="section prayer-guide-section" aria-label="Prayer guide">
        <div className="container prayer-guide-layout">
          <div>
            {picked ? (
              <>
                {!valid && !picked.isToday && <p className="field-hint">{words.labels.notToday}</p>}
                {!picked.guide.published && <p className="form-result is-info">Draft: only Super Admins can see this guide.</p>}
                <GuideView guide={picked.guide} words={words} />
              </>
            ) : (
              <div className="prayer-empty">
                <h2>{valid ? words.labels.emptyDateTitle.replaceAll('{date}', longDate(valid)) : words.labels.emptyTitle}</h2>
                <p>{words.labels.emptyText}</p>
              </div>
            )}
          </div>
          {archive.length > 0 && (
            <aside className="prayer-archive" aria-label="Recent prayer guides">
              <h2>{words.labels.recentTitle}</h2>
              <ul>
                {archive.map((item) => (
                  <li key={item.id}>
                    <Link href={`${routes.prayer.path}/?date=${item.date}`} aria-current={item.date === picked?.guide.date ? 'page' : undefined}>
                      <small>{longDate(item.date)}</small>{item.theme}
                    </Link>
                  </li>
                ))}
              </ul>
              {valid && <Link className="pathway-link" href={routes.prayer.path}>{words.labels.backToToday} <ArrowRight size={14} /></Link>}
            </aside>
          )}
        </div>
      </section>
    </>
  )
}
