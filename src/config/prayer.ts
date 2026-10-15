/**
 * The prayer programme (e.g. the Prevailing Grace Hour) and its daily prayer guides.
 *
 * - The programme — whether it is shown at all, its name, host, times, flyer and the YouTube / Zoom links — is
 *   one value in the settings table, edited at /admin/prayer.
 * - Each night's guide is a row in prayer_guides, keyed by date. The editor can fill a guide from pasted text
 *   in the parish's usual format (see parseGuideText).
 *
 * Shared by the browser and the server, so both validate with the same rules.
 */
import { z } from 'zod'

import { isImageSrc, type ImageValue } from './content'

// ── Programme ──────────────────────────────────────────────────────────────

const YOUTUBE = /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i
const ZOOM = /^https:\/\/([\w-]+\.)?zoom\.(us|com)\//i
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const text = (label: string, max: number) => z.string().trim().max(max, `Keep ${label} under ${max} characters.`)
const required = (label: string, max: number) => text(label, max).min(1, `Enter ${label}.`)
/** Empty, or a link to the given service. Only https links to YouTube or Zoom are accepted, so the page can only ever send people there. */
const link = (pattern: RegExp, service: string) =>
  z.string().trim().max(500).refine((value) => !value || pattern.test(value), `Paste a full ${service} link starting with https://.`)

export const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const programSchema = z.object({
  /** Off hides the section, the page and the menu link everywhere. */
  enabled: z.boolean(),
  /** Also show the programme band on the home page. */
  showOnHome: z.boolean(),
  title: required('the programme name', 80),
  tagline: text('the tagline', 160),
  note: text('the note', 160),
  host: text('the host', 120),
  /** The words people read, e.g. "12am to 1am daily". */
  scheduleLabel: required('when it holds', 80),
  /** Lagos time, 24-hour "HH:MM". An end before the start means it runs past midnight. Used for the "Live now" badge. */
  startTime: z.string().regex(TIME, 'Use a time like 00:00.'),
  endTime: z.string().regex(TIME, 'Use a time like 01:00.'),
  /** 0 = Sunday … 6 = Saturday. */
  days: z.array(z.number().int().min(0).max(6)).min(1, 'Choose at least one day.').max(7),
  welcome: text('the welcome line', 80),
  flyer: z.object({
    src: z.string().refine(isImageSrc, 'Upload the flyer again.'),
    alt: z.string().trim().min(1, 'Describe the flyer for people who cannot see it.').max(300),
  }).nullable(),
  youtube: z.object({ enabled: z.boolean(), url: link(YOUTUBE, 'YouTube'), label: text('the button label', 40) })
    .refine((y) => !y.enabled || y.url, { path: ['url'], message: 'Paste the YouTube link, or switch YouTube off.' }),
  zoom: z.object({
    enabled: z.boolean(), url: link(ZOOM, 'Zoom'), label: text('the button label', 40),
    meetingId: text('the meeting ID', 40), passcode: text('the passcode', 40),
  }).refine((zm) => !zm.enabled || zm.url, { path: ['url'], message: 'Paste the Zoom link, or switch Zoom off.' }),
})

export type PrayerProgram = z.infer<typeof programSchema>

export const programDefaults: PrayerProgram = {
  enabled: false,
  showOnHome: true,
  title: 'Prevailing Grace Hour',
  tagline: 'A midnight encounter with God’s Love, Grace and Power',
  note: 'Don’t just end your day, end it with grace.',
  host: 'Most Rev Solomon Okoro',
  scheduleLabel: '12am to 1am daily',
  startTime: '00:00',
  endTime: '01:00',
  days: [0, 1, 2, 3, 4, 5, 6],
  welcome: 'All are welcome',
  flyer: null,
  youtube: { enabled: false, url: '', label: 'Watch on YouTube' },
  zoom: { enabled: false, url: '', label: 'Join on Zoom', meetingId: '', passcode: '' },
}

