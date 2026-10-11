'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

import { SignOutButton } from '@/components/sign-out-button'
import { activeHref } from '@/config/navigation'

export type PortalLink = { href: string; label: string; icon: LucideIcon }

/** Sidebar + content layout shared by the member area and the admin area. */
export function PortalFrame({ label, account, links, children }: { label: string; account: ReactNode; links: PortalLink[]; children: ReactNode }) {
  const active = activeHref(links, usePathname())

  return (
    <div className="portal">
      <div className="container portal-layout">
        <aside className="portal-aside">
          <div className="portal-account">{account}</div>
          <nav className="portal-nav" aria-label={label}>
            {links.map(({ href, label: text, icon: Icon }) => (
              <Link key={href} href={href} aria-current={active === href ? 'page' : undefined}>
                <Icon size={16} strokeWidth={1.8} aria-hidden="true" />{text}
              </Link>
            ))}
          </nav>
          <div className="portal-nav-divider" />
          <SignOutButton className="portal-signout" icon />
        </aside>
        <div className="portal-content">{children}</div>
      </div>
    </div>
  )
}
