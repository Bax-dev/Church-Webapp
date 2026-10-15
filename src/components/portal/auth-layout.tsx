import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

import { Rich } from '@/components/content'
import { getContent } from '@/lib/server/content'

type Page = keyof Omit<Awaited<ReturnType<typeof getContent>>['auth'], 'benefits'>

/** The sign-in pages' shared layout. The left-hand wording comes from Site content → Sign-in pages. */
export async function AuthLayout({ page, children, wide }: { page: Page; children: ReactNode; wide?: boolean }) {
  const { auth } = await getContent()
  const { eyebrow, title, text } = auth[page]
  const benefits = auth.benefits.items
  return (
    <section className="auth" aria-labelledby="page-title">
      <div className={`container auth-layout${wide ? ' wide' : ''}`}>
        <div className="auth-aside">
          <span className="hero-label eyebrow">{eyebrow}</span>
          <h1 id="page-title"><Rich text={title} /></h1>
          <p>{text}</p>
          {benefits.length > 0 && (
            <ul className="feature-list">
              {benefits.map((item, index) => <li key={index}><Check size={17} /><span>{item}</span></li>)}
            </ul>
          )}
        </div>
        <div className="auth-card">
          {children}
        </div>
      </div>
    </section>
  )
}
