import Link from 'next/link'
import { ArrowRight, Heart, ShieldCheck, Users } from 'lucide-react'

import { DistrictsFeature } from '@/components/sections'
import { CTA, PageIntro } from '@/components/site-shell'
import { metadataFor } from '@/config/meta'
import { homeFor } from '@/config/navigation'
import { routes } from '@/config/routes'
import { SITE } from '@/config/site'
import { getViewer } from '@/lib/server/session'

export const metadata = metadataFor(routes.members)

const memberFeatures = [
  {
    icon: Users,
    title: 'Find your place',
    text: 'Connect with a department or district and discover ways to grow and serve alongside others.',
  },
  {
    icon: Heart,
    title: 'Keep your details current',
    text: 'The member portal lets you review and update your own contact and profile details, department and district.',
  },
  {
    icon: ShieldCheck,
    title: 'Your information, handled with care',
    text: 'Only you and the church administrators can see your record, and you can ask to see, correct or delete it at any time.',
  },
]

export default async function MembersPage() {
  const viewer = await getViewer()
  const home = homeFor(viewer)
  return (
    <>
      <PageIntro
        image="youth"
        eyebrow="Member hub"
        title={<>A place to belong.<br /><em>A family</em> to grow with.</>}
        text={`Being part of ${SITE.name} means worshipping, serving and caring for one another together. Find a next step, or sign in to the member portal.`}
      />

      <section className="section member-steps" aria-labelledby="member-steps-title">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Life together</span>
            <h2 id="member-steps-title">Stay connected<br />to your church family.</h2>
            <p>Whether you are new to the congregation or have been here for years, there is a next step for you.</p>
          </div>
          <div className="member-feature-grid">
            {memberFeatures.map(({ icon: Icon, title, text }, index) => (
              <article className="member-feature" key={title}>
                <span className="member-feature-icon"><Icon size={20} strokeWidth={1.7} /></span>
                <span className="member-feature-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <DistrictsFeature />

      <section className="member-status" aria-labelledby="member-status-title">
        <div className="container member-status-inner">
          {viewer ? (
            <div>
              <span className="eyebrow">Member portal</span>
              <h2 id="member-status-title">Welcome back, {viewer.firstName}.</h2>
              <p>Check your details are up to date, or update your department and district.</p>
            </div>
          ) : (
            <div>
              <span className="eyebrow">Member portal</span>
              <h2 id="member-status-title">Keep your details up to date.</h2>
              <p>Create an account with your name and email address, then add your contact details, birthday, department and district from your dashboard.</p>
            </div>
          )}
          <div className="member-status-links">
            {viewer ? (
              <>
                <Link className="button-primary" href={home.href}>{home.label} <ArrowRight size={16} /></Link>
                <Link className="pathway-link" href={routes.profileEdit.path}>Update my details <ArrowRight size={15} /></Link>
              </>
            ) : (
              <>
                <Link className="button-primary" href={routes.login.path}>Member login <ArrowRight size={16} /></Link>
                <Link className="pathway-link" href={routes.signup.path}>Create an account <ArrowRight size={15} /></Link>
              </>
            )}
          </div>
        </div>
      </section>

      <CTA />
    </>
  )
}
