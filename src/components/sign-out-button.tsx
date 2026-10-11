'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { api } from '@/lib/api-client'

/** Revokes the session on the server, then reloads the current view so every menu switches back to the guest links. */
export function SignOutButton({ className, icon }: { className?: string; icon?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const signOut = async () => {
    setBusy(true)
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/')
    router.refresh()
  }

  return (
    <button type="button" className={className} onClick={signOut} disabled={busy}>
      {icon && <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />}
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
