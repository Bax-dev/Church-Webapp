import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

const benefits = [
  'Keep your contact details and address up to date',
  'Choose your department and district',
  'Make sure the church never misses your birthday',
]

export function AuthLayout({ eyebrow, title, text, children, wide }: { eyebrow: string; title: ReactNode; text: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className="auth" aria-labelledby="page-title">
      <div className={`container auth-layout${wide ? ' wide' : ''}`}>
        <div className="auth-aside">
          <span className="hero-label eyebrow">{eyebrow}</span>
          <h1 id="page-title">{title}</h1>
          <p>{text}</p>
          <ul className="feature-list">
            {benefits.map((item) => <li key={item}><Check size={17} /><span>{item}</span></li>)}
          </ul>
        </div>
        <div className="auth-card">
          {children}
        </div>
      </div>
    </section>
  )
}
