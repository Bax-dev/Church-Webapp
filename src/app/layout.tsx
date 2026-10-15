import type { Metadata, Viewport } from 'next'
import { DM_Sans, Manrope, Newsreader } from 'next/font/google'

import { AnnouncementPopup } from '@/components/announcement-popup'
import { MotionProvider } from '@/components/motion/motion-provider'
import { ScrollReveal } from '@/components/motion/scroll-reveal'
import { JsonLd, SiteFrame } from '@/components/site-shell'
import { churchJsonLd } from '@/config/meta'
import { routes } from '@/config/routes'
import { SITE } from '@/config/site'
import { getContent } from '@/lib/server/content'
import { contentMetadata } from '@/lib/server/metadata'

import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-dm-sans' })
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-manrope' })
const newsreader = Newsreader({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-newsreader' })

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getContent()
  const name = site.identity.name
  return {
    ...(await contentMetadata(routes.home)),
    metadataBase: new URL(SITE.url),
    applicationName: name,
    keywords: [...SITE.keywords],
    authors: [{ name, url: SITE.url }],
    creator: name,
    publisher: name,
    category: 'religion',
    formatDetection: { telephone: false, email: false, address: false },
  }
}

export const viewport: Viewport = {
  themeColor: '#164b91',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent()
  return (
    // data-scroll-behavior tells Next to switch smooth scrolling off during route changes, so a new page opens at the top.
    <html lang="en" data-scroll-behavior="smooth" className={`${dmSans.variable} ${manrope.variable} ${newsreader.variable}`}>
      <body>
        <JsonLd data={churchJsonLd(content.site)} />
        <MotionProvider>
          <SiteFrame>{children}</SiteFrame>
          <AnnouncementPopup labels={content.site.popup} />
          <ScrollReveal />
        </MotionProvider>
      </body>
    </html>
  )
}
