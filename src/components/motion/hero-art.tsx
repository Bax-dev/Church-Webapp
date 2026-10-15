'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

import { Lines, SiteImage } from '@/components/content'
import type { SiteContent } from '@/config/content'

/** The home hero's image stack: scroll parallax on the photo, a floating note, a slowly turning stamp. */
export function HeroArt({ content }: { content: SiteContent['home']['heroArt'] }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 70])
  const noteY = useTransform(scrollYProgress, [0, 1], [0, -50])

  return (
    <div className="hero-art" ref={ref}>
      <motion.div
        className="hero-art-frame"
        style={{ y: photoY }}
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <SiteImage image={content.image} priority sizes="(max-width: 700px) 92vw, 500px" />
        {(content.captionLabel || content.caption) && (
          <div className="art-caption">{content.captionLabel && <small>{content.captionLabel}</small>}{content.caption}</div>
        )}
      </motion.div>
      <motion.div className="floating-note-wrap" style={{ y: noteY }}>
        <motion.div
          className="floating-note"
          aria-label={`${content.noteTitle.replace(/\n/g, ' ')} ${content.noteText}`.trim()}
          initial={{ rotate: 3 }}
          animate={{ y: [0, -8, 0], rotate: 3 }}
          transition={{ y: { delay: 0.5, duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <strong><Lines text={content.noteTitle} /></strong>
          {content.noteText && <span>{content.noteText}</span>}
        </motion.div>
      </motion.div>
      <motion.div
        className="hero-stamp"
        initial={{ rotate: -12 }}
        animate={{ rotate: [-12, 348] }}
        transition={{ rotate: { duration: 60, repeat: Infinity, ease: 'linear' } }}
      >
        <span><Lines text={content.stamp} /></span>
      </motion.div>
    </div>
  )
}
