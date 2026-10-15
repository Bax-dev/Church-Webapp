import Link from 'next/link'
import { Pencil } from 'lucide-react'

import { FormResult } from '@/components/portal/fields'
import { Avatar, DefinitionList, Panel, PortalHeading, StatusBadge } from '@/components/portal/ui'
import { formatDate, fullName, initials, lookupName, maritalStatusLabels } from '@/config/portal'
import { routes } from '@/config/routes'
import { listLookups, toMember } from '@/lib/server/members'
import { getContent } from '@/lib/server/content'
import { requireMember } from '@/lib/server/session'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.profile)

/** Shown after the "confirm your new email" link sends the member back here. */
const emailNotices: Record<string, { error?: boolean; text: string }> = {
  verified: { text: 'Your new email address is confirmed. Use it to sign in from now on.' },
  expired: { error: true, text: 'That confirmation link has expired or was already used. Change your email again to get a new one.' },
  taken: { error: true, text: 'Another account started using that email address, so it was not changed.' },
}

type Props = { searchParams: Promise<{ email?: string }> }

export default async function ProfilePage({ searchParams }: Props) {
  const me = toMember(await requireMember())
  const [departments, districts, { portal }] = await Promise.all([listLookups('department'), listLookups('district'), getContent()])
  const notice = emailNotices[(await searchParams).email ?? '']

  return (
    <>
      <PortalHeading
        eyebrow={portal.profile.eyebrow}
        title={portal.profile.title}
        text={portal.profile.text}
        actions={<Link className="button-primary" href={routes.profileEdit.path}><Pencil size={15} /> Edit profile</Link>}
      />
      {notice && <FormResult error={notice.error}>{notice.text}</FormResult>}

      <Panel>
        <div className="profile-head">
          <Avatar text={initials(me)} src={me.photoUrl} size="lg" />
          <div>
            <h2>{fullName(me)}</h2>
            <p>{me.email} · <StatusBadge status={me.status} /></p>
          </div>
        </div>
      </Panel>

      <Panel title="Personal">
        <DefinitionList items={[
          { label: 'First name', value: me.firstName },
          { label: 'Last name', value: me.lastName },
          {
            label: 'Email',
            value: <>{me.email}{me.emailVerified && <span className="verified"> · Verified</span>}{me.pendingEmail && <span className="field-hint"> Waiting for you to confirm {me.pendingEmail}</span>}</>,
          },
          { label: 'Phone', value: me.phone || '—' },
          { label: 'Date of birth', value: formatDate(me.dateOfBirth) },
          { label: 'Gender', value: me.gender || '—' },
          { label: 'Marital status', value: me.maritalStatus ? maritalStatusLabels[me.maritalStatus] : '—' },
        ]} />
      </Panel>

      <Panel title="Address">
        <DefinitionList items={[
          { label: 'Street', value: me.addressLine || '—' },
          { label: 'City or area', value: me.city || '—' },
          { label: 'State', value: me.state || '—' },
          { label: 'Country', value: me.country },
        ]} />
      </Panel>

      <Panel title="Church family">
        <DefinitionList items={[
          { label: 'Department', value: lookupName(departments, me.departmentId) },
          { label: 'District', value: lookupName(districts, me.districtId) },
          { label: 'Member since', value: formatDate(me.createdAt) },
        ]} />
      </Panel>
    </>
  )
}
