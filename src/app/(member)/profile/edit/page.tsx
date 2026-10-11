import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { PhotoForm, ProfileForm } from '@/components/portal/member-forms'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { metadataFor } from '@/config/meta'
import { routes } from '@/config/routes'
import { listLookups, toMember } from '@/lib/server/members'
import { requireMember } from '@/lib/server/session'

export const metadata = metadataFor(routes.profileEdit)

export default async function EditProfilePage() {
  const me = toMember(await requireMember())
  // Members pick from active entries, plus the one they already have if it has since been deactivated.
  const [departments, districts] = await Promise.all([listLookups('department'), listLookups('district')])
  const pick = (list: typeof departments, current: string | null) => list.filter((item) => item.isActive || item.id === current)

  return (
    <>
      <Link className="back-link" href={routes.profile.path}><ArrowLeft size={15} /> Back to profile</Link>
      <PortalHeading eyebrow="My profile" title="Edit your details" text="Your role and account status are managed by the church office." />
      <Panel title="Profile photo"><PhotoForm member={me} /></Panel>
      <Panel>
        <ProfileForm member={me} departments={pick(departments, me.departmentId)} districts={pick(districts, me.districtId)} endpoint="/api/me" doneHref={routes.profile.path} />
      </Panel>
    </>
  )
}
