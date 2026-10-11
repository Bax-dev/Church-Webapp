import type { ReactNode } from 'react'

import { AdminFrame } from '@/components/portal/frames'
import { getViewer, requireAdmin } from '@/lib/server/session'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin()
  return <AdminFrame viewer={(await getViewer())!}>{children}</AdminFrame>
}
