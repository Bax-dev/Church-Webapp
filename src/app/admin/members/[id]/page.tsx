import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { MemberActions } from '@/components/portal/admin-tools'
import { ProfileForm } from '@/components/portal/member-forms'
import { Avatar, DefinitionList, Panel, PortalHeading } from '@/components/portal/ui'
import { formatDate, formatDateTime, fullName, initials, lookupName, maritalStatusLabels, roleLabels } from '@/config/portal'
import { routes } from '@/config/routes'
import { auditPage, getMember, listLookups } from '@/lib/server/members'
import { pageMetadata } from '@/lib/server/metadata'
import { requireAdmin } from '@/lib/server/session'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await requireAdmin()
  const member = await getMember((await params).id)
  return pageMetadata({ ...routes.adminMembers, title: member ? fullName(member) : routes.adminMembers.title })()
}

export default async function AdminMemberPage({ params, searchParams }: Props) {
  const admin = await requireAdmin()
  const { id } = await params
  const member = await getMember(id)
  if (!member) notFound()
  const editing = (await searchParams).edit === '1'
  const [departments, districts, history] = await Promise.all([listLookups('department'), listLookups('district'), auditPage({ targetId: id, limit: 20 })])
  const here = `${routes.adminMembers.path}/${id}/`

  return (
    <>
      <Link className="back-link" href={routes.adminMembers.path}><ArrowLeft size={15} /> All members</Link>
      <PortalHeading
        eyebrow="Member"
        title={fullName(member)}
        actions={editing
          ? <Link className="button-secondary" href={here}>Done editing</Link>
          : <Link className="button-primary" href={`${here}?edit=1`}>Edit details</Link>}
      />

      <div className="detail-grid">
        <div>
          <Panel>
            <div className="profile-head">
              <Avatar text={initials(member)} src={member.photoUrl} size="lg" />
              <div>
                <h2>{fullName(member)}</h2>
                <p>{member.email}{member.emailVerified ? ' · Email verified' : ' · Email not verified'}</p>
              </div>
            </div>
          </Panel>
          {editing ? (
            <Panel title="Edit details">
              <ProfileForm admin member={member} departments={departments} districts={districts} endpoint={`/api/admin/members/${id}`} />
            </Panel>
          ) : (
            <Panel title="Details">
              <DefinitionList items={[
                { label: 'Phone', value: member.phone || '—' },
                { label: 'Date of birth', value: formatDate(member.dateOfBirth) },
                { label: 'Gender', value: member.gender || '—' },
                { label: 'Marital status', value: member.maritalStatus ? maritalStatusLabels[member.maritalStatus] : '—' },
                { label: 'Address', value: [member.addressLine, member.city, member.state].filter(Boolean).join(', ') || '—' },
                { label: 'Department', value: lookupName(departments, member.departmentId) },
                { label: 'District', value: lookupName(districts, member.districtId) },
                { label: 'Role', value: roleLabels[member.role] },
                { label: 'Joined', value: formatDate(member.createdAt) },
                { label: 'Last signed in', value: member.lastLoginAt ? formatDateTime(member.lastLoginAt) : 'Never' },
              ]} />
            </Panel>
          )}
          <Panel title="History">
            {history.items.length ? (
              <ul className="timeline">
                {history.items.map((entry) => (
                  <li key={entry.id}><strong>{entry.detail}</strong><span>{entry.actor} · {formatDateTime(entry.createdAt)}</span></li>
                ))}
              </ul>
            ) : <p className="panel-text">No changes recorded yet.</p>}
          </Panel>
        </div>
        <Panel title="Manage"><MemberActions member={member} isSelf={member.id === admin.id} /></Panel>
      </div>
    </>
  )
}
