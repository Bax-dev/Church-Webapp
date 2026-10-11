import Link from 'next/link'

import { Pagination, Panel, PortalHeading } from '@/components/portal/ui'
import { metadataFor } from '@/config/meta'
import { formatDateTime } from '@/config/portal'
import { routes } from '@/config/routes'
import { auditPage } from '@/lib/server/members'

export const metadata = metadataFor(routes.adminAuditLog)

type Props = { searchParams: Promise<{ page?: string }> }

export default async function AuditLogPage({ searchParams }: Props) {
  const log = await auditPage({ page: Number((await searchParams).page) || 1, limit: 25 })

  return (
    <>
      <PortalHeading eyebrow="Super Admin" title="Audit log" text="Every profile change and admin action is recorded with who made it, when, and what changed. Entries cannot be edited." />
      <Panel>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">Action</th><th scope="col">Member</th><th scope="col">Change</th><th scope="col">IP</th></tr>
            </thead>
            <tbody>
              {log.items.map((entry) => (
                <tr key={entry.id}>
                  <td className="nowrap">{formatDateTime(entry.createdAt)}</td>
                  <td>{entry.actor}</td>
                  <td><code>{entry.action}</code></td>
                  <td>{entry.targetId ? <Link href={`${routes.adminMembers.path}/${entry.targetId}`}>{entry.target}</Link> : entry.target ?? '—'}</td>
                  <td>{entry.detail}</td>
                  <td className="nowrap">{entry.ip ?? '—'}</td>
                </tr>
              ))}
              {log.items.length === 0 && <tr><td colSpan={6} className="table-empty">Nothing has been recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={log.page} pages={log.pages} label="Audit log pages" href={(page) => `${routes.adminAuditLog.path}/?page=${page}`} />
      </Panel>
    </>
  )
}
