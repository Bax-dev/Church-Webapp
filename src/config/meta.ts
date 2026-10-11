import type { Metadata } from 'next'

import { faqs } from './faqs'
import type { SiteRoute } from './routes'
import { SITE, titleFor } from './site'

const socialImage = { url: SITE.logo.path, width: SITE.logo.width, height: SITE.logo.height, alt: SITE.logo.alt }

/** Builds a page's <head> from its route-table entry, so titles and social cards stay in one place. */
export function metadataFor(route: SiteRoute): Metadata {
  const title = titleFor(route.title)
  // trailingSlash is on, so canonical URLs end in '/' to match what the host serves.
  const canonical = route.path === '/' ? '/' : `${route.path}/`
  return {
    title: { absolute: title },
    description: route.description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      locale: SITE.locale,
      url: canonical,
      title,
      description: route.description,
      images: [socialImage],
    },
    twitter: { card: 'summary', title, description: route.description, images: [socialImage] },
    ...(route.noindex && { robots: { index: false, follow: false } }),
  }
}

/** Describes the church itself; rendered on every page so any entry point carries it. */
export const churchJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Church',
  '@id': `${SITE.url}/#church`,
  name: SITE.name,
  alternateName: `${SITE.name}, ${SITE.address.locality}`,
  description: SITE.description,
  url: `${SITE.url}/`,
  logo: `${SITE.url}${SITE.logo.path}`,
  image: `${SITE.url}${SITE.logo.path}`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.locality,
    addressRegion: SITE.address.region,
    addressCountry: SITE.address.country,
  },
  containedInPlace: { '@type': 'City', name: `${SITE.address.locality}, ${SITE.address.region}` },
  additionalProperty: { '@type': 'PropertyValue', name: 'Denomination', value: SITE.denomination },
}

export const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}
