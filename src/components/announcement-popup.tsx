'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

import logo from '@/assets/logo.jpg'
import { ANNOUNCEMENT_URL, isAnnouncementLive, parseAnnouncement, type Announcement } from '@/config/announcement'

const DISMISSED_KEY = 'pc-announcement-dismissed'
/** "Not now" lasts for this visit (the browser tab session); the popup shows again on the next visit. */
const SNOOZED_KEY = 'pc-announcement-snoozed'

function readSnoozed() {
  try { return sessionStorage.getItem(SNOOZED_KEY) } catch { return null }
}

function writeSnoozed(id: string) {
  try { sessionStorage.setItem(SNOOZED_KEY, id) } catch { /* storage blocked: it may show again on the next page */ }
}

/** Opens the popup with focus on Close, not on whichever control comes first. */
export function openAnnouncement(dialog: HTMLDialogElement | null) {
  if (!dialog || dialog.open) return
  dialog.showModal()
  dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
}

function readDismissed() {
  try { return localStorage.getItem(DISMISSED_KEY) } catch { return null }
}

function writeDismissed(id: string) {
  try { localStorage.setItem(DISMISSED_KEY, id) } catch { /* private mode: it will simply show again next visit */ }
}

/**
 * The card itself, shared by the popup and the admin preview.
 * `onLater` closes for now (it shows again on the next visit); `onClose` closes for good.
 */
/** Button wording from Site content → Church details → Announcement popup buttons. */
export type PopupLabels = { eyebrow: string; closeLabel: string; laterLabel: string }
const defaultLabels: PopupLabels = { eyebrow: 'Announcement', closeLabel: 'Close', laterLabel: 'Remind me later' }

export function AnnouncementCard({ announcement, onClose, onLater, labels = defaultLabels }: { announcement: Announcement; onClose?: () => void; onLater?: () => void; labels?: PopupLabels }) {
  return (
    <div className="announcement">
      {onLater && (
        <button type="button" className="announcement-close" onClick={onLater} aria-label="Close for now"><X size={18} /></button>
      )}
      <Image className="announcement-logo" src={logo} alt="" />
      <span className="eyebrow">{labels.eyebrow}</span>
      <h2 id="announcement-title">{announcement.title}</h2>
      <p id="announcement-message">{announcement.message}</p>
      <div className="announcement-actions">
        <div className="announcement-buttons">
          {announcement.link && (
            <Link className="announcement-button primary" href={announcement.link.href} onClick={onClose}>{announcement.link.label}</Link>
          )}
          <button type="button" className={`announcement-button ${announcement.link ? 'secondary' : 'primary'}`} onClick={onClose} data-autofocus>{labels.closeLabel}</button>
        </div>
        {onLater && <button type="button" className="announcement-later" onClick={onLater}>{labels.laterLabel}</button>}
      </div>
    </div>
  )
}

export function AnnouncementPopup({ labels }: { labels?: PopupLabels }) {
  const pathname = usePathname()
  const dialog = useRef<HTMLDialogElement>(null)
  const [announcement, setAnnouncement] = useState<Announcement>()

  // Fetch once per page load; no-store so a newly published announcement shows up on the next visit.
  useEffect(() => {
    let cancelled = false
    fetch(ANNOUNCEMENT_URL, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((payload) => { if (!cancelled) setAnnouncement(parseAnnouncement(payload?.data)) })
      .catch(() => { /* none published, or the server is unreachable: show nothing */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!announcement || !isAnnouncementLive(announcement, pathname)) return
    if (readDismissed() === announcement.id || readSnoozed() === announcement.id) return
    const timer = window.setTimeout(() => openAnnouncement(dialog.current), (announcement.delaySeconds ?? 1) * 1000)
    return () => window.clearTimeout(timer)
  }, [announcement, pathname])

  if (!announcement) return null

  const close = () => {
    writeDismissed(announcement.id)
    dialog.current?.close()
  }
  const later = () => {
    writeSnoozed(announcement.id)
    dialog.current?.close()
  }

  return (
    <dialog
      ref={dialog}
      className="announcement-dialog"
      aria-labelledby="announcement-title"
      aria-describedby="announcement-message"
      // Esc and backdrop clicks mean "not now", so they do not hide it for good.
      onCancel={() => writeSnoozed(announcement.id)}
      onClick={(event) => { if (event.target === event.currentTarget) later() }}
    >
      <AnnouncementCard labels={labels} announcement={announcement} onClose={close} onLater={later} />
    </dialog>
  )
}
