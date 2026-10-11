'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { animate, inView, stagger } from 'framer-motion'

/** Blocks that fade up as a whole. */
const SINGLES = [
  '.section-head', '.why-aside', '.values-inner > div:first-child', '.story-copy', '.story-photo',
  '.experience-art', '.experience-copy', '.first-sunday-photo', '.access-card', '.getting-here-card',
  '.scripture blockquote', '.member-status-inner', '.pathway-top > .button-secondary', '.image-note',
].join(', ')

/** Lists and grids whose children arrive one after another. */
const GROUPS = [
  '.why-list', '.values-words', '.pathways-grid', '.ministry-grid', '.step-grid', '.gallery-grid',
  '.member-feature-grid', '.pastor-grid', '.moment-list', '.story-points', '.experience-copy .feature-list', '.faq-list',
].join(', ')

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Scroll-triggered entrances for the public pages, driven by Framer Motion's imperative API so the
 * server-rendered markup stays as it is. Only elements below the fold are hidden, so nothing visible
 * on load ever flickers, and without JavaScript every section simply shows.
 */
export function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const fold = window.innerHeight * 0.92
    const belowFold = (el: Element) => el.getBoundingClientRect().top > fold && !el.closest('.portal, .auth')
    const stops: (() => void)[] = []
    const watch = (target: Element, reveal: () => void) => {
      // Reveal once: stop watching as soon as it has played.
      const stop = inView(target, () => { reveal(); stop() }, { margin: '0px 0px -12% 0px' })
      stops.push(stop)
    }

    document.querySelectorAll<HTMLElement>(SINGLES).forEach((el) => {
      if (!belowFold(el) || el.closest(GROUPS)) return
      animate(el, { opacity: 0, y: 32 }, { duration: 0 })
      watch(el, () => animate(el, { opacity: 1, y: 0 }, { duration: 0.9, ease: EASE }))
    })

    document.querySelectorAll<HTMLElement>(GROUPS).forEach((group) => {
      if (!belowFold(group)) return
      const items = Array.from(group.children) as HTMLElement[]
      if (!items.length) return
      animate(items, { opacity: 0, y: 28, scale: 0.98 }, { duration: 0 })
      watch(group, () => animate(items, { opacity: 1, y: 0, scale: 1 }, { duration: 0.8, ease: EASE, delay: stagger(0.09) }))
    })

    return () => stops.forEach((stop) => stop())
  }, [pathname])

  return null
}
