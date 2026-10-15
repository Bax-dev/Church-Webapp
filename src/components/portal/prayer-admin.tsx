'use client'

import { useState, type ChangeEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, FileText, Pencil, Plus, Save, Trash2, Upload, Wand2 } from 'lucide-react'
import type { z } from 'zod'

import { imageUrl } from '@/components/content'
import { CheckboxField, Field, FormResult } from '@/components/portal/fields'
import { Panel } from '@/components/portal/ui'
import {
  emptyGuide, guideSchema, lagosNow, longDate, parseGuideText, programSchema, weekdays,
  type PrayerGuide, type PrayerProgram, type StoredGuide,
} from '@/config/prayer'
import { routes } from '@/config/routes'
import { ApiError, api } from '@/lib/api-client'

type Problems = Record<string, string>
type Result = { ok: boolean; text: string } | undefined

/** Zod issues → one message per dotted path, e.g. "zoom.url" or "prayers.2.title". */
function problemsOf(error: z.ZodError): Problems {
  const found: Problems = {}
  for (const issue of error.issues) found[issue.path.join('.')] ??= issue.message
  return found
}

const errorText = (error: unknown) => (error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')

function Textarea({ label, value, onChange, rows = 4, hint, error }: { label: string; value: string; onChange: (value: string) => void; rows?: number; hint?: string; error?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <textarea rows={rows} value={value} aria-invalid={error ? true : undefined} onChange={(e) => onChange(e.target.value)} />
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Toggle({ label, text, checked, onChange }: { label: string; text: ReactNode; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={`prayer-toggle${checked ? ' is-on' : ''}`}>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="prayer-toggle-track" aria-hidden="true" />
      <span><strong>{label}</strong><small>{text}</small></span>
    </label>
  )
}

// ── Programme settings ─────────────────────────────────────────────────────

export function ProgramForm({ initial }: { initial: PrayerProgram }) {
  const router = useRouter()
  const [p, setP] = useState(initial)
  const [problems, setProblems] = useState<Problems>({})
  const [result, setResult] = useState<Result>()
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = (patch: Partial<PrayerProgram>) => { setP((current) => ({ ...current, ...patch })); setResult(undefined) }
  const setYoutube = (patch: Partial<PrayerProgram['youtube']>) => set({ youtube: { ...p.youtube, ...patch } })
  const setZoom = (patch: Partial<PrayerProgram['zoom']>) => set({ zoom: { ...p.zoom, ...patch } })

  const save = async (next = p) => {
    const checked = programSchema.safeParse(next)
    if (!checked.success) {
      setProblems(problemsOf(checked.error))
      setResult({ ok: false, text: 'Fix the highlighted fields, then save again.' })
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.prayer-program [aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    try {
      const saved = await api<PrayerProgram>('/api/admin/prayer', { method: 'PUT', body: checked.data })
      setP(saved)
      setProblems({})
      setResult({ ok: true, text: saved.enabled ? 'Saved. The programme is showing on the website.' : 'Saved. The programme is hidden from the website.' })
      router.refresh()
    } catch (error) {
      setProblems(error instanceof ApiError ? error.fields : {})
      setResult({ ok: false, text: errorText(error) })
    } finally {
      setBusy(false)
    }
  }

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) return setProblems({ flyer: 'Choose a JPG or PNG image.' })
    if (file.size > 5 * 1024 * 1024) return setProblems({ flyer: 'Choose an image of 5 MB or less.' })
    const body = new FormData()
    body.set('image', file)
    setUploading(true)
    try {
      const { src } = await api<{ src: string }>('/api/admin/content/images', { body })
      set({ flyer: { src, alt: p.flyer?.alt || `${p.title} flyer` } })
      setProblems(({ flyer: _flyer, ...rest }) => rest)
    } catch (error) {
      setProblems({ flyer: errorText(error) })
    } finally {
      setUploading(false)
    }
  }

  const e = problems
  return (
    <div className="prayer-program form-stack">
      <Toggle
        label={p.enabled ? 'Showing on the website' : 'Hidden from the website'}
        text={p.enabled ? 'The Prayer page, the menu link and the home page section are live.' : 'Switch on to show the Prayer page, a menu link and (if chosen below) a home page section.'}
        checked={p.enabled}
        onChange={(enabled) => { const next = { ...p, enabled }; setP(next); void save(next) }}
      />

      <fieldset>
        <legend>About the programme</legend>
        <div className="form-grid">
          <Field label="Programme name" value={p.title} error={e.title} maxLength={80} onChange={(ev) => set({ title: ev.target.value })} />
          <Field label="Led by (optional)" value={p.host} error={e.host} maxLength={120} placeholder="Most Rev …" onChange={(ev) => set({ host: ev.target.value })} />
          <Field className="span-2" label="Tagline (optional)" value={p.tagline} error={e.tagline} maxLength={160} onChange={(ev) => set({ tagline: ev.target.value })} />
          <Field label="Short note (optional)" value={p.note} error={e.note} maxLength={160} onChange={(ev) => set({ note: ev.target.value })} />
          <Field label="Welcome line (optional)" value={p.welcome} error={e.welcome} maxLength={80} onChange={(ev) => set({ welcome: ev.target.value })} />
        </div>
        <CheckboxField label="Also show a section about it on the home page" checked={p.showOnHome} onChange={(ev) => set({ showOnHome: ev.target.checked })} />
      </fieldset>

      <fieldset>
        <legend>When</legend>
        <div className="form-grid">
          <Field className="span-2" label="As people should read it" value={p.scheduleLabel} error={e.scheduleLabel} maxLength={80} hint="e.g. 12am to 1am daily" onChange={(ev) => set({ scheduleLabel: ev.target.value })} />
          <Field label="Starts (Lagos time)" type="time" value={p.startTime} error={e.startTime} onChange={(ev) => set({ startTime: ev.target.value })} />
          <Field label="Ends (Lagos time)" type="time" value={p.endTime} error={e.endTime} hint="An end before the start means it runs past midnight." onChange={(ev) => set({ endTime: ev.target.value })} />
        </div>
        <div className="prayer-days" role="group" aria-label="Days">
          {weekdays.map((day, index) => (
            <label key={day} className={`prayer-day${p.days.includes(index) ? ' is-on' : ''}`}>
              <input type="checkbox" checked={p.days.includes(index)} onChange={(ev) => set({ days: ev.target.checked ? [...p.days, index].sort() : p.days.filter((d) => d !== index) })} />
              {day}
            </label>
          ))}
        </div>
        {e.days && <span className="field-error">{e.days}</span>}
        <p className="field-hint">The times and days drive the “Live now” badge and which join button is highlighted.</p>
      </fieldset>

      <fieldset>
        <legend>Flyer (optional)</legend>
        <div className="prayer-flyer-edit">
          {p.flyer
            // A preview of an uploaded file, so a plain img.
            ? <img src={imageUrl(p.flyer)} alt="" />
            : <div className="prayer-flyer-empty">No flyer</div>}
          <div className="form-stack">
            <div className="form-actions">
              <label className="button-secondary file-button" aria-disabled={uploading}>
                <Upload size={15} aria-hidden="true" /> {uploading ? 'Uploading…' : p.flyer ? 'Replace flyer' : 'Upload flyer'}
                <input type="file" accept="image/jpeg,image/png" onChange={upload} disabled={uploading} />
              </label>
              {p.flyer && <button type="button" className="text-button" onClick={() => set({ flyer: null })}>Remove</button>}
            </div>
            {e.flyer ? <span className="field-error">{e.flyer}</span> : <span className="field-hint">JPG or PNG, up to 5 MB. Square flyers work best.</span>}
            {p.flyer && (
              <Field
                label="Describe the flyer for screen readers" value={p.flyer.alt} error={e['flyer.alt']} maxLength={300}
                hint="Include the key details, e.g. the name, host and time."
                onChange={(ev) => set({ flyer: { ...p.flyer!, alt: ev.target.value } })}
              />
            )}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Join online</legend>
        <div className="prayer-links">
          <div className="prayer-link-card">
            <Toggle label="YouTube" text={p.youtube.enabled ? 'Shown' : 'Hidden'} checked={p.youtube.enabled} onChange={(enabled) => setYoutube({ enabled })} />
            <Field label="YouTube link" type="url" value={p.youtube.url} error={e['youtube.url']} placeholder="https://www.youtube.com/live/…" hint="A link to a particular video or live stream also plays on the Prayer page." onChange={(ev) => setYoutube({ url: ev.target.value })} />
            <Field label="Button label" value={p.youtube.label} error={e['youtube.label']} maxLength={40} onChange={(ev) => setYoutube({ label: ev.target.value })} />
          </div>
          <div className="prayer-link-card">
            <Toggle label="Zoom" text={p.zoom.enabled ? 'Shown' : 'Hidden'} checked={p.zoom.enabled} onChange={(enabled) => setZoom({ enabled })} />
            <Field label="Zoom link" type="url" value={p.zoom.url} error={e['zoom.url']} placeholder="https://us02web.zoom.us/j/…" onChange={(ev) => setZoom({ url: ev.target.value })} />
            <Field label="Button label" value={p.zoom.label} error={e['zoom.label']} maxLength={40} onChange={(ev) => setZoom({ label: ev.target.value })} />
            <div className="form-grid">
              <Field label="Meeting ID (optional)" value={p.zoom.meetingId} error={e['zoom.meetingId']} maxLength={40} onChange={(ev) => setZoom({ meetingId: ev.target.value })} />
              <Field label="Passcode (optional)" value={p.zoom.passcode} error={e['zoom.passcode']} maxLength={40} onChange={(ev) => setZoom({ passcode: ev.target.value })} />
            </div>
          </div>
        </div>
      </fieldset>

      {result && <FormResult error={!result.ok}>{result.text}</FormResult>}
      <div className="form-actions">
        <button type="button" className="button-primary" onClick={() => save()} disabled={busy}><Save size={15} /> {busy ? 'Saving…' : 'Save programme'}</button>
        <a className="pathway-link" href={`${routes.prayer.path}/`} target="_blank" rel="noreferrer">View the Prayer page <ExternalLink size={13} /></a>
      </div>
    </div>
  )
}

// ── Prayer guides ──────────────────────────────────────────────────────────

type Summary = { id: string; date: string; theme: string; published: boolean }

const nextFreeDate = (guides: Summary[]) => {
  const taken = new Set(guides.map((g) => g.date))
  const date = new Date(`${lagosNow().date}T12:00:00Z`)
  while (taken.has(date.toISOString().slice(0, 10))) date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

export function GuideManager({ initial }: { initial: Summary[] }) {
  const [guides, setGuides] = useState(initial)
  const [editing, setEditing] = useState<{ id?: string; guide: PrayerGuide }>()
  const [loading, setLoading] = useState<string>()
  const [error, setError] = useState<string>()

  const open = async (id: string) => {
    setLoading(id)
    setError(undefined)
    try {
      const { id: _id, updatedAt: _u, ...guide } = await api<StoredGuide>(`/api/admin/prayer/guides/${id}`)
      setEditing({ id, guide })
    } catch (e) {
      setError(errorText(e))
    } finally {
      setLoading(undefined)
    }
  }

  if (editing) {
    return (
      <GuideEditor
        key={editing.id ?? 'new'}
        id={editing.id}
        initial={editing.guide}
        onClose={() => setEditing(undefined)}
        onSaved={(saved) => setGuides((list) => [saved, ...list.filter((g) => g.id !== saved.id)].sort((a, b) => b.date.localeCompare(a.date)))}
        onDeleted={(id) => { setGuides((list) => list.filter((g) => g.id !== id)); setEditing(undefined) }}
      />
    )
  }

  const today = lagosNow().date
  return (
    <div className="form-stack">
      <div className="form-actions">
        <button type="button" className="button-primary" onClick={() => setEditing({ guide: emptyGuide(nextFreeDate(guides)) })}><Plus size={15} /> New prayer guide</button>
      </div>
      {error && <FormResult error>{error}</FormResult>}
      {guides.length === 0 ? (
        <p className="panel-text">No prayer guides yet. Add one, or paste the day’s guide and let the form fill itself in.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th scope="col">Date</th><th scope="col">Theme</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {guides.map((g) => (
                <tr key={g.id}>
                  <td className="nowrap">{longDate(g.date)}{g.date === today && <span className="table-sub">Tonight</span>}</td>
                  <td>{g.theme}</td>
                  <td>
                    <span className={`badge badge-${!g.published ? 'inactive' : g.date > today ? 'pending' : 'active'}`}>
                      {!g.published ? 'Draft' : g.date > today ? 'Scheduled' : 'Published'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="text-button" onClick={() => open(g.id)} disabled={loading === g.id}>
                      <Pencil size={13} aria-hidden="true" /> {loading === g.id ? 'Opening…' : 'Edit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Paragraphs are separated by a blank line; list items by a new line. */
const toParagraphs = (value: string) => value.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)
const toLines = (value: string) => value.split('\n').map((line) => line.replace(/^[•·●▪◦*\-–]\s*/, '').trim()).filter(Boolean)

function GuideEditor({ id, initial, onClose, onSaved, onDeleted }: {
  id?: string; initial: PrayerGuide; onClose: () => void; onSaved: (guide: Summary) => void; onDeleted: (id: string) => void
}) {
  const [guideId, setGuideId] = useState(id)
  const [g, setG] = useState(initial)
  // Lists are edited as plain text, so typing a new line or blank line feels natural; they are split on save.
  const [focus, setFocus] = useState(initial.focus.join('\n'))
  const [exposition, setExposition] = useState(initial.exposition.join('\n\n'))
  const [declarations, setDeclarations] = useState(initial.declarations.join('\n'))
  const [finalPrayer, setFinalPrayer] = useState(initial.finalPrayer.join('\n\n'))
  const [prayers, setPrayers] = useState(initial.prayers.map((p) => ({ title: p.title, points: p.points.join('\n') })))
  const [paste, setPaste] = useState('')
  const [pasteNote, setPasteNote] = useState<string>()
  const [problems, setProblems] = useState<Problems>({})
  const [result, setResult] = useState<Result>()
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (patch: Partial<PrayerGuide>) => { setG((current) => ({ ...current, ...patch })); setResult(undefined) }
  const touch = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setResult(undefined) }

  const fill = () => {
    const parsed = parseGuideText(paste, g.date)
    setG({ ...parsed, published: g.published })
    setFocus(parsed.focus.join('\n'))
    setExposition(parsed.exposition.join('\n\n'))
    setDeclarations(parsed.declarations.join('\n'))
    setFinalPrayer(parsed.finalPrayer.join('\n\n'))
    setPrayers(parsed.prayers.map((p) => ({ title: p.title, points: p.points.join('\n') })))
    setProblems({})
    setPasteNote(parsed.theme
      ? `Filled in: ${longDate(parsed.date)}, ${parsed.focus.length} focus points, ${parsed.exposition.length} exposition paragraphs, ${parsed.prayers.length} prayer sections, ${parsed.declarations.length} declarations, ${parsed.finalPrayer.length} final-prayer paragraphs. Check it below, then save.`
      : 'Could not find a “THEME:” line. Check the pasted text, or fill in the fields by hand.')
  }

  const assembled = (): PrayerGuide => ({
    ...g,
    focus: toLines(focus),
    exposition: toParagraphs(exposition),
    declarations: toLines(declarations),
    finalPrayer: toParagraphs(finalPrayer),
    prayers: prayers.map((p) => ({ title: p.title.trim(), points: toLines(p.points) })),
  })

  const save = async () => {
    const checked = guideSchema.safeParse(assembled())
    if (!checked.success) {
      setProblems(problemsOf(checked.error))
      setResult({ ok: false, text: 'Fix the highlighted fields, then save again.' })
      return
    }
    setBusy(true)
    try {
      const saved = await api<StoredGuide>(guideId ? `/api/admin/prayer/guides/${guideId}` : '/api/admin/prayer/guides', { method: guideId ? 'PUT' : 'POST', body: checked.data })
      setGuideId(saved.id)
      setProblems({})
      onSaved(saved)
      setResult({ ok: true, text: saved.published ? `Saved. It shows on the Prayer page${saved.date > lagosNow().date ? ` from ${longDate(saved.date)}` : ''}.` : 'Saved as a draft. Only Super Admins can see it.' })
    } catch (error) {
      setProblems(error instanceof ApiError ? error.fields : {})
      setResult({ ok: false, text: errorText(error) })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!guideId) return onClose()
    setBusy(true)
    try {
      await api(`/api/admin/prayer/guides/${guideId}`, { method: 'DELETE' })
      onDeleted(guideId)
    } catch (error) {
      setResult({ ok: false, text: errorText(error) })
      setBusy(false)
    }
  }

  const movePrayer = (index: number, by: -1 | 1) => {
    const next = [...prayers]
    ;[next[index], next[index + by]] = [next[index + by], next[index]]
    setPrayers(next)
    setResult(undefined)
  }

  const e = problems
  return (
    <div className="prayer-editor form-stack">
      <button type="button" className="back-link" onClick={onClose}><ArrowLeft size={15} /> All prayer guides</button>

      <div className="prayer-paste">
        <Textarea
          label="Paste the day’s prayer guide (optional)"
          rows={paste ? 8 : 3}
          value={paste}
          onChange={setPaste}
          hint="Paste the whole guide as it is sent round, with THEME:, TEXT:, FOCUS, KEY VERSE, EXPOSITION, LET US PRAY, CORPORATE DECLARATIONS and FINAL PRAYER. The fields below fill themselves in."
        />
        <div className="form-actions">
          <button type="button" className="button-secondary" onClick={fill} disabled={!paste.trim()}><Wand2 size={15} /> Fill in from pasted text</button>
        </div>
        {pasteNote && <FormResult error={!g.theme}>{pasteNote}</FormResult>}
      </div>

      <fieldset>
        <legend>The day</legend>
        <div className="form-grid">
          <Field label="Date" type="date" value={g.date} error={e.date} onChange={(ev) => set({ date: ev.target.value })} />
          <Field label="Bible text" value={g.text} error={e.text} maxLength={120} placeholder="Exodus 33:14–16" onChange={(ev) => set({ text: ev.target.value })} />
          <Field className="span-2" label="Theme" value={g.theme} error={e.theme} maxLength={200} onChange={(ev) => set({ theme: ev.target.value })} />
          <Textarea label="Key verse" rows={2} value={g.keyVerse} error={e.keyVerse} onChange={(value) => set({ keyVerse: value })} />
          <Field label="Key verse reference" value={g.keyVerseRef} error={e.keyVerseRef} maxLength={80} placeholder="Exodus 33:14" onChange={(ev) => set({ keyVerseRef: ev.target.value })} />
        </div>
      </fieldset>

      <Textarea label="Focus" rows={5} value={focus} error={e.focus} hint="One point per line." onChange={touch(setFocus)} />
      <Textarea label="Exposition" rows={8} value={exposition} error={e.exposition} hint="Leave a blank line between paragraphs." onChange={touch(setExposition)} />

      <fieldset className="prayer-sections">
        <legend>Let us pray</legend>
        {e.prayers && <span className="field-error">{e.prayers}</span>}
        <ol>
          {prayers.map((p, index) => (
            <li key={index} className="content-item">
              <div className="content-item-head">
                <strong>Section {index + 1}</strong>
                <div className="content-item-actions">
                  <button type="button" className="icon-button" aria-label={`Move section ${index + 1} up`} disabled={index === 0} onClick={() => movePrayer(index, -1)}><ArrowUp size={15} /></button>
                  <button type="button" className="icon-button" aria-label={`Move section ${index + 1} down`} disabled={index === prayers.length - 1} onClick={() => movePrayer(index, 1)}><ArrowDown size={15} /></button>
                  <button type="button" className="icon-button danger" aria-label={`Remove section ${index + 1}`} onClick={() => { setPrayers(prayers.filter((_, i) => i !== index)); setResult(undefined) }}><Trash2 size={15} /></button>
                </div>
              </div>
              <Field label="Heading" value={p.title} error={e[`prayers.${index}.title`]} maxLength={200} onChange={(ev) => { setPrayers(prayers.map((x, i) => (i === index ? { ...x, title: ev.target.value } : x))); setResult(undefined) }} />
              <Textarea label="Prayer points" rows={5} value={p.points} error={e[`prayers.${index}.points`]} hint="One point per line." onChange={(value) => { setPrayers(prayers.map((x, i) => (i === index ? { ...x, points: value } : x))); setResult(undefined) }} />
            </li>
          ))}
        </ol>
        <button type="button" className="button-secondary" onClick={() => setPrayers([...prayers, { title: '', points: '' }])}><Plus size={15} /> Add a prayer section</button>
      </fieldset>

      <Textarea label="Corporate declarations" rows={6} value={declarations} error={e.declarations} hint="One declaration per line." onChange={touch(setDeclarations)} />
      <Textarea label="Final prayer" rows={8} value={finalPrayer} error={e.finalPrayer} hint="Leave a blank line between paragraphs." onChange={touch(setFinalPrayer)} />

      <CheckboxField label="Published (untick to keep it as a draft only Super Admins can see)" checked={g.published} onChange={(ev) => set({ published: ev.target.checked })} />

      {result && <FormResult error={!result.ok}>{result.text}</FormResult>}
      <div className="content-savebar">
        <div className="form-actions">
          {confirmDelete ? (
            <>
              <span className="field-hint">Delete this guide for good?</span>
              <button type="button" className="button-danger" onClick={remove} disabled={busy}><Trash2 size={15} /> Delete</button>
              <button type="button" className="button-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          ) : (
            <button type="button" className="button-danger-outline" onClick={() => (guideId ? setConfirmDelete(true) : onClose())}><Trash2 size={15} /> {guideId ? 'Delete guide' : 'Discard'}</button>
          )}
        </div>
        <div className="form-actions">
          {guideId && <a className="pathway-link" href={`${routes.prayer.path}/?date=${g.date}`} target="_blank" rel="noreferrer"><FileText size={13} /> View on the site</a>}
          <button type="button" className="button-primary" onClick={save} disabled={busy}><Save size={15} /> {busy ? 'Saving…' : 'Save guide'}</button>
        </div>
      </div>
    </div>
  )
}

export function PrayerAdmin({ program, guides }: { program: PrayerProgram; guides: Summary[] }) {
  return (
    <>
      <Panel title="Programme"><ProgramForm initial={program} /></Panel>
      <Panel title="Daily prayer guides"><GuideManager initial={guides} /></Panel>
    </>
  )
}
