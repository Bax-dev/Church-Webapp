import Link from 'next/link'
import { connection } from 'next/server'
import { ArrowRight } from 'lucide-react'

import { Rich } from '@/components/content'
import { routes } from '@/config/routes'
import { getPastors } from '@/lib/server/pastors'

/** The section's own wording, from Site content (Home, About or Gallery → Our pastors). */
type PastorsContent = { show: boolean; eyebrow: string; title: string; text: string; linkLabel?: string }

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(-2).map((word) => word[0]).join('').toUpperCase()

/**
 * "Our pastors", read from the database on each request so a save in /admin/pastors shows straight away.
 * Used on Home, About and Gallery; hidden when switched off for that page, or while the list is empty.
 */
export async function Pastors({ content }: { content: PastorsContent }) {
  if (!content.show) return null
  await connection()
  // If the list cannot be read, the page still renders, just without this section.
  const pastors = await getPastors().catch((error) => {
    console.error('[pastors] could not load pastors', error)
    return []
  })
  if (pastors.length === 0) return null

  return (
    <section className="section pastors" id="pastors" aria-labelledby="pastors-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 id="pastors-title"><Rich text={content.title} /></h2>
          <p>{content.text}</p>
        </div>
        <ul className="pastor-grid">
          {pastors.map((pastor) => (
            <li key={pastor.id} className="pastor-card">
              <div className="pastor-photo">
                {pastor.photoUrl
                  // eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime, so next/image has no dimensions for it
                  ? <img src={pastor.photoUrl} alt={`Portrait of ${pastor.name}`} loading="lazy" />
                  : <span aria-hidden="true">{initialsOf(pastor.name)}</span>}
              </div>
              <h3>{pastor.name}</h3>
              <span className="pastor-title">{pastor.title}</span>
              {pastor.bio && <p>{pastor.bio}</p>}
            </li>
          ))}
        </ul>
        {content.linkLabel && (
          <Link className="pathway-link pastors-link" href={`${routes.about.path}/#pastors`}>{content.linkLabel} <ArrowRight size={15} /></Link>
        )}
      </div>
    </section>
  )
}
