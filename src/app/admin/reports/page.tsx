import Link from 'next/link'

import { BarList, Panel, PortalHeading } from '@/components/portal/ui'
import { birthMonth, formatDate, fullName, maritalStatusLabels, monthNames, type MaritalStatus } from '@/config/portal'
import { routes } from '@/config/routes'
import { activeMembers, listLookups, lookupCounts } from '@/lib/server/members'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.adminReports)

export default async function ReportsPage() {
  const [active, departments, districts, byDep, byDis] = await Promise.all([
    activeMembers(), listLookups('department'), listLookups('district'), lookupCounts('department', true), lookupCounts('district', true),
  ])
  const marital = [
    ...(Object.keys(maritalStatusLabels) as MaritalStatus[]).map((key) => ({ label: maritalStatusLabels[key], value: active.filter((m) => m.maritalStatus === key).length })),
    { label: 'Not given', value: active.filter((m) => !m.maritalStatus).length },
  ]
  const byMonth = monthNames.map((name, index) => ({
    name,
    people: active
      .filter((m) => birthMonth(m) === index + 1)
      .sort((a, b) => a.dateOfBirth!.slice(8).localeCompare(b.dateOfBirth!.slice(8))),
  }))

  return (
    <>
      <PortalHeading eyebrow="Super Admin" title="Reports" text={`Figures cover the ${active.length} active ${active.length === 1 ? 'member' : 'members'}.`} />

      <div className="dash-grid">
        <Panel title="Members by department"><BarList rows={departments.map((d) => ({ label: d.name, value: byDep[d.id] ?? 0 }))} /></Panel>
        <Panel title="Members by district"><BarList rows={districts.map((d) => ({ label: d.name, value: byDis[d.id] ?? 0 }))} /></Panel>
      </div>
      <Panel title="Marital status"><BarList rows={marital} /></Panel>

      <Panel title="Birthdays by month">
        <div className="month-grid">
          {byMonth.map(({ name, people }) => (
            <section key={name} className="month" aria-label={`${name} birthdays`}>
              <h3>{name} <span>{people.length}</span></h3>
              {people.length ? (
                <ul>
                  {people.map((m) => (
                    <li key={m.id}><Link href={`${routes.adminMembers.path}/${m.id}`}>{fullName(m)}</Link><span>{formatDate(m.dateOfBirth, false)}</span></li>
                  ))}
                </ul>
              ) : <p>No birthdays</p>}
            </section>
          ))}
        </div>
      </Panel>
    </>
  )
}
