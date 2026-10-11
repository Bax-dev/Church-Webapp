'use client'

import { useState, type ChangeEvent } from 'react'
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Upload } from 'lucide-react'

import { Field, FormResult } from '@/components/portal/fields'
import { Avatar } from '@/components/portal/ui'
import { MAX_PASTORS, type Pastor } from '@/config/pastors'
import { routes } from '@/config/routes'
import { ApiError, api } from '@/lib/api-client'

type Errors = Record<string, Partial<Record<'name' | 'title' | 'bio' | 'photo', string>>>

const newId = () => Math.random().toString(36).slice(2, 12)
const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(-2).map((word) => word[0]).join('').toUpperCase() || '?'

/** Edits the whole list locally; Save publishes it to the About page in one go. */
export function PastorEditor({ initial }: { initial: Pastor[] }) {
  const [pastors, setPastors] = useState(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [uploading, setUploading] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string }>()
  const [dirty, setDirty] = useState(false)

  const change = (next: Pastor[]) => {
    setPastors(next)
    setDirty(true)
    setResult(undefined)
  }
  const update = (id: string, patch: Partial<Pastor>) => change(pastors.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const move = (index: number, by: -1 | 1) => {
    const next = [...pastors]
    ;[next[index], next[index + by]] = [next[index + by], next[index]]
    change(next)
  }
  const fieldError = (id: string, key: keyof Errors[string], text?: string) =>
    setErrors((all) => ({ ...all, [id]: { ...all[id], [key]: text } }))

  const upload = (id: string) => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) return fieldError(id, 'photo', 'Choose a JPG or PNG image.')
    if (file.size > 2 * 1024 * 1024) return fieldError(id, 'photo', 'Choose an image of 2 MB or less.')
    const body = new FormData()
    body.set('photo', file)
    setUploading(id)
    try {
      const { photoUrl } = await api<{ photoUrl: string }>('/api/admin/pastors/photo', { body })
      update(id, { photoUrl })
      fieldError(id, 'photo', undefined)
    } catch (error) {
      fieldError(id, 'photo', error instanceof ApiError ? error.message : 'The upload failed. Please try again.')
    } finally {
      setUploading(undefined)
    }
  }

  const validate = () => {
    const found: Errors = {}
    for (const p of pastors) {
      const e: Errors[string] = {}
      if (!p.name.trim()) e.name = 'Enter a name.'
      if (!p.title.trim()) e.title = 'Enter a title, like Senior Pastor.'
      if (Object.keys(e).length) found[p.id] = e
    }
    setErrors(found)
    return Object.keys(found).length === 0
  }

  const save = async () => {
    if (!validate()) return setResult({ ok: false, text: 'Fill in the highlighted fields, then save again.' })
    setSaving(true)
    try {
      const saved = await api<Pastor[]>('/api/admin/pastors', { method: 'PUT', body: { pastors } })
      setPastors(saved)
      setDirty(false)
      setResult({ ok: true, text: saved.length ? 'Saved. The About page shows the new list now.' : 'Saved. The pastors section is hidden until you add someone.' })
    } catch (error) {
      setResult({ ok: false, text: error instanceof ApiError ? error.message : 'Saving failed. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pastor-editor">
      {pastors.length === 0 && <p className="panel-text">No pastors yet. Add the first one below; the section appears on the About page once the list is saved.</p>}

      <ol className="pastor-list">
        {pastors.map((p, index) => {
          const e = errors[p.id] ?? {}
          return (
            <li key={p.id} className="pastor-item">
              <div className="pastor-item-photo">
                <Avatar text={initialsOf(p.name)} src={p.photoUrl} size="lg" />
                <label className="button-secondary file-button" aria-disabled={uploading === p.id}>
                  <Upload size={15} aria-hidden="true" /> {uploading === p.id ? 'Uploading…' : p.photoUrl ? 'Change' : 'Photo'}
                  <input type="file" accept="image/jpeg,image/png" onChange={upload(p.id)} disabled={uploading === p.id} />
                </label>
                {p.photoUrl && <button type="button" className="text-button" onClick={() => update(p.id, { photoUrl: null })}>Remove photo</button>}
                <span className={e.photo ? 'field-error' : 'field-hint'}>{e.photo ?? 'JPG or PNG, up to 2 MB'}</span>
              </div>

              <div className="pastor-item-fields">
                <div className="form-grid">
                  <Field label="Name" value={p.name} error={e.name} maxLength={80} placeholder="Rev. Dr. …" onChange={(ev) => update(p.id, { name: ev.target.value })} />
                  <Field label="Title" value={p.title} error={e.title} maxLength={60} placeholder="Senior Pastor" onChange={(ev) => update(p.id, { title: ev.target.value })} />
                </div>
                <label className="field">
                  <span className="field-label">Short bio (optional)</span>
                  <textarea rows={3} maxLength={500} value={p.bio} onChange={(ev) => update(p.id, { bio: ev.target.value })} />
                  <span className="field-hint">{p.bio.length}/500 characters</span>
                </label>
              </div>

              <div className="pastor-item-actions">
                <button type="button" className="icon-button" aria-label={`Move ${p.name || 'pastor'} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} /></button>
                <button type="button" className="icon-button" aria-label={`Move ${p.name || 'pastor'} down`} disabled={index === pastors.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button>
                <button type="button" className="icon-button danger" aria-label={`Remove ${p.name || 'pastor'}`} onClick={() => change(pastors.filter((x) => x.id !== p.id))}><Trash2 size={15} /></button>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="form-actions">
        <button
          type="button" className="button-secondary" disabled={pastors.length >= MAX_PASTORS}
          onClick={() => change([...pastors, { id: newId(), name: '', title: '', bio: '', photoUrl: null }])}
        >
          <Plus size={15} /> Add a pastor
        </button>
        <button type="button" className="button-primary" onClick={save} disabled={saving || !dirty}><Save size={15} /> {saving ? 'Saving…' : 'Save changes'}</button>
        <a className="pathway-link" href={`${routes.about.path}/#pastors`} target="_blank" rel="noreferrer">View on the About page</a>
      </div>
      {dirty && !result && <p className="field-hint">You have unsaved changes. Nothing changes on the site until you save.</p>}
      {result && <FormResult error={!result.ok}>{result.text}</FormResult>}
    </div>
  )
}
