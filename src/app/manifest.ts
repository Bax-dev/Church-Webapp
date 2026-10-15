import type { MetadataRoute } from 'next'

import { getContent } from '@/lib/server/content'

/** Read on request, so the installed-app name follows Admin → Site content → Church details. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { identity, address } = (await getContent()).site
  return {
    name: `${identity.name}, ${address.locality}`,
    short_name: identity.name,
    description: identity.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#164b91',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
