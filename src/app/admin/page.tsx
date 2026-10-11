import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { BarList, Panel, PortalHeading, StatTile, StatusBadge } from '@/components/portal/ui'
import { metadataFor } from '@/config/meta'
import { formatDate } from '@/config/portal'
import { routes } from '@/config/routes'
import { adminStats } from '@/lib/server/members'

export const metadata = metadataFor(routes.admin)

export default async function AdminDashboard() {
  const s = await adminStats()
  const memberLink = (id: string) => `${routes.adminMembers.path}/${id}`

  return (
    <>
      <PortalHeading
        eyebrow="Super Admin"
        title="Membership overview"
        actions={<Link className="button-primary" href={routes.adminMembers.path}>Open members <ArrowRight size={15} /></Link>}
      />

      <div className="stat-grid">
        <StatTile label="Total members" value={s.total} />
        <StatTile label="Active" value={s.active} />
        <StatTile label="New this month" value={s.newThisMonth} />
        <StatTile label="Awaiting approval" value={s.pending} />
      </div>

      <div className="dash-grid">
        <Panel title="By department">{s.byDepartment.length ? <BarList rows={s.byDepartment} /> : <p className="panel-text">No departments yet. <Link href={routes.adminDepartments.path}>Add some</Link>.</p>}</Panel>
        <Panel title="By district">{s.byDistrict.length ? <BarList rows={s.byDistrict} /> : <p className="panel-text">No districts yet. <Link href={routes.adminDistricts.path}>Add some</Link>.</p>}</Panel>
      </div>

      <div className="dash-grid">
        <Panel title="Upcoming birthdays" action={<Link className="pathway-link" href={routes.adminReports.path}>All birthdays <ArrowRight size={14} /></Link>}>
          {s.birthdays.length ? (
            <ul className="summary-list">
              {s.birthdays.map((b) => (
                <li key={b.id}>
                  <Link href={memberLink(b.id)}>{b.name}</Link>
                  <strong>{formatDate(b.dateOfBirth, false)} · {b.inDays === 0 ? 'today' : `in ${b.inDays} ${b.inDays === 1 ? 'day' : 'days'}`}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="panel-text">No birthdays in the next 30 days.</p>}
        </Panel>
        <Panel title="Awaiting approval">
          {s.awaiting.length ? (
            <ul className="summary-list">
              {s.awaiting.map((m) => (
                <li key={m.id}>
                  <Link href={memberLink(m.id)}>{m.name}</Link>
                  <span>Signed up {formatDate(m.createdAt)} <StatusBadge status="PENDING" /></span>
                </li>
              ))}
            </ul>
          ) : <p className="panel-text">No sign-ups are waiting.</p>}
        </Panel>
      </div>

      {s.deletionRequests.length > 0 && (
        <Panel title="Deletion requests" className="panel-danger">
          <ul className="summary-list">
            {s.deletionRequests.map((m) => (
              <li key={m.id}><Link href={memberLink(m.id)}>{m.name}</Link><span>Asked {formatDate(m.requestedAt)}</span></li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  )
}
