'use client'

import { useEffect } from 'react'

/**
 * While `dirty`, leaving the page asks first: a reload or closed tab via beforeunload,
 * and in-app links (page tabs, the admin menu) by catching the click before Next's router does.
 */
export function useLeaveGuard(dirty: boolean, message = 'You have unsaved changes. Leave without saving them?') {
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    const guardLinks = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link || link.target === '_blank' || link.origin !== window.location.origin) return
      if (link.pathname === window.location.pathname && link.search === window.location.search) return
      if (window.confirm(message)) return
      event.preventDefault()
      event.stopPropagation()
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('click', guardLinks, true)
    return () => {
      window.removeEventListener('beforeunload', warn)
      document.removeEventListener('click', guardLinks, true)
    }
  }, [dirty, message])
}
