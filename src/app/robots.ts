import type { MetadataRoute } from 'next'

import { routes, type SiteRoute } from '@/config/routes'
import { SITE } from '@/config/site'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  // Portal pages also carry noindex; disallowing them here saves crawl budget.
  const portal = Object.values(routes as Record<string, SiteRoute>).filter((route) => route.noindex).map((route) => `${route.path}/`)
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', ...portal] },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
