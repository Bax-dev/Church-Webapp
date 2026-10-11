/**
 * Every navigation menu on the site — header, footer and the portal sidebars — is built from these lists.
 * Each link says who sees it, so the menus follow the visitor's session: guests, signed-in members, or Super Admins.
 */
import type { Viewer } from './session'
import { routes } from './routes'

/** guest: signed out only · member: anyone signed in · admin: Super Admins only · everyone (default). */
export type Audience = 'everyone' | 'guest' | 'member' | 'admin'
export type NavLink = { href: string; label: string; show?: Audience }

export function canSee(show: Audience = 'everyone', viewer: Viewer) {
  if (show === 'guest') return !viewer
  if (show === 'member') return Boolean(viewer)
  if (show === 'admin') return viewer?.role === 'SUPER_ADMIN'
  return true
}

export const visibleTo = <T extends { show?: Audience }>(links: T[], viewer: Viewer) => links.filter((link) => canSee(link.show, viewer))

/** Where "my account" goes for this visitor. */
export const homeFor = (viewer: Viewer) =>
  viewer?.role === 'SUPER_ADMIN' ? { href: routes.admin.path, label: 'Admin' } : { href: routes.dashboard.path, label: 'My dashboard' }

export const headerLinks: NavLink[] = [
  { href: routes.about.path, label: routes.about.title },
  { href: routes.getInvolved.path, label: routes.getInvolved.title },
  { href: routes.members.path, label: routes.members.title },
  { href: routes.visit.path, label: 'Visit' },
  { href: routes.faqs.path, label: routes.faqs.title },
  { href: routes.login.path, label: 'Member login', show: 'guest' },
]

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: 'Explore',
    links: [
      { href: routes.about.path, label: 'About us' },
      { href: routes.getInvolved.path, label: 'Get involved' },
      { href: routes.members.path, label: 'Member hub' },
    ],
  },
  {
    title: 'Members',
    links: [
      { href: routes.login.path, label: 'Sign in', show: 'guest' },
      { href: routes.signup.path, label: 'Create an account', show: 'guest' },
      { href: routes.dashboard.path, label: 'My dashboard', show: 'member' },
      { href: routes.profile.path, label: 'My profile', show: 'member' },
      { href: routes.settings.path, label: 'Account settings', show: 'member' },
      { href: routes.admin.path, label: 'Admin', show: 'admin' },
    ],
  },
  {
    title: 'Next step',
    links: [
      { href: routes.visit.path, label: 'Plan a visit' },
      { href: routes.faqs.path, label: 'Common questions' },
    ],
  },
]

export type PortalNavKey =
  | 'dashboard' | 'profile' | 'settings' | 'admin' | 'adminMembers' | 'adminDepartments' | 'adminDistricts'
  | 'adminReports' | 'adminAuditLog' | 'adminUsers' | 'adminPastors' | 'adminAnnouncements' | 'adminSettings'

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
