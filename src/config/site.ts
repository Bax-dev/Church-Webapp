/** Single source of truth for everything that describes the church to search engines and social scrapers. */
export const SITE = {
  name: 'Presbyterian Centre',
  caption: 'Lekki, Lagos',
  defaultTitle: 'Presbyterian Centre, Lekki — Worship, Fellowship, Service',
  description:
    'Presbyterian Centre is a church family on the Lekki–Epe Expressway, Lekki, Lagos. Join us to worship God, grow in His Word and serve one another.',
  /** Absolute origin used for canonical URLs, the sitemap and social cards. Set NEXT_PUBLIC_SITE_URL at build time. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  denomination: 'The Presbyterian Church of Nigeria',
  logo: { path: '/logo.jpg', width: 903, height: 609, alt: 'Emblem of The Presbyterian Church of Nigeria' },
  keywords: [
    'Presbyterian Centre',
    'Presbyterian Church of Nigeria',
    'church in Lekki',
    'church on Lekki–Epe Expressway',
    'Lagos church',
    'Reformed church Lagos',
    'Sunday worship Lekki',
  ],
  locale: 'en_NG',
  address: {
    street: 'Lekki–Epe Expressway',
    locality: 'Lekki',
    region: 'Lagos',
    country: 'NG',
  },
} as const

export function titleFor(title?: string) {
  return title ? `${title} — ${SITE.name}` : SITE.defaultTitle
}
