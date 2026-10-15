import Link from 'next/link'
import { ArrowRight, Building2, CalendarHeart, MapPin, Pencil } from 'lucide-react'

import { Panel, PortalHeading, StatusBadge } from '@/components/portal/ui'
import { formatDate, lookupName, profileFields } from '@/config/portal'
import { routes } from '@/config/routes'
import { departmentPeers, listLookups, toMember } from '@/lib/server/members'
import { getContent } from '@/lib/server/content'
import { requireMember } from '@/lib/server/session'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.dashboard)

export default async function DashboardPage() {
  const me = toMember(await requireMember())
  const [departments, districts, peers, { portal }] = await Promise.all([listLookups('department'), listLookups('district'), departmentPeers(me.departmentId), getContent()])
  const copy = portal.dashboard
  const complete = profileFields.filter((key) => me[key]).length
  const percent = Math.round((complete / profileFields.length) * 100)
  const others = Math.max(0, peers - (me.status === 'ACTIVE' ? 1 : 0))

  return (
    <>
      <PortalHeading
        eyebrow={copy.eyebrow}
        title={copy.title.replaceAll('{name}', me.firstName)}
        text={percent < 100 ? copy.incompleteText : copy.completeText}
        actions={<Link className="button-primary" href={routes.profileEdit.path}><Pencil size={15} /> Update my details</Link>}
      />

      <div className="dash-grid">
        <Panel title={copy.recordTitle}>
          <div className="completion">
            <div className="completion-head"><span>Profile complete</span><strong>{percent}%</strong></div>
            <div className="bar-track" role="img" aria-label={`${percent}% of your profile is complete`}><span className="bar-fill" style={{ width: `${percent}%` }} /></div>
          </div>
          <ul className="summary-list">
            <li><span>Account status</span><StatusBadge status={me.status} /></li>
            <li><span>Email</span><strong>{me.email}</strong></li>
            <li><span>Member since</span><strong>{formatDate(me.createdAt)}</strong></li>
          </ul>
          <Link className="pathway-link" href={routes.profile.path}>View full profile <ArrowRight size={15} /></Link>
        </Panel>

        <Panel title={copy.familyTitle}>
          <ul className="icon-list">
            <li>
              <span className="card-icon"><Building2 size={17} strokeWidth={1.7} /></span>
              <div>
                <small>Department</small><strong>{lookupName(departments, me.departmentId)}</strong>
                {me.departmentId ? <span>{others} other active {others === 1 ? 'member' : 'members'}</span> : <span>Choose one from your profile</span>}
              </div>
            </li>
            <li><span className="card-icon"><MapPin size={17} strokeWidth={1.7} /></span><div><small>District</small><strong>{lookupName(districts, me.districtId)}</strong></div></li>
            <li><span className="card-icon"><CalendarHeart size={17} strokeWidth={1.7} /></span><div><small>Birthday</small><strong>{formatDate(me.dateOfBirth, false)}</strong></div></li>
          </ul>
        </Panel>
      </div>

      <Panel title={copy.quickLinksTitle}>
        <div className="quick-links">
          <Link href={routes.profileEdit.path}>Edit my profile <ArrowRight size={15} /></Link>
          <Link href={routes.settings.path}>Change my password <ArrowRight size={15} /></Link>
          <Link href={routes.visit.path}>Service information <ArrowRight size={15} /></Link>
          <Link href={routes.faqs.path}>Common questions <ArrowRight size={15} /></Link>
        </div>
      </Panel>
    </>
  )
}
