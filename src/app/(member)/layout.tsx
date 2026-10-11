import type { ReactNode } from 'react'

import { MemberFrame } from '@/components/portal/frames'
import { getViewer, requireMember } from '@/lib/server/session'

export default async function MemberLayout({ children }: { children: ReactNode }) {
  await requireMember()
  return <MemberFrame viewer={(await getViewer())!}>{children}</MemberFrame>
}
