'use client'

import { useRef, useState } from 'react'
import { Eye, Send } from 'lucide-react'

import { AnnouncementCard, openAnnouncement } from '@/components/announcement-popup'
import { CheckboxField, Field, FormResult } from '@/components/portal/fields'
import { isAnnouncementLive, type Announcement, type AnnouncementAudience } from '@/config/announcement'
import { routes } from '@/config/routes'
import { ApiError, api } from '@/lib/api-client'

/** Public pages an announcement can target. */
const publicPages = [
  { path: routes.home.path, label: 'Home' },
  ...[routes.about, routes.getInvolved, routes.members, routes.visit, routes.faqs].map((route) => ({ path: route.path, label: route.title })),
]

const audiences: { value: AnnouncementAudience; title: string; text: string }[] = [
  { value: 'public', title: 'Public website', text: 'Visitors to the church website.' },
  { value: 'members', title: 'Member portal', text: 'Members when they open their dashboard, profile or settings.' },
  { value: 'everyone', title: 'Both', text: 'The public website and the member portal.' },
]

const blank: Announcement = { id: '', enabled: true, audience: 'everyone', title: '', message: '', pages: 'all', delaySeconds: 1.5 }

function scheduleStatus(a: Announcement) {
  const today = new Date().toISOString().slice(0, 10)
  if (!a.enabled) return { tone: 'inactive', text: 'Switched off' }
  if (a.endsOn && today > a.endsOn) return { tone: 'inactive', text: `Ended ${a.endsOn}` }
  if (a.startsOn && today < a.startsOn) return { tone: 'pending', text: `Scheduled from ${a.startsOn}` }
  return { tone: 'active', text: 'Live now' }
}

