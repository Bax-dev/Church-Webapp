'use client'

import { useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'

// The first page arrives fully visible from the static HTML; only later client-side navigations fade in.
// Flipped in an effect, so it changes only in the browser, never while pages are prerendered.
let hydrated = false

/** Re-mounts on every navigation (unlike layout.tsx), which is what makes the page transition play. */
export default function Template({ children }: { children: ReactNode }) {
  useEffect(() => { hydrated = true }, [])
  return (
    <motion.div
      initial={hydrated ? { opacity: 0, y: 14 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
