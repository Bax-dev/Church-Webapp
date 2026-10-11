import type { Metadata, Viewport } from 'next'
import { DM_Sans, Manrope, Newsreader } from 'next/font/google'

import { AnnouncementPopup } from '@/components/announcement-popup'
import { MotionProvider } from '@/components/motion/motion-provider'
import { ScrollReveal } from '@/components/motion/scroll-reveal'
import { JsonLd, SiteFrame } from '@/components/site-shell'
import { churchJsonLd, metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'
import { SITE } from '@/config/site'

import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-dm-sans' })
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-manrope' })
const newsreader = Newsreader({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-newsreader' })

export const metadata: Metadata = {
  ...metadataFor(routes.home),
  metadataBase: new URL(SITE.url),
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: 'religion',
  formatDetection: { telephone: false, email: false, address: false },
}

export const viewport: Viewport = {
  themeColor: '#164b91',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${manrope.variable} ${newsreader.variable}`}>
      <body>
        <JsonLd data={churchJsonLd} />
        <MotionProvider>
          <SiteFrame>{children}</SiteFrame>
          <AnnouncementPopup />
          <ScrollReveal />
        </MotionProvider>
      </body>
    </html>
  )
}
