import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { PhotoForm, ProfileForm } from '@/components/portal/member-forms'
import { Panel, PortalHeading } from '@/components/portal/ui'
import { routes } from '@/config/routes'
import { listLookups, toMember } from '@/lib/server/members'
import { getContent } from '@/lib/server/content'
import { requireMember } from '@/lib/server/session'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.profileEdit)

export default async function EditProfilePage() {
  const me = toMember(await requireMember())
  // Members pick from active entries, plus the one they already have if it has since been deactivated.
  const [departments, districts, { portal }] = await Promise.all([listLookups('department'), listLookups('district'), getContent()])
  const pick = (list: typeof departments, current: string | null) => list.filter((item) => item.isActive || item.id === current)

  return (
    <>
      <Link className="back-link" href={routes.profile.path}><ArrowLeft size={15} /> Back to profile</Link>
      <PortalHeading eyebrow={portal.profileEdit.eyebrow} title={portal.profileEdit.title} text={portal.profileEdit.text} />
      <Panel title="Profile photo"><PhotoForm member={me} /></Panel>
      <Panel>
        <ProfileForm member={me} departments={pick(departments, me.departmentId)} districts={pick(districts, me.districtId)} endpoint="/api/me" doneHref={routes.profile.path} />
      </Panel>
    </>
  )
}
