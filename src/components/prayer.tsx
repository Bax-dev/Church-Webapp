import Link from 'next/link'
import { ArrowRight, BookOpen, Clock, Radio, Video } from 'lucide-react'

import { SiteImage } from '@/components/content'
import { flyerImage, longDate, youtubeVideoId, type PrayerProgram, type StoredGuide } from '@/config/prayer'
import type { SiteContent } from '@/config/content'
import { routes } from '@/config/routes'

/** Fixed wording from Site content → Prayer page wording. */
export type PrayerWords = SiteContent['prayerPage']

/** "Live now" while the programme is on air, otherwise when it holds. */
export function LiveBadge({ program, live, words }: { program: PrayerProgram; live: boolean; words: PrayerWords }) {
  return live
    ? <span className="prayer-live is-live"><Radio size={13} aria-hidden="true" /> {words.labels.liveNow}</span>
    : <span className="prayer-live"><Clock size={13} aria-hidden="true" /> {program.scheduleLabel}</span>
}

/** The YouTube and Zoom buttons that are switched on, with the Zoom meeting ID and passcode if given. */
export function JoinButtons({ program, live, words }: { program: PrayerProgram; live: boolean; words: PrayerWords }) {
  const { youtube, zoom } = program
  if (!youtube.enabled && !zoom.enabled) return null
  return (
    <div className="prayer-join">
      <div className="prayer-join-buttons">
        {youtube.enabled && (
          <a className={live ? 'button-primary' : 'button-secondary'} href={youtube.url} target="_blank" rel="noreferrer">
            <Video size={16} aria-hidden="true" /> {youtube.label || words.labels.youtubeButton}
          </a>
        )}
        {zoom.enabled && (
          <a className={live && !youtube.enabled ? 'button-primary' : 'button-secondary'} href={zoom.url} target="_blank" rel="noreferrer">
            <Video size={16} aria-hidden="true" /> {zoom.label || words.labels.zoomButton}
          </a>
        )}
      </div>
      {zoom.enabled && (zoom.meetingId || zoom.passcode) && (
        <p className="prayer-zoom-details">
          {zoom.meetingId && <>{words.labels.zoomIdLabel} <strong>{zoom.meetingId}</strong></>}
          {zoom.meetingId && zoom.passcode && ' · '}
          {zoom.passcode && <>{words.labels.passcodeLabel} <strong>{zoom.passcode}</strong></>}
        </p>
      )}
    </div>
  )
}

/** Home page band: the flyer, when and with whom, how to join, and tonight's theme. */
export function PrayerBand({ program, live, guide, words }: { program: PrayerProgram; live: boolean; guide?: StoredGuide; words: PrayerWords }) {
  const flyer = flyerImage(program)
  return (
    <section className="section prayer-band" aria-labelledby="prayer-band-title">
      <div className={`container prayer-band-inner${flyer ? '' : ' no-flyer'}`}>
        {flyer && <div className="prayer-flyer"><SiteImage image={flyer} sizes="(max-width: 700px) 100vw, 420px" /></div>}
        <div className="prayer-band-copy">
          <LiveBadge program={program} live={live} words={words} />
          <h2 id="prayer-band-title">{program.title}</h2>
          {program.host && <p className="prayer-host">{words.labels.hostPrefix} {program.host}</p>}
          {program.tagline && <p className="prayer-tagline">{program.tagline}</p>}
          {guide && (
            <div className="prayer-tonight">
              <small>{live ? words.labels.tonightTheme : words.labels.themeFor.replaceAll('{date}', longDate(guide.date))}</small>
              <strong>{guide.theme}</strong>
              {guide.text && <span>{guide.text}</span>}
            </div>
          )}
          <JoinButtons program={program} live={live} words={words} />
          <Link className="pathway-link" href={routes.prayer.path}>
            {guide ? words.labels.readGuide : words.labels.moreAbout.replaceAll('{title}', program.title)} <ArrowRight size={15} />
          </Link>
          {program.note && <p className="prayer-note">{program.note}</p>}
        </div>
      </div>
    </section>
  )
}

/** The YouTube player, when the link points at a particular video or live stream. */
export function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const id = youtubeVideoId(url)
  if (!id) return null
  return (
    <div className="prayer-video">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

/** A full prayer guide: focus, key verse, exposition, prayer sections, declarations and the final prayer. */
export function GuideView({ guide, words }: { guide: StoredGuide; words: PrayerWords }) {
  return (
    <article className="prayer-guide" aria-labelledby="guide-theme">
      <header className="prayer-guide-head">
        <span className="eyebrow">{longDate(guide.date)}</span>
        <h2 id="guide-theme">{guide.theme}</h2>
        {guide.text && <p className="prayer-guide-text"><BookOpen size={15} aria-hidden="true" /> {guide.text}</p>}
      </header>

      {guide.keyVerse && (
        <blockquote className="prayer-verse">
          <p>“{guide.keyVerse}”</p>
          {guide.keyVerseRef && <cite>{guide.keyVerseRef}</cite>}
        </blockquote>
      )}

      {guide.focus.length > 0 && (
        <section className="prayer-block">
          <h3>{words.guide.focus}</h3>
          <ul className="prayer-bullets">{guide.focus.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </section>
      )}

      {guide.exposition.length > 0 && (
        <section className="prayer-block">
          <h3>{words.guide.exposition}</h3>
          {guide.exposition.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </section>
      )}

      {guide.prayers.length > 0 && (
        <section className="prayer-block">
          <h3>{words.guide.prayers}</h3>
          <ol className="prayer-points">
            {guide.prayers.map((prayer, index) => (
              <li key={index}>
                <h4><span>{index + 1}</span>{prayer.title}</h4>
                <ul className="prayer-bullets">{prayer.points.map((point, i) => <li key={i}>{point}</li>)}</ul>
              </li>
            ))}
          </ol>
        </section>
      )}

      {guide.declarations.length > 0 && (
        <section className="prayer-block prayer-declarations">
          <h3>{words.guide.declarations}</h3>
          <ul className="prayer-bullets">{guide.declarations.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </section>
      )}

      {guide.finalPrayer.length > 0 && (
        <section className="prayer-block">
          <h3>{words.guide.finalPrayer}</h3>
          {guide.finalPrayer.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </section>
      )}
    </article>
  )
}
