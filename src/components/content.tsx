/** Draws site content (src/config/content.ts): rich titles, images that may be bundled or uploaded, and icons by name. Works on server and client. */
import { Fragment, type CSSProperties } from 'react'
import Image from 'next/image'
import {
  Baby, BookOpen, CalendarDays, Church, Coffee, HandHeart, Heart, MapPin, Music, ShieldCheck, Sparkles, Star, UserPlus, Users, type LucideIcon,
} from 'lucide-react'

import { assetKey, type IconName, type ImageValue } from '@/config/content'
import { images } from '@/config/images'

/** A title with *italic* words and line breaks. Everything else is plain text, so no markup can be injected. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, row) => (
        <Fragment key={row}>
          {row > 0 && <br />}
          {line.split(/\*([^*]+)\*/g).map((part, index) => (index % 2 ? <em key={index}>{part}</em> : part))}
        </Fragment>
      ))}
    </>
  )
}

/** Plain text that may contain line breaks. */
export function Lines({ text }: { text: string }) {
  return <Rich text={text.replace(/\*/g, '')} />
}

const fillStyle: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }

/**
 * A content image. Bundled images go through next/image (sized and optimised); uploaded ones are plain <img>,
 * since their dimensions are not known at build time. CSS sizes both the same way.
 */
export function SiteImage({ image, className, sizes, priority, fill, decorative }: {
  image: ImageValue; className?: string; sizes?: string; priority?: boolean; fill?: boolean; decorative?: boolean
}) {
  const alt = decorative ? '' : image.alt
  const key = assetKey(image.src)
  if (key) {
    return fill
      ? <Image className={className} src={images[key].src} alt={alt} fill priority={priority} sizes={sizes} />
      : <Image className={className} src={images[key].src} alt={alt} priority={priority} sizes={sizes} />
  }
  // An uploaded file served by /api/site-images, so a plain img rather than next/image.
  return <img className={className} src={image.src} alt={alt} loading={priority ? 'eager' : 'lazy'} style={fill ? fillStyle : undefined} />
}

/** The URL to put in an <img> or preview for either kind of image. */
export const imageUrl = (image: ImageValue) => {
  const key = assetKey(image.src)
  return key ? images[key].src.src : image.src
}

export const contentIcons: Record<IconName, LucideIcon> = {
  sparkles: Sparkles, music: Music, book: BookOpen, users: Users, baby: Baby, 'hand-heart': HandHeart, heart: Heart, coffee: Coffee,
  'user-plus': UserPlus, shield: ShieldCheck, church: Church, calendar: CalendarDays, 'map-pin': MapPin, star: Star,
}

export function ContentIcon({ name, size = 17, strokeWidth = 1.7 }: { name: string; size?: number; strokeWidth?: number }) {
  const Icon = contentIcons[name as IconName] ?? Sparkles
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />
}