/** Stored JSON → programme, falling back field by field to the defaults so an old or damaged value never breaks a page. */
export function readProgram(raw: unknown): PrayerProgram {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const merged = {
    ...programDefaults, ...source,
    youtube: { ...programDefaults.youtube, ...(source.youtube as object) },
    zoom: { ...programDefaults.zoom, ...(source.zoom as object) },
  }
  const result = programSchema.safeParse(merged)
  return result.success ? result.data : { ...programDefaults, enabled: merged.enabled === true }
}

/** The flyer as the shared image components expect it. */
export const flyerImage = (program: PrayerProgram): ImageValue | undefined => program.flyer ?? undefined

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))

/** Lagos wall-clock now: weekday (0 = Sunday), date (yyyy-mm-dd) and minutes since midnight. */
export function lagosNow(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23',
  }).formatToParts(now).map((part) => [part.type, part.value]))
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: weekdays.indexOf(parts.weekday as (typeof weekdays)[number]),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

/** Whether the programme is on air right now (Lagos time). A window like 23:00–01:00 belongs to the day it starts. */
export function isLive(program: PrayerProgram, now = new Date()) {
  const { weekday, minutes: current } = lagosNow(now)
  const start = minutes(program.startTime)
  const end = minutes(program.endTime)
  if (start === end) return false
  if (start < end) return program.days.includes(weekday) && current >= start && current < end
  // Runs past midnight: either late on a programme day, or early the morning after one.
  return (program.days.includes(weekday) && current >= start) || (program.days.includes((weekday + 6) % 7) && current < end)
}

/** A YouTube video or live-stream id, if the link points at one (so the page can embed the player). */
export function youtubeVideoId(url: string) {
  const match = /(?:youtu\.be\/|[?&]v=|\/(?:live|embed|shorts)\/)([\w-]{11})(?![\w-])/.exec(url)
  return match?.[1]
}

// ── Prayer guides ──────────────────────────────────────────────────────────

const lines = (label: string, max: number, each = 600) =>
  z.array(z.string().trim().min(1).max(each, `Keep each ${label} under ${each} characters.`)).max(max, `Use at most ${max} ${label}s.`)

export const guideSchema = z.object({
  /** yyyy-mm-dd; one guide per date. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the date of the prayer meeting.'),
  theme: required('the theme', 200),
  /** The Bible passage, e.g. "Exodus 33:14–16". */
  text: text('the Bible text', 120),
  focus: lines('focus point', 20),
  keyVerse: text('the key verse', 600),
  keyVerseRef: text('the key verse reference', 80),
  exposition: lines('paragraph', 30, 3000),
  prayers: z.array(z.object({
    title: required('a heading for each prayer section', 200),
    points: lines('prayer point', 20),
  })).max(40, 'Use at most 40 prayer sections.'),
  declarations: lines('declaration', 40),
  finalPrayer: lines('paragraph', 20, 3000),
  published: z.boolean(),
})

export type PrayerGuide = z.infer<typeof guideSchema>
export type StoredGuide = PrayerGuide & { id: string; updatedAt: string }

export const emptyGuide = (date: string): PrayerGuide => ({
  date, theme: '', text: '', focus: [], keyVerse: '', keyVerseRef: '', exposition: [], prayers: [], declarations: [], finalPrayer: [], published: true,
})

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

/** "WEDNESDAY, 14TH OCTOBER, 2026" → "2026-10-14". */
function parseDate(line: string) {
  const match = /(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+),?\s+(\d{4})/i.exec(line)
  const month = match ? MONTHS.indexOf(match[2].toLowerCase()) : -1
  if (!match || month < 0) return undefined
  return `${match[3]}-${String(month + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`
}

