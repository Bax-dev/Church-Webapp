import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { ContentIcon, Rich } from '@/components/content'
import { DistrictsFeature } from '@/components/sections'
import { CTA, PageIntro } from '@/components/site-shell'
import { homeFor } from '@/config/navigation'
import { routes } from '@/config/routes'
import { getContent } from '@/lib/server/content'
import { pageMetadata } from '@/lib/server/metadata'
import { getViewer } from '@/lib/server/session'

export const generateMetadata = pageMetadata(routes.members)

export default async function MembersPage() {
  const [viewer, { members, shared, navigation }] = await Promise.all([getViewer(), getContent()])
  const home = homeFor(viewer, navigation.header)
  const { features, portal } = members
  return (
    <>
      <PageIntro {...members.intro} />

      <section className="section member-steps" aria-labelledby="member-steps-title">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{features.eyebrow}</span>
            <h2 id="member-steps-title"><Rich text={features.title} /></h2>
            <p>{features.text}</p>
          </div>
          <div className="member-feature-grid">
            {features.items.map((item, index) => (
              <article className="member-feature" key={index}>
                <span className="member-feature-icon"><ContentIcon name={item.icon} size={20} /></span>
                <span className="member-feature-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <DistrictsFeature content={members.districts} />

      <section className="member-status" aria-labelledby="member-status-title">
        <div className="container member-status-inner">
          <div>
            <span className="eyebrow">{portal.eyebrow}</span>
            <h2 id="member-status-title">{viewer ? portal.memberTitle.replace('{name}', viewer.firstName) : portal.guestTitle}</h2>
            <p>{viewer ? portal.memberText : portal.guestText}</p>
          </div>
          <div className="member-status-links">
            {viewer ? (
              <>
                <Link className="button-primary" href={home.href}>{home.label} <ArrowRight size={16} /></Link>
                <Link className="pathway-link" href={routes.profileEdit.path}>{portal.editLabel} <ArrowRight size={15} /></Link>
              </>
            ) : (
              <>
                <Link className="button-primary" href={routes.login.path}>{portal.loginLabel} <ArrowRight size={16} /></Link>
                <Link className="pathway-link" href={routes.signup.path}>{portal.signupLabel} <ArrowRight size={15} /></Link>
              </>
            )}
          </div>
        </div>
      </section>

      <CTA content={shared.cta} />
    </>
  )
}
