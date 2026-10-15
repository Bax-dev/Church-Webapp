'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeft, X, type LucideIcon } from 'lucide-react'

import { SignOutButton } from '@/components/sign-out-button'
import { activeHref } from '@/config/navigation'

export type PortalLink = { href: string; label: string; icon: LucideIcon }

/**
 * Sidebar + content layout shared by the member area and the admin area.
 * On tablets and phones the sidebar becomes a drawer, opened from a bar that names the current page.
 */
export function PortalFrame({ label, account, links, children }: { label: string; account: ReactNode; links: PortalLink[]; children: ReactNode }) {
  const pathname = usePathname()
  const active = activeHref(links, pathname)
  const current = links.find((link) => link.href === active)
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  // Esc closes the drawer; the page behind it does not scroll while it is open.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('portal-drawer-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('portal-drawer-open')
    }
  }, [open])

  const CurrentIcon = current?.icon

  return (
    <div className="portal">
      <div className="container portal-layout">
        <button
          type="button"
          className="portal-menu-bar"
          aria-expanded={open}
          aria-controls="portal-sidebar"
          onClick={() => setOpen(true)}
        >
          <PanelLeft size={18} strokeWidth={1.8} aria-hidden="true" />
          <span className="portal-menu-bar-label">
            <small>{label}</small>
            <strong>{CurrentIcon && <CurrentIcon size={15} strokeWidth={1.8} aria-hidden="true" />}{current?.label ?? 'Menu'}</strong>
          </span>
          <span className="portal-menu-bar-hint">Menu</span>
        </button>
        <div className={`portal-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
        <aside id="portal-sidebar" className={`portal-aside${open ? ' open' : ''}`} aria-label={`${label} sidebar`}>
          <div className="portal-aside-head">
            <div className="portal-account">{account}</div>
            <button type="button" className="portal-close" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <nav className="portal-nav" aria-label={label}>
            {links.map(({ href, label: text, icon: Icon }) => (
              <Link key={href} href={href} aria-current={active === href ? 'page' : undefined} onClick={() => setOpen(false)}>
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
