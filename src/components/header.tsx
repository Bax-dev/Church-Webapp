'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Menu, X } from 'lucide-react'

import { Brand } from '@/components/brand'
import { SignOutButton } from '@/components/sign-out-button'
import { activeHref, headerLinks, homeFor, visibleTo } from '@/config/navigation'
import { routes } from '@/config/routes'
import type { Viewer } from '@/config/session'

export function Header({ viewer }: { viewer: Viewer }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const links = visibleTo(headerLinks, viewer)
  const account = homeFor(viewer)
  const current = activeHref(viewer ? [...links, account] : links, pathname)

  useEffect(() => setMenuOpen(false), [pathname])

  return (
    <header className="topbar">
      <div className="container nav-inner">
        <Brand />
        <nav id="main-navigation" className={`nav-links${menuOpen ? ' open' : ''}`} aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={current === link.href ? 'page' : undefined}>{link.label}</Link>
          ))}
          {viewer && <SignOutButton className="nav-signout" />}
        </nav>
        {viewer ? (
          <Link className="nav-cta" href={account.href} aria-current={current === account.href ? 'page' : undefined}>
            {account.label} <ArrowRight size={15} />
          </Link>
        ) : (
          <Link className="nav-cta" href={routes.visit.path}>Plan a visit <ArrowRight size={15} /></Link>
        )}
        <button
          className="menu-toggle"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
    </header>
  )
}
