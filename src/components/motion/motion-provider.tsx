'use client'

import type { ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'

/** "user" turns transform and layout animations off for visitors who ask their system for reduced motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