export function AnnouncementEditor({ initial }: { initial: Announcement | null }) {
  const [draft, setDraft] = useState<Announcement>(initial ?? blank)
  const [live, setLive] = useState(initial)
  const [errors, setErrors] = useState<Partial<Record<'title' | 'message' | 'link' | 'dates', string>>>({})
  const [result, setResult] = useState<{ ok: boolean; text: string }>()
  const [publishing, setPublishing] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)

  const update = (patch: Partial<Announcement>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setResult(undefined)
    // Editing a field retires its old message; Publish checks everything again.
    const touched = Object.keys(patch).map((key) => (key === 'startsOn' || key === 'endsOn' ? 'dates' : key))
    setErrors((current) => {
      if (!touched.some((key) => key in current)) return current
      return Object.fromEntries(Object.entries(current).filter(([key]) => !touched.includes(key)))
    })
  }

  const validate = () => {
    const found: typeof errors = {}
    if (!draft.title.trim()) found.title = 'Enter a title.'
    if (!draft.message.trim()) found.message = 'Enter a message.'
    if (draft.link && (!draft.link.label.trim() || !/^(\/(?!\/)|https?:\/\/)/.test(draft.link.href))) {
      found.link = 'A button needs a label and a link that starts with / or https://.'
    }
    if (draft.startsOn && draft.endsOn && draft.endsOn < draft.startsOn) found.dates = 'The end date is before the start date.'
    setErrors(found)
    return Object.keys(found).length === 0
  }

  const publish = async () => {
    if (!validate()) return
    setPublishing(true)
    try {
      const { id: _id, ...body } = draft
      const saved = await api<Announcement>('/api/admin/announcement', { method: 'PUT', body })
      setDraft(saved)
      setLive(saved)
      setResult({ ok: true, text: saved.enabled ? 'Published. Visitors see it on their next page load.' : 'Saved. The popup is switched off.' })
    } catch (error) {
      const fields = error instanceof ApiError ? error.fields : {}
      setErrors({ title: fields.title, message: fields.message, link: fields.link, dates: fields.endsOn })
      setResult({ ok: false, text: error instanceof ApiError ? error.message : 'Publishing failed. Please try again.' })
    } finally {
      setPublishing(false)
    }
  }

  const preview = () => { if (validate()) openAnnouncement(dialog.current) }

  const status = scheduleStatus(draft)
  const pages = draft.pages === 'all' ? [] : draft.pages

  return (
    <div className="announcement-editor">
      <div className="announcement-form">
        <div className="live-status">
          <span>
            {live === null ? 'No announcement is published yet.'
              : <>Published: <strong>{live.title}</strong> · {isAnnouncementLive(live, '/') || isAnnouncementLive(live, routes.dashboard.path) ? 'showing now' : 'not showing right now'}</>}
          </span>
          <span className={`badge badge-${status.tone}`}>{status.text}</span>
        </div>

        <fieldset>
          <legend>Content</legend>
          <div className="form-stack">
            <CheckboxField label="Show this announcement" checked={draft.enabled} onChange={(e) => update({ enabled: e.target.checked })} />
            <Field label="Title" value={draft.title} error={errors.title} maxLength={80} onChange={(e) => update({ title: e.target.value })} />
            <label className="field">
              <span className="field-label">Message</span>
              <textarea
                rows={4} maxLength={400} value={draft.message}
                aria-invalid={errors.message ? true : undefined}
                onChange={(e) => update({ message: e.target.value })}
              />
              {errors.message ? <span className="field-error">{errors.message}</span> : <span className="field-hint">{draft.message.length}/400 characters</span>}
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Button</legend>
          <CheckboxField
            label="Include a button"
            checked={Boolean(draft.link)}
            onChange={(e) => update({ link: e.target.checked ? { label: 'Find out more', href: routes.visit.path } : undefined })}
          />
          {draft.link && (
            <div className="form-grid">
              <Field label="Button label" value={draft.link.label} onChange={(e) => update({ link: { ...draft.link!, label: e.target.value } })} />
              <Field label="Link" value={draft.link.href} hint="A page like /visit, or a full https:// address" error={errors.link} onChange={(e) => update({ link: { ...draft.link!, href: e.target.value } })} />
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend>Who sees it</legend>
          <div className="radio-cards">
            {audiences.map((option) => (
              <label key={option.value} className="radio-card">
                <input type="radio" name="audience" checked={draft.audience === option.value} onChange={() => update({ audience: option.value })} />
                <span><strong>{option.title}</strong><span>{option.text}</span></span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>When and where</legend>
          <div className="form-grid">
            <Field label="Start showing on (optional)" type="date" value={draft.startsOn ?? ''} onChange={(e) => update({ startsOn: e.target.value || undefined })} />
            <Field label="Stop after (optional)" type="date" value={draft.endsOn ?? ''} error={errors.dates} onChange={(e) => update({ endsOn: e.target.value || undefined })} />
            <Field
              label="Delay before it appears (seconds)" type="number" min={0} max={30} step={0.5}
              value={draft.delaySeconds ?? 1} onChange={(e) => update({ delaySeconds: Math.min(30, Math.max(0, Number(e.target.value) || 0)) })}
            />
          </div>
          {draft.audience !== 'members' && <div className="radio-cards pages-choice">
            <label className="radio-card">
              <input type="radio" name="pages" checked={draft.pages === 'all'} onChange={() => update({ pages: 'all' })} />
              <span><strong>Every public page</strong><span>Never shown on admin or sign-in pages.</span></span>
            </label>
            <label className="radio-card">
              <input type="radio" name="pages" checked={draft.pages !== 'all'} onChange={() => update({ pages: [routes.home.path] })} />
              <span><strong>Only some public pages</strong><span>Choose them below.</span></span>
            </label>
          </div>}
          {draft.audience !== 'members' && draft.pages !== 'all' && (
            <div className="page-checks">
              {publicPages.map((page) => (
                <CheckboxField
                  key={page.path} label={page.label} checked={pages.includes(page.path)}
                  onChange={(e) => update({ pages: e.target.checked ? [...pages, page.path] : pages.filter((p) => p !== page.path) })}
                />
              ))}
            </div>
          )}
        </fieldset>

        <div className="form-actions">
          <button type="button" className="button-secondary" onClick={preview}><Eye size={15} /> Preview as popup</button>
          <button type="button" className="button-primary" onClick={publish} disabled={publishing}><Send size={15} /> {publishing ? 'Publishing…' : 'Publish'}</button>
        </div>
        {result && <FormResult error={!result.ok}>{result.text}</FormResult>}
      </div>

      <div className="announcement-preview">
        <span className="eyebrow">Preview</span>
        {draft.title || draft.message
          ? <AnnouncementCard announcement={{ ...draft, title: draft.title || 'Title', message: draft.message || 'Message' }} onClose={() => {}} onLater={() => {}} />
          : <p className="panel-text">Start writing to see a preview.</p>}
      </div>

      <dialog ref={dialog} className="announcement-dialog" aria-label="Announcement preview" onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close() }}>
        <AnnouncementCard announcement={draft} onClose={() => dialog.current?.close()} onLater={() => dialog.current?.close()} />
      </dialog>
    </div>
  )
}