/** “And he said …” — Exodus 33:14 → verse and reference. */
function splitVerse(line: string) {
  const match = /^(.*?)\s*[—–-]{1,2}\s*([1-3]?\s?[A-Za-z][\w .]*\d+:\d+(?:[–-]\d+)?)\s*$/.exec(line)
  return match ? { verse: match[1].trim(), ref: match[2].trim() } : { verse: line.trim(), ref: '' }
}

const BULLET = /^[•·●▪◦*\-–]\s*/
const HEADING = /^(FOCUS|KEY VERSE|EXPOSITION|LET US PRAY|PRAYER POINTS|CORPORATE DECLARATIONS?|DECLARATIONS?|FINAL PRAYER|CLOSING PRAYER)\s*:?$/i

/**
 * Reads a guide pasted in the parish's usual format:
 * THEME: …, TEXT: …, FOCUS (bullets), KEY VERSE, EXPOSITION (paragraphs), LET US PRAY (numbered sections with bullets),
 * CORPORATE DECLARATIONS (bullets), FINAL PRAYER (paragraphs). Headings can be in any case. Anything it does not
 * recognise is left out, and the editor shows the result for checking before it is saved.
 */
export function parseGuideText(raw: string, fallbackDate: string): PrayerGuide {
  const guide = emptyGuide(fallbackDate)
  let section = ''
  let current: { title: string; points: string[] } | undefined
  let paragraph: string[] = []

  const flush = () => {
    if (!paragraph.length) return
    const textBlock = paragraph.join(' ').trim()
    paragraph = []
    if (section === 'EXPOSITION') guide.exposition.push(textBlock)
    else if (section === 'FINAL PRAYER') guide.finalPrayer.push(textBlock)
  }

  for (const original of raw.replace(/\r/g, '').split('\n')) {
    const line = original.replace(/ /g, ' ').trim()
    if (!line) { flush(); continue }

    const theme = /^THEME\s*:\s*(.+)$/i.exec(line)
    if (theme) { flush(); guide.theme = theme[1].trim(); section = ''; continue }
    const passage = /^(?:BIBLE\s+)?TEXT\s*:\s*(.+)$/i.exec(line)
    if (passage) { flush(); guide.text = passage[1].trim(); section = ''; continue }

    const heading = HEADING.exec(line)
    if (heading) {
      flush()
      const name = heading[1].toUpperCase()
      section = name.startsWith('KEY VERSE') ? 'KEY VERSE'
        : name === 'LET US PRAY' || name === 'PRAYER POINTS' ? 'PRAY'
        : name.includes('DECLARATION') ? 'DECLARATIONS'
        : name.includes('PRAYER') ? 'FINAL PRAYER'
        : name
      current = undefined
      continue
    }

    if (!section) {
      // The header block: the date line is the only part kept.
      guide.date = parseDate(line) ?? guide.date
      continue
    }

    if (section === 'KEY VERSE') {
      // The key verse is often repeated at the very end; the first one wins.
      if (!guide.keyVerse) {
        const { verse, ref } = splitVerse(line)
        guide.keyVerse = verse.replace(/^[“"]|[”"]$/g, '')
        guide.keyVerseRef = ref
      }
      continue
    }

    if (section === 'PRAY') {
      const numbered = /^(\d{1,2})[.)]\s*(.+)$/.exec(line)
      if (numbered && !BULLET.test(line)) {
        current = { title: numbered[2].trim(), points: [] }
        guide.prayers.push(current)
      } else if (current) {
        current.points.push(line.replace(BULLET, ''))
      }
      continue
    }

    if (section === 'FOCUS') { guide.focus.push(line.replace(BULLET, '')); continue }
    if (section === 'DECLARATIONS') { guide.declarations.push(line.replace(BULLET, '')); continue }
    paragraph.push(line)
  }
  flush()
  return guide
}

/** "2026-10-14" → "Wednesday, 14 October 2026". */
export function longDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' })
  return `${weekday}, ${d} ${MONTHS[m - 1].replace(/^./, (c) => c.toUpperCase())} ${y}`
}
