import { FaqList } from '@/components/faq-list'
import { CTA, JsonLd, PageIntro } from '@/components/site-shell'
import { faqJsonLd } from '@/config/meta'
import { routes } from '@/config/routes'
import { getContent } from '@/lib/server/content'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.faqs)

export default async function FAQsPage() {
  const { faqs, shared } = await getContent()
  return (
    <>
      <JsonLd data={faqJsonLd(faqs.list.items)} />
      <PageIntro {...faqs.intro} />
      <section className="section faq" aria-label="Frequently asked questions">
        <div className="container"><FaqList items={faqs.list.items} /></div>
      </section>
      <CTA content={shared.cta} />
    </>
  )
}
