import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { statusLabels, type Status } from '@/config/portal'

export function PortalHeading({ eyebrow, title, text, actions }: { eyebrow: string; title: string; text?: string; actions?: ReactNode }) {
  return (
    <div className="portal-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 id="page-title">{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {actions && <div className="portal-heading-actions">{actions}</div>}
    </div>
  )
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel${className ? ` ${className}` : ''}`} aria-label={title}>
      {(title || action) && (
        <div className="panel-head">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatTile({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {note && <span className="stat-note">{note}</span>}
    </div>
  )
}

export function Pagination({ page, pages, href, label }: { page: number; pages: number; href: (page: number) => string; label: string }) {
  if (pages <= 1) return null
  return (
    <nav className="pagination" aria-label={label}>
      {page > 1 ? <Link className="icon-button" href={href(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></Link> : <span className="icon-button" aria-hidden="true"><ChevronLeft size={16} /></span>}
      <span>Page {page} of {pages}</span>
      {page < pages ? <Link className="icon-button" href={href(page + 1)} aria-label="Next page"><ChevronRight size={16} /></Link> : <span className="icon-button" aria-hidden="true"><ChevronRight size={16} /></span>}
    </nav>
  )
}

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{statusLabels[status]}</span>
}

/** The member's photo if they uploaded one, otherwise their initials. Decorative: the name is always printed beside it. */
export function Avatar({ text, src, size = 'md' }: { text: string; src?: string | null; size?: 'md' | 'lg' }) {
  // A private, cookie-authenticated URL, so a plain img rather than next/image.
  if (src) return <img className={`avatar avatar-${size}`} src={src} alt="" />
  return <span className={`avatar avatar-${size}`} aria-hidden="true">{text}</span>
}

/** Single-series horizontal bars; the value is always printed, so the bar is never the only carrier. */
export function BarList({ rows, unit = 'members' }: { rows: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <ul className="bar-list">
      {rows.map((row) => (
        <li key={row.label} title={`${row.label}: ${row.value} ${unit}`}>
          <span className="bar-label">{row.label}</span>
          <span className="bar-track" aria-hidden="true">
            <span className="bar-fill" style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <span className="bar-value">{row.value}</span>
        </li>
      ))}
    </ul>
  )
}

export function DefinitionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="definition-list">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
