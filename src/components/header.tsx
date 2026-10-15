'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Menu, X } from 'lucide-react'

import { Brand } from '@/components/brand'
import { SignOutButton } from '@/components/sign-out-button'
import type { SiteContent } from '@/config/content'
import { activeHref, headerLinks, homeFor, labelled, visibleTo, withExtras, type NavLink } from '@/config/navigation'
import { routes } from '@/config/routes'
import type { Viewer } from '@/config/session'

export function Header({ viewer, identity, ctaLabel, labels, extras = [] }: {
  viewer: Viewer; identity: SiteContent['site']['identity']; ctaLabel: string; labels: SiteContent['navigation']['header']; extras?: NavLink[]
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const links = visibleTo(labelled(withExtras(headerLinks, extras), labels), viewer)
  const account = homeFor(viewer, labels)
  const current = activeHref(viewer ? [...links, account] : links, pathname)

  useEffect(() => setMenuOpen(false), [pathname])

  // Esc closes the open mobile menu, like other disclosure menus.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <header className="topbar">
      <div className="container nav-inner">
        <Brand identity={identity} />
        <nav id="main-navigation" className={`nav-links${menuOpen ? ' open' : ''}`} aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={current === link.href ? 'page' : undefined}>{link.label}</Link>
          ))}
          {/* The account button sits outside the menu and is hidden on phones, so the menu repeats it there. */}
          {viewer && (
            <Link className="nav-account" href={account.href} aria-current={current === account.href ? 'page' : undefined}>{account.label}</Link>
          )}
          {viewer && <SignOutButton className="nav-signout" label={labels.signOut} />}
        </nav>
        {viewer ? (
          <Link className="nav-cta" href={account.href} aria-current={current === account.href ? 'page' : undefined}>
            {account.label} <ArrowRight size={15} />
          </Link>
        ) : (
          <Link className="nav-cta" href={routes.visit.path}>{ctaLabel} <ArrowRight size={15} /></Link>
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
