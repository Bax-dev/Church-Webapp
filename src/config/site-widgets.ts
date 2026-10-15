/**
 * The floating WhatsApp button and the glass banner across the top of the site.
 * Both are edited on /admin/settings and stored under the `widgets` settings key.
 */

export type WhatsAppWidget = {
  enabled: boolean
  /** International format, digits only once cleaned (e.g. 2348012345678). */
  phone: string
  /** Pre-filled chat message. */
  message: string
  /** Short line shown on the open card, e.g. "Chat with us". */
  label: string
  side: 'left' | 'right'
}

export type TopBanner = {
  enabled: boolean
  text: string
  /** Optional link; both empty means no link. */
  linkLabel: string
  linkHref: string
}

export type SiteWidgets = { whatsapp: WhatsAppWidget; banner: TopBanner }

export const defaultWidgets: SiteWidgets = {
  whatsapp: { enabled: false, phone: '', message: 'Hello, I would like to know more about the church.', label: 'Chat with us on WhatsApp', side: 'right' },
  banner: { enabled: false, text: '', linkLabel: '', linkHref: '' },
}

/** Fills any missing fields from the defaults, so older stored values keep working. */
export function parseWidgets(value: unknown): SiteWidgets {
  const stored = (value ?? {}) as Partial<SiteWidgets>
  return {
    whatsapp: { ...defaultWidgets.whatsapp, ...stored.whatsapp },
    banner: { ...defaultWidgets.banner, ...stored.banner },
  }
}

export const cleanPhone = (phone: string) => phone.replace(/\D/g, '')

export function whatsappUrl({ phone, message }: Pick<WhatsAppWidget, 'phone' | 'message'>) {
  const text = message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ''
  return `https://wa.me/${cleanPhone(phone)}${text}`
}
