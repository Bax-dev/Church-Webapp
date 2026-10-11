import type { MetadataRoute } from 'next'

import { routes, type SiteRoute } from '@/config/routes'
import { SITE } from '@/config/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(routes as Record<string, SiteRoute>)
    .filter((route) => !route.noindex && route !== routes.notFound)
    .map((route) => ({
      url: route.path === '/' ? `${SITE.url}/` : `${SITE.url}${route.path}/`,
      changeFrequency: 'monthly',
      priority: route.path === '/' ? 1 : 0.7,
    }))
}
