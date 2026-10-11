/**
 * The site-wide popup announcement.
 *
 * The live content is stored in the database and served by GET /api/announcement on every page load;
 * Super Admins publish it from the admin "Announcements" page (PUT /api/admin/announcement).
 */

export const ANNOUNCEMENT_URL = '/api/announcement/'

/** Who the popup is for: visitors on the public site, signed-in members in the portal, or both. */
export const announcementAudiences = {
  public: 'Public website',
  members: 'Member portal',
  everyone: 'Both',
} as const

export type AnnouncementAudience = keyof typeof announcementAudiences

export type Announcement = {
  /** Change this whenever the content changes, so visitors who closed the old one see the new one. */
  id: string
  enabled: boolean
  title: string
  message: string
  link?: { label: string; href: string }
  audience: AnnouncementAudience
  /** ISO dates (yyyy-mm-dd). The popup shows from the start of `startsOn` to the end of `endsOn`. */
  startsOn?: string
  endsOn?: string
  /** Public pages only: "all", or a list of paths such as ["/", "/visit"]. Member-portal pages ignore it. */
  pages: 'all' | string[]
  /** Seconds to wait after the page loads. */
  delaySeconds?: number
}

const isString = (value: unknown): value is string => typeof value === 'string'
const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Turns untrusted JSON into an Announcement, or undefined if it is unusable. Unknown fields are dropped. */
export function parseAnnouncement(raw: unknown): Announcement | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const data = raw as Record<string, unknown>
  if (!isString(data.id) || !data.id.trim() || !isString(data.title) || !isString(data.message)) return undefined

  const link = data.link as Record<string, unknown> | undefined
  // Only same-site paths and http(s) links, so the file can never inject a javascript: URL.
  const safeHref = link && isString(link.href) && /^(\/(?!\/)|https?:\/\/)/.test(link.href) ? link.href : undefined

  return {
    id: data.id,
    enabled: data.enabled !== false,
    title: data.title,
    message: data.message,
    link: safeHref && isString(link?.label) ? { label: link.label, href: safeHref } : undefined,
    // Files written before the audience setting existed were public-only.
    audience: isString(data.audience) && data.audience in announcementAudiences ? (data.audience as AnnouncementAudience) : 'public',
    startsOn: isString(data.startsOn) && DATE.test(data.startsOn) ? data.startsOn : undefined,
    endsOn: isString(data.endsOn) && DATE.test(data.endsOn) ? data.endsOn : undefined,
    pages: Array.isArray(data.pages) ? data.pages.filter(isString) : 'all',
    delaySeconds: typeof data.delaySeconds === 'number' && data.delaySeconds >= 0 ? Math.min(data.delaySeconds, 30) : 1,
  }
}

/** Signed-in member pages. Admin and sign-in pages are in neither list and never show the popup. */
const MEMBER_PREFIXES = ['/dashboard', '/profile', '/settings']
const NO_POPUP_PREFIXES = ['/admin', '/login', '/signup', '/set-password', '/forgot-password', '/reset-password']

const under = (path: string, prefixes: string[]) => prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))

/** Whether the announcement should be visible on `path` at `now` (local time). */
export function isAnnouncementLive(a: Announcement, path: string, now = new Date()) {
  if (!a.enabled) return false
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (a.startsOn && today < a.startsOn) return false
  if (a.endsOn && today > a.endsOn) return false
  const clean = path.replace(/\/$/, '') || '/'
  if (under(clean, NO_POPUP_PREFIXES)) return false
  if (under(clean, MEMBER_PREFIXES)) return a.audience !== 'public'
  if (a.audience === 'members') return false
  return a.pages === 'all' || a.pages.some((page) => (page.replace(/\/$/, '') || '/') === clean)
}
