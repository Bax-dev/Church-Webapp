import { FaqList } from '@/components/faq-list'
import { CTA, JsonLd, PageIntro } from '@/components/site-shell'
import { faqJsonLd, metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'

export const metadata = metadataFor(routes.faqs)

export default function FAQsPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <PageIntro
        image="bible-study"
        eyebrow="FAQs"
        title={<>A few things you<br />may be <em>wondering.</em></>}
        text="Some answers for first-time visitors and members alike."
      />
      <section className="section faq" aria-label="Frequently asked questions">
        <div className="container"><FaqList /></div>
      </section>
      <CTA />
    </>
  )
}
