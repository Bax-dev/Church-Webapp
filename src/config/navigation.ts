/**
 * Every navigation menu on the site — header, footer and the portal sidebars — is built from these lists.
 * Each link says who sees it, so the menus follow the visitor's session: guests, signed-in members, or Super Admins.
 */
import type { Viewer } from './session'
import { routes } from './routes'

/** guest: signed out only · member: anyone signed in · admin: Super Admins only · everyone (default). */
export type Audience = 'everyone' | 'guest' | 'member' | 'admin'
/** `key` names the link's wording in Site content → Menus; `label` is the fallback. */
export type NavLink = { href: string; label: string; show?: Audience; key?: string }

export function canSee(show: Audience = 'everyone', viewer: Viewer) {
  if (show === 'guest') return !viewer
  if (show === 'member') return Boolean(viewer)
  if (show === 'admin') return viewer?.role === 'SUPER_ADMIN'
  return true
}

export const visibleTo = <T extends { show?: Audience }>(links: T[], viewer: Viewer) => links.filter((link) => canSee(link.show, viewer))

/** Swaps each link's label for its wording in the site content, where it has one. */
export const labelled = <T extends NavLink>(links: T[], labels?: Record<string, string>) =>
  links.map((link) => (link.key && labels?.[link.key] ? { ...link, label: labels[link.key] } : link))

/** Where "my account" goes for this visitor. */
export const homeFor = (viewer: Viewer, labels?: { dashboard?: string; admin?: string }) =>
  viewer?.role === 'SUPER_ADMIN'
    ? { href: routes.admin.path, label: labels?.admin || 'Admin' }
    : { href: routes.dashboard.path, label: labels?.dashboard || 'My dashboard' }

export const headerLinks: NavLink[] = [
  { href: routes.about.path, label: routes.about.title, key: 'about' },
  { href: routes.getInvolved.path, label: routes.getInvolved.title, key: 'getInvolved' },
  { href: routes.members.path, label: routes.members.title, key: 'members' },
  { href: routes.gallery.path, label: routes.gallery.title, key: 'gallery' },
  { href: routes.visit.path, label: 'Visit', key: 'visit' },
  { href: routes.faqs.path, label: routes.faqs.title, key: 'faqs' },
  { href: routes.login.path, label: 'Member login', show: 'guest', key: 'login' },
]

/** Links that exist only while a feature is switched on; SiteFrame adds them to the header and footer. */
export const prayerLink: NavLink = { href: routes.prayer.path, label: routes.prayer.title, key: 'prayer' }

/** Puts optional links before "Member login", so the guest/member link stays last. */
export function withExtras(links: NavLink[], extras: NavLink[]) {
  const login = links.findIndex((link) => link.href === routes.login.path)
  return login < 0 ? [...links, ...extras] : [...links.slice(0, login), ...extras, ...links.slice(login)]
}

/** `titleKey` names the column heading in Site content → Menus → Footer. */
export const footerColumns: { title: string; titleKey: string; links: NavLink[] }[] = [
  {
    title: 'Explore',
    titleKey: 'exploreTitle',
    links: [
      { href: routes.about.path, label: 'About us', key: 'about' },
      { href: routes.getInvolved.path, label: 'Get involved', key: 'getInvolved' },
      { href: routes.members.path, label: 'Member hub', key: 'members' },
      { href: routes.gallery.path, label: 'Gallery', key: 'gallery' },
    ],
  },
  {
    title: 'Members',
    titleKey: 'membersTitle',
    links: [
      { href: routes.login.path, label: 'Sign in', show: 'guest', key: 'signIn' },
      { href: routes.signup.path, label: 'Create an account', show: 'guest', key: 'signup' },
      { href: routes.dashboard.path, label: 'My dashboard', show: 'member', key: 'dashboard' },
      { href: routes.profile.path, label: 'My profile', show: 'member', key: 'profile' },
      { href: routes.settings.path, label: 'Account settings', show: 'member', key: 'settings' },
      { href: routes.admin.path, label: 'Admin', show: 'admin', key: 'admin' },
    ],
  },
  {
    title: 'Next step',
    titleKey: 'nextTitle',
    links: [
      { href: routes.visit.path, label: 'Plan a visit', key: 'visit' },
      { href: routes.faqs.path, label: 'Common questions', key: 'faqs' },
    ],
  },
]

export type PortalNavKey =
  | 'dashboard' | 'profile' | 'settings' | 'admin' | 'adminMembers' | 'adminDepartments' | 'adminDistricts'
  | 'adminReports' | 'adminAuditLog' | 'adminUsers' | 'adminPrayer' | 'adminContent' | 'adminPastors' | 'adminAnnouncements' | 'adminSettings'

/** Sidebar entries; icons are attached in the client component. A Super Admin sees a shortcut to the other area too. */
export const memberSidebar: (NavLink & { key: PortalNavKey })[] = [
  { key: 'dashboard', href: routes.dashboard.path, label: 'Dashboard' },
  { key: 'profile', href: routes.profile.path, label: 'My profile' },
  { key: 'settings', href: routes.settings.path, label: 'Settings' },
  { key: 'admin', href: routes.admin.path, label: 'Admin area', show: 'admin' },
]

export const adminSidebar: (NavLink & { key: PortalNavKey })[] = [
  { key: 'admin', href: routes.admin.path, label: 'Overview' },
  { key: 'adminMembers', href: routes.adminMembers.path, label: 'Members' },
  { key: 'adminDepartments', href: routes.adminDepartments.path, label: 'Departments' },
  { key: 'adminDistricts', href: routes.adminDistricts.path, label: 'Districts' },
  { key: 'adminReports', href: routes.adminReports.path, label: 'Reports' },
  { key: 'adminAuditLog', href: routes.adminAuditLog.path, label: 'Audit log' },
  { key: 'adminUsers', href: routes.adminUsers.path, label: 'Administrators' },
  { key: 'adminContent', href: routes.adminContent.path, label: 'Site content' },
  { key: 'adminPrayer', href: routes.adminPrayer.path, label: 'Prayer programme' },
  { key: 'adminPastors', href: routes.adminPastors.path, label: 'Pastors' },
  { key: 'adminAnnouncements', href: routes.adminAnnouncements.path, label: 'Announcements' },
  { key: 'adminSettings', href: routes.adminSettings.path, label: 'Settings' },
  { key: 'dashboard', href: routes.dashboard.path, label: 'My dashboard' },
]

/** The link a path belongs to: the most specific match wins, so /admin/members/x highlights "Members", not "Overview". */
export function activeHref(links: { href: string }[], pathname: string) {
  // trailingSlash is on, so the current path arrives as '/admin/members/'.
  const current = pathname.replace(/\/$/, '') || '/'
  return links
    .filter((link) => current === link.href || (link.href !== '/' && current.startsWith(`${link.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
}
