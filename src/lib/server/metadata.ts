import type { Metadata } from 'next'

import type { SiteContent } from '@/config/content'
import { metadataFor } from '@/config/meta'
import { routes, type SiteRoute } from '@/config/routes'
import { getContent } from '@/lib/server/content'

/** Public pages whose title and description are edited under Site content → Search & sharing. */
const seoKeys: Partial<Record<string, Exclude<keyof SiteContent['seo'], 'home'>>> = {
  [routes.about.path]: 'about',
  [routes.getInvolved.path]: 'getInvolved',
  [routes.members.path]: 'members',
  [routes.gallery.path]: 'gallery',
  [routes.visit.path]: 'visit',
  [routes.faqs.path]: 'faqs',
}

/** The page's head from the site content: the church name everywhere, and the edited title and description for public pages. */
export async function contentMetadata(route: SiteRoute): Promise<Metadata> {
  const { site, seo } = await getContent()
  const key = seoKeys[route.path]
  const edited = key ? { ...route, title: seo[key].title, description: seo[key].description } : route
  const metadata = metadataFor(edited, site)
  // The 404 page answers for whatever URL was asked for; pointing its canonical at /404/ (or anywhere) would be wrong.
  if (route.path === routes.notFound.path) return { ...metadata, alternates: { ...metadata.alternates, canonical: null } }
  if (route.path !== routes.home.path) return metadata
  // The home page's tab title is used as-is, without "— church name" added.
  const title = seo.home.title
  return { ...metadata, title: { absolute: title }, openGraph: { ...metadata.openGraph, title }, twitter: { ...metadata.twitter, title } }
}

/** `export const generateMetadata = pageMetadata(routes.x)` */
export const pageMetadata = (route: SiteRoute) => () => contentMetadata(route)
