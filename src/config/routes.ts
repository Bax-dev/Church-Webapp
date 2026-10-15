export type SiteRoute = {
  path: string
  /** Omitted on the home page, which uses the site's default title verbatim. */
  title?: string
  description: string
  /** Portal pages are kept out of search results. */
  noindex?: boolean
}

/** Each page's metadata reads its entry here; the header and footer link to these paths. */
export const routes = {
  home: {
    path: '/',
    description:
      'Presbyterian Centre is a church family on the Lekki–Epe Expressway, Lekki, Lagos. Join us to worship God, grow in His Word and serve one another.',
  },
  about: {
    path: '/about',
    title: 'About us',
    description:
      'Who we are and what we believe: a Presbyterian congregation in Lekki rooted in the Reformed tradition, gathered around worship, the Word, fellowship and service.',
  },
  getInvolved: {
    path: '/get-involved',
    title: 'Get involved',
    description:
      'Whether you are visiting for the first time or have worshipped with us for years, there is a place for you at Presbyterian Centre.',
  },
  members: {
    path: '/members',
    title: 'Member hub',
    description:
      'Find ways to belong, serve and stay connected at Presbyterian Centre, and sign in to the member portal.',
  },
  visit: {
    path: '/visit',
    title: 'Plan your visit',
    description:
      'Join us for worship at Presbyterian Centre on the Lekki–Epe Expressway, Lekki. Come as you are — you are welcome.',
  },
  faqs: {
    path: '/faqs',
    title: 'FAQs',
    description: 'Answers for first-time visitors and members of Presbyterian Centre, Lekki.',
  },
  gallery: {
    path: '/gallery',
    title: 'Gallery',
    description: 'Photos of worship, fellowship and service at Presbyterian Centre, Lekki.',
  },
  /** Shown only while the prayer programme is switched on (/admin/prayer). */
  prayer: {
    path: '/prayer',
    title: 'Prayer',
    description: 'Join our midnight prayer programme online by YouTube or Zoom, and pray along with the daily prayer guide.',
  },
  notFound: {
    path: '/404',
    title: 'Page not found',
    description: 'The page you were looking for is not here.',
  },

  // Member portal (PRD §9)
  login: { path: '/login', title: 'Sign in', description: 'Sign in to the Presbyterian Centre member portal.', noindex: true },
  signup: { path: '/signup', title: 'Create your account', description: 'Join the Presbyterian Centre member portal.', noindex: true },
  setPassword: { path: '/set-password', title: 'Set your password', description: 'Choose a password to finish creating your account.', noindex: true },
  forgotPassword: { path: '/forgot-password', title: 'Forgot password', description: 'Request a link to reset your password.', noindex: true },
  resetPassword: { path: '/reset-password', title: 'Reset password', description: 'Choose a new password for your account.', noindex: true },
  dashboard: { path: '/dashboard', title: 'My dashboard', description: 'Your member home at Presbyterian Centre.', noindex: true },
  profile: { path: '/profile', title: 'My profile', description: 'The details the church holds about you.', noindex: true },
  profileEdit: { path: '/profile/edit', title: 'Edit profile', description: 'Update your member details.', noindex: true },
  settings: { path: '/settings', title: 'Account settings', description: 'Change your password or request account deletion.', noindex: true },

  // Super Admin (PRD §6.2)
  admin: { path: '/admin', title: 'Admin dashboard', description: 'Membership overview for church leadership.', noindex: true },
  adminMembers: { path: '/admin/members', title: 'Members', description: 'Search, filter and export the member directory.', noindex: true },
  adminDepartments: { path: '/admin/departments', title: 'Departments', description: 'Manage church departments.', noindex: true },
  adminDistricts: { path: '/admin/districts', title: 'Districts', description: 'Manage church districts.', noindex: true },
  adminReports: { path: '/admin/reports', title: 'Reports', description: 'Membership reports by birthday, department, district and marital status.', noindex: true },
  adminAuditLog: { path: '/admin/audit-log', title: 'Audit log', description: 'Every change made in the portal.', noindex: true },
  adminUsers: { path: '/admin/users', title: 'Administrators', description: 'Manage Super Admin accounts.', noindex: true },
  adminPrayer: { path: '/admin/prayer', title: 'Prayer programme', description: 'The prayer programme, its online links and the daily prayer guides.', noindex: true },
  adminContent: { path: '/admin/content', title: 'Site content', description: 'Edit the text and images on every page of the website.', noindex: true },
  adminPastors: { path: '/admin/pastors', title: 'Pastors', description: 'Manage the pastors shown on the About page.', noindex: true },
  adminAnnouncements: { path: '/admin/announcements', title: 'Announcements', description: 'Write and schedule the site popup announcement.', noindex: true },
  adminSettings: { path: '/admin/settings', title: 'Portal settings', description: 'Sign-up approval and portal settings.', noindex: true },
} satisfies Record<string, SiteRoute>
