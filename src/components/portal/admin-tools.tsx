'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Download, KeyRound, Link2, Pencil, Plus, Power, Search, ShieldOff, Trash2, UserPlus,
} from 'lucide-react'

import { maritalOptions, useForm } from '@/components/portal/auth-forms'
import { Field, FormResult, SelectField } from '@/components/portal/fields'
import { StatusBadge } from '@/components/portal/ui'
import {
  formatDate, fullName, lookupName, monthNames, statusLabels, type ApprovalMode, type Lookup, type Member, type Page, type Status,
} from '@/config/portal'
import { routes } from '@/config/routes'
import { ApiError, api } from '@/lib/api-client'
import * as v from '@/lib/validators'

const PAGE_SIZE = 10
type SortKey = 'name' | 'createdAt' | 'dateOfBirth'
const noFilters = { department: '', district: '', marital: '', status: '', birthMonth: '' }

const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }))
const monthOptions = monthNames.map((label, index) => ({ value: String(index + 1), label }))
const errorText = (error: unknown) => (error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')

/** Server-side search, filters, sorting and pagination over GET /api/admin/members (PRD A-02, A-03), with exports of the same filter. */
export function MembersTable({ departments, districts }: { departments: Lookup[]; districts: Lookup[] }) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [filters, setFilters] = useState(noFilters)
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'name', asc: true })
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Page<Member>>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const params = new URLSearchParams({ q: debounced, ...filters, sort: sort.key, dir: sort.asc ? 'asc' : 'desc' })
  for (const [key, value] of [...params]) if (!value) params.delete(key)
  const filterString = params.toString()

  useEffect(() => {
    let cancelled = false
    api<Page<Member>>(`/api/admin/members?${filterString}&page=${page}&limit=${PAGE_SIZE}`)
      .then((result) => { if (!cancelled) { setData(result); setError(undefined) } })
      .catch((e) => { if (!cancelled) setError(errorText(e)) })
    return () => { cancelled = true }
  }, [filterString, page])

  const activeFilters = Object.values(filters).filter(Boolean).length + (debounced ? 1 : 0)
  const total = data?.total ?? 0
  const current = data?.page ?? page
  const pages = data?.pages ?? 1

  const setFilter = (key: keyof typeof filters) => (event: { target: { value: string } }) => {
    setFilters((f) => ({ ...f, [key]: event.target.value }))
    setPage(1)
  }

  const SortButton = ({ label, sortKey }: { label: string; sortKey: SortKey }) => {
    const active = sort.key === sortKey
    return (
      <button type="button" className="sort-button" onClick={() => { setSort({ key: sortKey, asc: active ? !sort.asc : true }); setPage(1) }} aria-label={`Sort by ${label.toLowerCase()}`}>
        {label}{active && (sort.asc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    )
  }
  const ariaSort = (key: SortKey) => (sort.key === key ? (sort.asc ? 'ascending' : 'descending') : undefined)

  return (
    <div className="members-table">
      <div className="toolbar">
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search members</span>
          <input type="search" placeholder="Search by name, email or phone" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} />
        </label>
        <div className="export-buttons">
          {(['csv', 'xlsx', 'pdf'] as const).map((format) => (
            <a key={format} className="button-secondary" href={`/api/admin/export/?${filterString}&format=${format}`} download>
              <Download size={15} /> {format === 'xlsx' ? 'Excel' : format.toUpperCase()}
            </a>
          ))}
        </div>
      </div>
      <div className="filter-row">
        <SelectField label="Department" placeholder="All" options={departments.map((d) => ({ value: d.id, label: d.name }))} value={filters.department} onChange={setFilter('department')} />
        <SelectField label="District" placeholder="All" options={districts.map((d) => ({ value: d.id, label: d.name }))} value={filters.district} onChange={setFilter('district')} />
        <SelectField label="Marital status" placeholder="All" options={maritalOptions} value={filters.marital} onChange={setFilter('marital')} />
        <SelectField label="Status" placeholder="All" options={statusOptions} value={filters.status} onChange={setFilter('status')} />
        <SelectField label="Birthday month" placeholder="All" options={monthOptions} value={filters.birthMonth} onChange={setFilter('birthMonth')} />
      </div>
      <div className="table-meta">
        <span role="status">{data ? `${total} ${total === 1 ? 'member' : 'members'}${activeFilters ? ' match' : ''} · exports include all ${total}` : 'Loading members…'}</span>
        {activeFilters > 0 && (
          <button type="button" className="pathway-link" onClick={() => { setQuery(''); setDebounced(''); setFilters(noFilters); setPage(1) }}>Clear filters</button>
        )}
      </div>
      {error && <FormResult error>{error}</FormResult>}

      <div className="table-scroll">
        <table className="data-table" aria-busy={!data}>
          <thead>
            <tr>
              <th scope="col" aria-sort={ariaSort('name')}><SortButton label="Name" sortKey="name" /></th>
              <th scope="col">Department</th>
              <th scope="col">District</th>
              <th scope="col" aria-sort={ariaSort('dateOfBirth')}><SortButton label="Birthday" sortKey="dateOfBirth" /></th>
              <th scope="col">Status</th>
              <th scope="col" aria-sort={ariaSort('createdAt')}><SortButton label="Joined" sortKey="createdAt" /></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((m) => (
              <tr key={m.id}>
                <td>
                  <Link className="table-name" href={`${routes.adminMembers.path}/${m.id}`}>{fullName(m)}</Link>
                  <span className="table-sub">{m.email}</span>
                </td>
                <td>{lookupName(departments, m.departmentId)}</td>
                <td>{lookupName(districts, m.districtId)}</td>
                <td>{formatDate(m.dateOfBirth, false)}</td>
                <td><StatusBadge status={m.status} /></td>
                <td>{formatDate(m.createdAt)}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && <tr><td colSpan={6} className="table-empty">{activeFilters ? 'No members match these filters.' : 'No members yet. Share the sign-up link to get started.'}</td></tr>}
          </tbody>
        </table>
      </div>

      <nav className="pagination" aria-label="Members pages">
        <button type="button" className="icon-button" disabled={current <= 1} onClick={() => setPage(current - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
        <span>Page {current} of {pages}</span>
        <button type="button" className="icon-button" disabled={current >= pages} onClick={() => setPage(current + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
      </nav>
    </div>
  )
}

/** New members usually join through the public sign-up link, so admins share it (WhatsApp, bulletin, email). */
export function ShareSignupLink() {
  const [state, setState] = useState<'idle' | 'copied' | 'blocked'>('idle')
  const [url, setUrl] = useState('')

  const copy = async () => {
    const link = `${window.location.origin}${routes.signup.path}/`
    setUrl(link)
    try {
      await navigator.clipboard.writeText(link)
      setState('copied')
    } catch {
      // Clipboard access can be blocked; show the link so it can be copied by hand.
      setState('blocked')
    }
  }

  return (
    <div className="share-link">
      <button type="button" className="button-primary" onClick={copy}>
        {state === 'copied' ? <><Check size={15} /> Link copied</> : <><Link2 size={15} /> Copy sign-up link</>}
      </button>
      {state === 'blocked' && <span className="field-hint">Copy this link: {url}</span>}
    </div>
  )
}

/** Adds someone by hand (PRD A-05); they get the same email to set their password. */
export function AddMemberForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const form = useForm({ firstName: '', lastName: '', email: '' })

  if (!open) return <button type="button" className="button-secondary" onClick={() => { setOpen(true); form.setState('idle') }}><UserPlus size={15} /> Add a member</button>

  return (
    <form className="form-stack add-member" noValidate onSubmit={form.submit((f) => v.collect({
      firstName: v.required(f.firstName, 'a first name'), lastName: v.required(f.lastName, 'a last name'), email: v.email(f.email),
    }), async (f) => {
      await api('/api/admin/members', { body: f })
      form.setValues({ firstName: '', lastName: '', email: '' })
      router.refresh()
    })}>
      <div className="form-grid">
        <Field label="First name" autoComplete="off" {...form.bind('firstName')} />
        <Field label="Last name" autoComplete="off" {...form.bind('lastName')} />
        <Field className="span-2" label="Email address" type="email" autoComplete="off" hint="We email them a link to set their password." {...form.bind('email')} />
      </div>
      {form.formError && <FormResult error>{form.formError}</FormResult>}
      {form.done && <FormResult>Member added and their sign-up link emailed. Add another, or close this form.</FormResult>}
      <div className="form-actions">
        <button className="button-primary" type="submit" disabled={form.sending}><Plus size={15} /> {form.sending ? 'Adding…' : 'Add member'}</button>
        <button className="button-secondary" type="button" onClick={() => setOpen(false)}>Close</button>
      </div>
    </form>
  )
}

export function MemberActions({ member, isSelf }: { member: Member; isSelf: boolean }) {
  const router = useRouter()
  const [message, setMessage] = useState<{ ok: boolean; text: string }>()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<string>) => {
    setBusy(true)
    setConfirmDelete(false)
    try {
      setMessage({ ok: true, text: await action() })
      router.refresh()
    } catch (error) {
      setMessage({ ok: false, text: errorText(error) })
    } finally {
      setBusy(false)
    }
  }

  const setStatus = (status: Status, text: string) => run(async () => {
    await api(`/api/admin/members/${member.id}`, { method: 'PATCH', body: { status } })
    return text
  })

  return (
    <div className="member-actions">
      <div className="member-actions-status">Status <StatusBadge status={member.status} /></div>
      {member.deletionRequestedAt && <FormResult error>Asked for their account to be deleted on {formatDate(member.deletionRequestedAt)}. Confirm with them, then delete the record.</FormResult>}
      <div className="action-list">
        {member.status === 'PENDING' && (
          <button type="button" className="button-primary" disabled={busy} onClick={() => setStatus('ACTIVE', member.emailVerified ? 'Approved. We have emailed them to say they can sign in.' : 'Approved. They can sign in once they have set a password from their sign-up email.')}>Approve sign-up</button>
        )}
        {member.status === 'ACTIVE' && !isSelf && (
          <button type="button" className="button-secondary" disabled={busy} onClick={() => setStatus('INACTIVE', 'Deactivated. They have been signed out and cannot sign in.')}><Power size={15} /> Deactivate</button>
        )}
        {member.status === 'INACTIVE' && (
          <button type="button" className="button-secondary" disabled={busy} onClick={() => setStatus('ACTIVE', 'Reactivated.')}><Power size={15} /> Reactivate</button>
        )}
        <button type="button" className="button-secondary" disabled={busy} onClick={() => run(async () => {
          const result = await api<{ email: string; kind: 'reset' | 'setup' }>(`/api/admin/members/${member.id}/reset-password`, { method: 'POST' })
          return result.kind === 'reset' ? `A password reset link was emailed to ${result.email}.` : `They have not set a password yet, so their sign-up link was re-sent to ${result.email}.`
        })}>
          <KeyRound size={15} /> {member.emailVerified ? 'Send password reset' : 'Resend sign-up link'}
        </button>
        {!isSelf && (confirmDelete ? (
          <div className="danger-confirm">
            <p>Delete {fullName(member)} permanently? Their audit history is kept.</p>
            <div className="form-actions">
              <button type="button" className="button-danger" disabled={busy} onClick={() => run(async () => {
                await api(`/api/admin/members/${member.id}`, { method: 'DELETE' })
                router.replace(routes.adminMembers.path)
                return 'Deleted.'
              })}><Trash2 size={15} /> Delete</button>
              <button type="button" className="button-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button type="button" className="button-danger-outline" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Delete member</button>
        ))}
      </div>
      {message && <FormResult error={!message.ok}>{message.text}</FormResult>}
    </div>
  )
}

type LookupWithCount = Lookup & { members: number }

/** Departments or districts CRUD (PRD A-07). */
export function LookupManager({ kind, initial }: { kind: 'department' | 'district'; initial: LookupWithCount[] }) {
  const base = `/api/admin/${kind === 'department' ? 'departments' : 'districts'}`
  const [items, setItems] = useState(initial)
  const [name, setName] = useState('')
  const [error, setError] = useState<string>()
  const [editing, setEditing] = useState<{ id: string; name: string; error?: string }>()
  const [busy, setBusy] = useState(false)

  const sorted = (list: LookupWithCount[]) => [...list].sort((a, b) => a.name.localeCompare(b.name))

  const add = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return setError(`Enter a ${kind} name.`)
    setBusy(true)
    try {
      const item = await api<LookupWithCount>(base, { body: { name: name.trim() } })
      setItems((list) => sorted([...list, item]))
      setName('')
      setError(undefined)
    } catch (e) {
      setError(e instanceof ApiError ? e.fields.name ?? e.message : errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const patch = async (id: string, body: { name?: string; isActive?: boolean }) => {
    const item = await api<LookupWithCount>(`${base}/${id}`, { method: 'PATCH', body })
    setItems((list) => sorted(list.map((x) => (x.id === id ? item : x))))
  }

  const rename = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing?.name.trim()) return
    setBusy(true)
    try {
      await patch(editing.id, { name: editing.name.trim() })
      setEditing(undefined)
    } catch (e) {
      setEditing({ ...editing, error: e instanceof ApiError ? e.fields.name ?? e.message : errorText(e) })
    } finally {
      setBusy(false)
    }
  }

  const act = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(undefined)
    try { await fn() } catch (e) { setError(errorText(e)) } finally { setBusy(false) }
  }

  return (
    <div className="lookup-manager">
      <form className="lookup-add" onSubmit={add} noValidate>
        <Field label={`New ${kind}`} value={name} error={error} onChange={(e) => { setName(e.target.value); setError(undefined) }} />
        <button className="button-primary" type="submit" disabled={busy}><Plus size={15} /> Add</button>
      </form>
      <ul className="lookup-list">
        {items.map((item) => (
          <li key={item.id} className={item.isActive ? undefined : 'is-inactive'}>
            {editing?.id === item.id ? (
              <form className="lookup-rename" onSubmit={rename}>
                <label className="sr-only" htmlFor={`rename-${item.id}`}>Rename {item.name}</label>
                <input id={`rename-${item.id}`} value={editing.name} autoFocus aria-invalid={editing.error ? true : undefined} onChange={(e) => setEditing({ id: item.id, name: e.target.value })} />
                <button className="button-primary" type="submit" disabled={busy}>Save</button>
                <button className="button-secondary" type="button" onClick={() => setEditing(undefined)}>Cancel</button>
                {editing.error && <span className="field-error">{editing.error}</span>}
              </form>
            ) : (
              <>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.members} {item.members === 1 ? 'member' : 'members'}{item.isActive ? '' : ' · Hidden from members'}</span>
                </div>
                <div className="lookup-actions">
                  <button type="button" className="icon-button" aria-label={`Rename ${item.name}`} onClick={() => setEditing({ id: item.id, name: item.name })}><Pencil size={15} /></button>
                  <button type="button" className="text-button" disabled={busy} onClick={() => act(() => patch(item.id, { isActive: !item.isActive }))}>
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button" className="icon-button danger" aria-label={`Delete ${item.name}`}
                    disabled={busy || item.members > 0} title={item.members > 0 ? `Move its ${item.members} members first, or deactivate it instead` : undefined}
                    onClick={() => act(async () => {
                      await api(`${base}/${item.id}`, { method: 'DELETE' })
                      setItems((list) => list.filter((x) => x.id !== item.id))
                    })}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="table-empty">None yet. Add the first one above.</li>}
      </ul>
    </div>
  )
}

export function SettingsForm({ initial }: { initial: ApprovalMode }) {
  const [approval, setApproval] = useState(initial)
  const [state, setState] = useState<{ ok: boolean; text: string }>()
  const [busy, setBusy] = useState(false)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      await api('/api/admin/settings', { method: 'PATCH', body: { approval } })
      setState({ ok: true, text: 'Settings saved.' })
    } catch (e) {
      setState({ ok: false, text: errorText(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form-stack" onSubmit={save}>
      <fieldset>
        <legend>New sign-ups</legend>
        <div className="radio-cards">
          {([
            ['manual', 'Approve each sign-up', 'New members can sign in only after a Super Admin approves them on the Members page.'],
            ['auto', 'Activate after email verification', 'New members can sign in as soon as they verify their email address.'],
          ] as const).map(([value, title, text]) => (
            <label key={value} className="radio-card">
              <input type="radio" name="approval" value={value} checked={approval === value} onChange={() => { setApproval(value); setState(undefined) }} />
              <span><strong>{title}</strong><span>{text}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-actions"><button className="button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></div>
      {state && <FormResult error={!state.ok}>{state.text}</FormResult>}
    </form>
  )
}

/** Grant Super Admin to an existing member by email, or take it away (PRD A-10). */
export function AdminManager({ selfId, admins }: { selfId: string; admins: Member[] }) {
  const router = useRouter()
  const form = useForm({ email: '' })
  const [message, setMessage] = useState<{ ok: boolean; text: string }>()
  const [busy, setBusy] = useState<string>()

  const revoke = async (admin: Member) => {
    setBusy(admin.id)
    try {
      await api(`/api/admin/users/${admin.id}`, { method: 'DELETE' })
      setMessage({ ok: true, text: `${fullName(admin)} is no longer a Super Admin.` })
      router.refresh()
    } catch (e) {
      setMessage({ ok: false, text: errorText(e) })
    } finally {
      setBusy(undefined)
    }
  }

  return (
    <>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Status</th><th scope="col">Last signed in</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td><Link className="table-name" href={`${routes.adminMembers.path}/${admin.id}`}>{fullName(admin)}</Link>{admin.id === selfId && <span className="table-sub">You</span>}</td>
                <td>{admin.email}</td>
                <td><StatusBadge status={admin.status} /></td>
                <td className="nowrap">{admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Never'}</td>
                <td>
                  {admin.id !== selfId && (
                    <button type="button" className="text-button" disabled={busy === admin.id} onClick={() => revoke(admin)}>
                      <ShieldOff size={14} aria-hidden="true" /> Remove admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <FormResult error={!message.ok}>{message.text}</FormResult>}

      <form className="lookup-add" noValidate onSubmit={form.submit((f) => v.collect({ email: v.email(f.email) }), async (f) => {
        await api('/api/admin/users', { body: f })
        setMessage({ ok: true, text: `${f.email.trim()} is now a Super Admin. They will see the admin area next time they load a page.` })
        form.setValues({ email: '' })
        router.refresh()
      })}>
        <Field label="Make a member a Super Admin" type="email" autoComplete="off" placeholder="their.email@example.com" {...form.bind('email')} />
        <button className="button-primary" type="submit" disabled={form.sending}><Plus size={15} /> Add admin</button>
      </form>
      {form.formError && <FormResult error>{form.formError}</FormResult>}
    </>
  )
}
