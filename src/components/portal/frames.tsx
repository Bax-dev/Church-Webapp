'use client'

import type { ReactNode } from 'react'
import {
  BarChart3, Building2, Church, FileClock, LayoutDashboard, MapPin, Megaphone, PanelsTopLeft, Radio, Settings, ShieldCheck, SlidersHorizontal, UserRound, Users,
  type LucideIcon,
} from 'lucide-react'

import { Avatar } from '@/components/portal/ui'
import { PortalFrame } from '@/components/portal/portal-frame'
import { adminSidebar, memberSidebar, visibleTo, type PortalNavKey } from '@/config/navigation'
import { fullName, initials, roleLabels } from '@/config/portal'
import type { Viewer } from '@/config/session'

const icons: Record<PortalNavKey, LucideIcon> = {
  dashboard: LayoutDashboard, profile: UserRound, settings: Settings, admin: ShieldCheck,
  adminMembers: Users, adminDepartments: Building2, adminDistricts: MapPin, adminReports: BarChart3, adminAuditLog: FileClock,
  adminUsers: ShieldCheck, adminPrayer: Radio, adminContent: PanelsTopLeft, adminPastors: Church, adminAnnouncements: Megaphone, adminSettings: SlidersHorizontal,
}

function Account({ viewer, note }: { viewer: NonNullable<Viewer>; note: string }) {
  return (
    <>
      <Avatar text={initials(viewer)} src={viewer.photoUrl} />
      <span><strong>{fullName(viewer)}</strong><small>{note}</small></span>
    </>
  )
}

export function MemberFrame({ viewer, children }: { viewer: NonNullable<Viewer>; children: ReactNode }) {
  const links = visibleTo(memberSidebar, viewer).map((link) => ({ ...link, icon: icons[link.key] }))
  return (
    <PortalFrame label="Member portal" links={links} account={<Account viewer={viewer} note={roleLabels[viewer.role]} />}>
      {children}
    </PortalFrame>
  )
}

export function AdminFrame({ viewer, children }: { viewer: NonNullable<Viewer>; children: ReactNode }) {
  // In the admin area "admin" is the overview and "dashboard" is the admin's own member page.
  const adminIcons = { ...icons, admin: LayoutDashboard, dashboard: UserRound }
  const links = adminSidebar.map((link) => ({ ...link, icon: adminIcons[link.key] }))
  return (
    <PortalFrame label="Admin" links={links} account={<Account viewer={viewer} note="Church administration" />}>
      {children}
    </PortalFrame>
  )
}
