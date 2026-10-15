'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, X } from 'lucide-react'

import { whatsappUrl, type TopBanner, type WhatsAppWidget } from '@/config/site-widgets'

const DISMISSED_KEY = 'pc-banner-dismissed'

/** Admin pages keep their own chrome; the public widgets stay out of the way there. */
const useHidden = () => usePathname()?.startsWith('/admin') ?? false

function WhatsAppGlyph({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.24-.7.24-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.42 9.43-9.42a9.37 9.37 0 0 1 6.66 2.76 9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.23 9.42-9.43 9.42m8.02-17.44A11.26 11.26 0 0 0 12.05.75C5.8.75.7 5.84.7 12.1c0 2 .52 3.95 1.52 5.67L.6 23.25l5.6-1.47a11.33 11.33 0 0 0 5.85 1.49c6.25 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.33-8.02" />
    </svg>
  )
}

/** A frosted-glass strip above the header. Visitors can close it; it returns when the text changes. */
export function SiteBanner({ banner }: { banner: TopBanner }) {
  const hidden = useHidden()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try { setDismissed(localStorage.getItem(DISMISSED_KEY) === banner.text) } catch { /* storage blocked: keep showing */ }
  }, [banner.text])

  if (hidden || !banner.enabled || !banner.text || dismissed) return null

  const close = () => {
    setDismissed(true)
    try { localStorage.setItem(DISMISSED_KEY, banner.text) } catch { /* storage blocked: it shows again next page */ }
  }

  return (
    <div className="glass-banner" role="region" aria-label="Site notice">
      <span className="glass-banner-orb one" aria-hidden="true" />
      <span className="glass-banner-orb two" aria-hidden="true" />
      <div className="container glass-banner-inner">
        <p>
          <span className="glass-banner-dot" aria-hidden="true" />
          {banner.text}
          {banner.linkHref && banner.linkLabel && (
            <Link className="glass-banner-link" href={banner.linkHref}>{banner.linkLabel} <ArrowRight size={13} /></Link>
          )}
        </p>
        <button type="button" className="glass-banner-close" onClick={close} aria-label="Dismiss notice"><X size={15} /></button>
      </div>
    </div>
  )
}

/** Floating button on the side of the screen; it opens a small card that starts the WhatsApp chat. */
export function WhatsAppButton({ whatsapp }: { whatsapp: WhatsAppWidget }) {
  const hidden = useHidden()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const onClick = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  if (hidden || !whatsapp.enabled || !whatsapp.phone) return null

  return (
    <div ref={root} className={`whatsapp-widget side-${whatsapp.side}${open ? ' is-open' : ''}`}>
      <div className="whatsapp-card" id="whatsapp-card" role="dialog" aria-label="WhatsApp chat" hidden={!open}>
        <div className="whatsapp-card-head">
          <span className="whatsapp-card-icon"><WhatsAppGlyph size={20} /></span>
          <div>
            <strong>{whatsapp.label || 'Chat with us'}</strong>
            <small>We usually reply within a few hours.</small>
          </div>
        </div>
        {whatsapp.message && <p className="whatsapp-card-bubble">{whatsapp.message}</p>}
        <a className="whatsapp-card-button" href={whatsappUrl(whatsapp)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
          Start chat <ArrowRight size={15} />
        </a>
      </div>
      <button
        type="button"
        className="whatsapp-toggle"
        aria-expanded={open}
        aria-controls="whatsapp-card"
        aria-label={open ? 'Close WhatsApp chat' : 'Chat with us on WhatsApp'}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={24} /> : <WhatsAppGlyph />}
      </button>
    </div>
  )
}
