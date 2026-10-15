import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { PageIntro } from '@/components/site-shell'
import { routes } from '@/config/routes'
import { getContent } from '@/lib/server/content'
import { pageMetadata } from '@/lib/server/metadata'

// Next.js marks this page noindex itself.
export const generateMetadata = pageMetadata(routes.notFound)

export default async function NotFound() {
  const { page } = (await getContent()).notFound
  return (
    <>
      <PageIntro eyebrow={page.eyebrow} title={page.title} text={page.text} />
      <section className="section">
        <div className="container"><Link className="button-primary" href="/">{page.buttonLabel} <ArrowRight size={16} /></Link></div>
      </section>
    </>
  )
}
