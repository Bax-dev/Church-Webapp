import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { PageIntro } from '@/components/site-shell'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'

// Next.js marks this page noindex itself.
export const metadata = metadataFor(routes.notFound)

export default function NotFound() {
  return (
    <>
      <PageIntro eyebrow="Page not found" title="This page is not here." text="The page you were looking for may have moved." />
      <section className="section">
        <div className="container"><Link className="button-primary" href="/">Back to home <ArrowRight size={16} /></Link></div>
      </section>
    </>
  )
}
