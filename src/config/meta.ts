import type { Metadata } from 'next'

import type { SiteContent } from './content'
import type { SiteRoute } from './routes'
import { SITE } from './site'

type Site = SiteContent['site']

/** The church name and address as edited in the site content; the defaults when called without it. */
const nameOf = (site?: Site) => site?.identity.name ?? SITE.name

export function titleFor(title: string | undefined, site?: Site) {
  return title ? `${title} — ${nameOf(site)}` : site ? `${nameOf(site)}, ${site.address.locality} — Worship, Fellowship, Service` : SITE.defaultTitle
}

const socialImage = { url: SITE.logo.path, width: SITE.logo.width, height: SITE.logo.height, alt: SITE.logo.alt }

/**
 * Builds a page's <head> from its route-table entry, so titles and social cards stay in one place.
 * Pages pass the site content (via pageMetadata in src/lib/server/metadata.ts) so the church name follows edits.
 */
export function metadataFor(route: SiteRoute, site?: Site): Metadata {
  const title = titleFor(route.title, site)
  // The home page has no description of its own: it uses the church's description from the site content.
  const description = route.path === '/' && site ? site.identity.description : route.description
  // trailingSlash is on, so canonical URLs end in '/' to match what the host serves.
  const canonical = route.path === '/' ? '/' : `${route.path}/`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: nameOf(site),
      locale: SITE.locale,
      url: canonical,
      title,
      description,
      images: [socialImage],
    },
    twitter: { card: 'summary', title, description, images: [socialImage] },
    ...(route.noindex && { robots: { index: false, follow: false } }),
  }
}

/** Describes the church itself; rendered on every page so any entry point carries it. */
export function churchJsonLd(site: Site) {
  const { name, description } = site.identity
  const { street, locality, region } = site.address
  return {
    '@context': 'https://schema.org',
    '@type': 'Church',
    '@id': `${SITE.url}/#church`,
    name,
    alternateName: `${name}, ${locality}`,
    description,
    url: `${SITE.url}/`,
    logo: `${SITE.url}${SITE.logo.path}`,
    image: `${SITE.url}${SITE.logo.path}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: street,
      addressLocality: locality,
      addressRegion: region,
      addressCountry: SITE.address.country,
    },
    containedInPlace: { '@type': 'City', name: `${locality}, ${region}` },
    additionalProperty: { '@type': 'PropertyValue', name: 'Denomination', value: SITE.denomination },
  }
}

export function faqJsonLd(items: SiteContent['faqs']['list']['items']) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}
