'use client'

import { useState, type ChangeEvent } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react'

import { ContentIcon, imageUrl } from '@/components/content'
import { CheckboxField, Field, FormResult, SelectField } from '@/components/portal/fields'
import { Panel } from '@/components/portal/ui'
import { useLeaveGuard } from '@/components/portal/use-leave-guard'
import {
  assetKey, assetSrc, contentDefaults, contentForm, iconNames, newListItem,
  type AnyField, type ContentGroup, type ImageValue, type ListField, type SiteContent, type StringsField, type TextField,
} from '@/config/content'
import { imageKeys, images, type ImageKey } from '@/config/images'
import { ApiError, api } from '@/lib/api-client'

type Json = unknown
type Path = (string | number)[]
type Problems = Record<string, string>

const keyOf = (path: Path) => path.join('.')

/** Immutable set at a path inside nested objects and arrays. */
function setIn(value: Json, path: Path, next: Json): Json {
  if (!path.length) return next
  const [head, ...rest] = path
  if (Array.isArray(value)) return value.map((item, index) => (index === head ? setIn(item, rest, next) : item))
  const record = (value ?? {}) as Record<string, Json>
  return { ...record, [head]: setIn(record[head as string], rest, next) }
}

const getIn = (value: Json, path: Path): Json => path.reduce<Json>((current, key) => (current as Record<string | number, Json> | undefined)?.[key], value)

const assetLabels: Record<ImageKey, string> = {
  gathering: 'Community gathering', worship: 'Worship', choir: 'Choir', 'bible-study': 'Bible study', outreach: 'Outreach',
  youth: 'Youth', logo: 'Church emblem (logo)', 'sunday-school': 'Sunday school',
}
const iconLabels: Record<string, string> = {
  sparkles: 'Sparkles', music: 'Music', book: 'Book', users: 'People', baby: 'Baby', 'hand-heart': 'Helping hand', heart: 'Heart',
  coffee: 'Coffee cup', 'user-plus': 'Add person', shield: 'Shield', church: 'Church', calendar: 'Calendar', 'map-pin': 'Map pin', star: 'Star',
}

type Ctx = { problems: Problems; update: (path: Path, value: Json) => void }

/** Edits one page (or the shared sections). Saving replaces that page's content in one go. */
export function ContentEditor({ group, initial }: { group: ContentGroup; initial: SiteContent[ContentGroup] }) {
  const form = contentForm[group]
  const [value, setValue] = useState<Json>(initial)
  const [problems, setProblems] = useState<Problems>({})
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string }>()

  // Leaving the page (or switching page tabs) with unsaved edits asks first.
  useLeaveGuard(dirty)

  const update = (path: Path, next: Json) => {
    setValue((current: Json) => setIn(current, path, next))
    setDirty(true)
    setResult(undefined)
    setProblems((current) => {
      const prefix = keyOf(path)
      return Object.fromEntries(Object.entries(current).filter(([key]) => key !== prefix && !key.startsWith(`${prefix}.`)))
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const saved = await api<Json>(`/api/admin/content/${group}`, { method: 'PUT', body: value })
      setValue(saved)
      setDirty(false)
      setProblems({})
      setResult({ ok: true, text: 'Saved. The website shows the new content now.' })
    } catch (error) {
      const fields = error instanceof ApiError ? error.fields : {}
      setProblems(fields)
      const count = Object.keys(fields).length
      setResult({ ok: false, text: count ? `Fix the ${count} highlighted ${count === 1 ? 'field' : 'fields'}, then save again.` : error instanceof ApiError ? error.message : 'Saving failed. Please try again.' })
      if (count) requestAnimationFrame(() => document.querySelector<HTMLElement>('.content-editor [aria-invalid="true"]')?.focus())
    } finally {
      setSaving(false)
    }
  }

  const ctx: Ctx = { problems, update }
  const sections = form.sections as Record<string, { label: string; hint?: string; fields: Record<string, AnyField> }>
  const defaults = contentDefaults[group] as Record<string, Json>

  return (
    <div className="content-editor">
      {form.hint && <p className="panel-text content-hint">{form.hint}</p>}
      <p className="field-hint">
        Placeholders: <code>{'{church}'}</code> <code>{'{street}'}</code> <code>{'{locality}'}</code> <code>{'{region}'}</code> are replaced with the church details.
        In titles, wrap words in <code>*asterisks*</code> for italics and press Enter for a line break.
      </p>

      {Object.entries(sections).map(([section, def]) => (
        <Panel
          key={section}
          title={def.label}
          action={
            <button
              type="button" className="text-button"
              onClick={() => { if (window.confirm(`Put “${def.label}” back to the original wording and images?`)) update([section], defaults[section]) }}
            >
              <RotateCcw size={13} aria-hidden="true" /> Restore original
            </button>
          }
        >
          {def.hint && <p className="field-hint">{def.hint}</p>}
          <Fields fields={def.fields} path={[section]} value={getIn(value, [section])} defaults={defaults[section]} ctx={ctx} />
        </Panel>
      ))}

      <div className="content-savebar">
        {result ? <FormResult error={!result.ok}>{result.text}</FormResult>
          : <span className="field-hint">{dirty ? 'You have unsaved changes. Nothing changes on the site until you save.' : 'No unsaved changes.'}</span>}
        <div className="form-actions">
          {form.path && <a className="pathway-link" href={`${form.path === '/' ? '' : form.path}/`} target="_blank" rel="noreferrer">View page <ExternalLink size={13} /></a>}
          <button type="button" className="button-primary" onClick={save} disabled={saving || !dirty}><Save size={15} /> {saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  )
}

function Fields({ fields, path, value, defaults, ctx }: { fields: Record<string, AnyField>; path: Path; value: Json; defaults: Json; ctx: Ctx }) {
  return (
    <div className="content-fields">
      {Object.entries(fields).map(([key, field]) => (
        <FieldEditor key={key} field={field} path={[...path, key]} value={getIn(value, [key])} defaults={getIn(defaults, [key])} ctx={ctx} />
      ))}
    </div>
  )
}

function FieldEditor({ field, path, value, defaults, ctx }: { field: AnyField; path: Path; value: Json; defaults: Json; ctx: Ctx }) {
  const error = ctx.problems[keyOf(path)]
  switch (field.type) {
    case 'text': return <TextEditor field={field} value={(value as string) ?? ''} error={error} onChange={(next) => ctx.update(path, next)} />
    case 'icon': return <IconEditor label={field.label} value={(value as string) ?? ''} error={error} onChange={(next) => ctx.update(path, next)} />
    case 'toggle': return (
      <div className="content-toggle">
        <CheckboxField label={field.label} checked={Boolean(value)} onChange={(e) => ctx.update(path, e.target.checked)} />
        {field.hint && <span className="field-hint">{field.hint}</span>}
      </div>
    )
    case 'image': return <ImageEditor label={field.label} hint={field.hint} value={value as ImageValue} error={error} onChange={(next) => ctx.update(path, next)} />
    case 'strings': return <StringsEditor field={field} path={path} value={(value as string[]) ?? []} error={error} ctx={ctx} />
    case 'list': return <ListEditor field={field} path={path} value={(value as Json[]) ?? []} defaults={(defaults as Json[]) ?? []} error={error} ctx={ctx} />
  }
}

function TextEditor({ field, value, error, onChange }: { field: TextField; value: string; error?: string; onChange: (value: string) => void }) {
  const label = `${field.label}${field.optional ? ' (optional)' : ''}`
  const count = field.max ? `${value.length}/${field.max}` : undefined
  const hint = [field.hint, field.rich ? '*italic* · Enter for a new line' : undefined, count].filter(Boolean).join(' · ')
  if (!field.multiline) return <Field label={label} value={value} error={error} hint={hint} maxLength={field.max} onChange={(e) => onChange(e.target.value)} />
  const rows = Math.min(8, Math.max(field.rich ? 2 : 3, Math.ceil(value.length / 70) + value.split('\n').length - 1))
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <textarea rows={rows} value={value} maxLength={field.max} aria-invalid={error ? true : undefined} onChange={(e) => onChange(e.target.value)} />
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

function IconEditor({ label, value, error, onChange }: { label: string; value: string; error?: string; onChange: (value: string) => void }) {
  return (
    <div className="content-icon-field">
      <span className="card-icon" aria-hidden="true"><ContentIcon name={value} /></span>
      <SelectField label={label} value={value} error={error} options={iconNames.map((name) => ({ value: name, label: iconLabels[name] ?? name }))} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

const UPLOADED = 'uploaded'

function ImageEditor({ label, hint, value, error, onChange }: { label: string; hint?: string; value: ImageValue; error?: string; onChange: (value: ImageValue) => void }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>()
  const key = assetKey(value.src)

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) return setUploadError('Choose a JPG or PNG image.')
    if (file.size > 5 * 1024 * 1024) return setUploadError('Choose an image of 5 MB or less.')
    const body = new FormData()
    body.set('image', file)
    setUploading(true)
    setUploadError(undefined)
    try {
      const { src } = await api<{ src: string }>('/api/admin/content/images', { body })
      // A new photo needs its own description; the old one described a different picture.
      onChange({ src, alt: '' })
    } catch (e) {
      setUploadError(e instanceof ApiError ? e.message : 'The upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const choose = (next: string) => {
    if (next === UPLOADED) return
    const asset = next as ImageKey
    onChange({ src: assetSrc(asset), alt: images[asset].alt })
  }

  return (
    <fieldset className="content-image">
      <legend>{label}</legend>
      <div className="content-image-row">
        {/* A preview of a bundled or uploaded file, so a plain img. */}
        <img className="content-image-preview" src={imageUrl(value)} alt="" />
        <div className="content-image-controls">
          <SelectField
            label="Use a built-in image"
            value={key ?? UPLOADED}
            options={[...(key ? [] : [{ value: UPLOADED, label: 'Uploaded photo' }]), ...imageKeys.map((k) => ({ value: k, label: assetLabels[k] ?? k }))]}
            onChange={(e) => choose(e.target.value)}
          />
          <label className="button-secondary file-button" aria-disabled={uploading}>
            <Upload size={15} aria-hidden="true" /> {uploading ? 'Uploading…' : 'Upload a photo'}
            <input type="file" accept="image/jpeg,image/png" onChange={upload} disabled={uploading} />
          </label>
          <span className={uploadError ? 'field-error' : 'field-hint'}>{uploadError ?? hint ?? 'JPG or PNG, up to 5 MB. Landscape photos work best.'}</span>
        </div>
      </div>
      <Field
        label="Description for screen readers"
        value={value.alt}
        error={error}
        maxLength={300}
        hint="Say what the photo shows, e.g. “The choir singing at the Easter service”."
        onChange={(e) => onChange({ ...value, alt: e.target.value })}
      />
    </fieldset>
  )
}

function Reorder({ index, count, label, onMove, onRemove, canRemove }: {
  index: number; count: number; label: string; onMove: (by: -1 | 1) => void; onRemove: () => void; canRemove: boolean
}) {
  return (
    <div className="content-item-actions">
      <button type="button" className="icon-button" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={15} /></button>
      <button type="button" className="icon-button" aria-label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown size={15} /></button>
      <button type="button" className="icon-button danger" aria-label={`Remove ${label}`} disabled={!canRemove} onClick={onRemove}><Trash2 size={15} /></button>
    </div>
  )
}

const moved = <T,>(list: T[], index: number, by: -1 | 1) => {
  const next = [...list]
  ;[next[index], next[index + by]] = [next[index + by], next[index]]
  return next
}

function StringsEditor({ field, path, value, error, ctx }: { field: StringsField; path: Path; value: string[]; error?: string; ctx: Ctx }) {
  const label = field.itemLabel.toLowerCase()
  return (
    <fieldset className="content-list">
      <legend>{field.label}</legend>
      {error && <span className="field-error">{error}</span>}
      <ol>
        {value.map((item, index) => (
          <li key={index} className="content-string">
            {field.multiline ? (
              <label className="field">
                <span className="field-label">{field.itemLabel} {index + 1}</span>
                <textarea rows={Math.min(8, Math.max(3, Math.ceil(item.length / 70)))} value={item} maxLength={field.maxLength} onChange={(e) => ctx.update([...path, index], e.target.value)} />
              </label>
            ) : (
              <Field label={`${field.itemLabel} ${index + 1}`} value={item} maxLength={field.maxLength} onChange={(e) => ctx.update([...path, index], e.target.value)} />
            )}
            <Reorder
              index={index} count={value.length} label={`${label} ${index + 1}`} canRemove={value.length > (field.min ?? 0)}
              onMove={(by) => ctx.update(path, moved(value, index, by))}
              onRemove={() => ctx.update(path, value.filter((_, i) => i !== index))}
            />
          </li>
        ))}
      </ol>
      <button type="button" className="button-secondary" disabled={value.length >= field.max} onClick={() => ctx.update(path, [...value, ''])}>
        <Plus size={15} /> Add {label}
      </button>
    </fieldset>
  )
}

function ListEditor({ field, path, value, defaults, error, ctx }: { field: ListField; path: Path; value: Json[]; defaults: Json[]; error?: string; ctx: Ctx }) {
  const label = field.itemLabel.toLowerCase()
  const fields = field.fields as Record<string, AnyField>
  return (
    <fieldset className="content-list">
      <legend>{field.label}</legend>
      {error && <span className="field-error">{error}</span>}
      <ol>
        {value.map((item, index) => (
          <li key={index} className="content-item">
            <div className="content-item-head">
              <strong>{field.itemLabel} {index + 1}</strong>
              <Reorder
                index={index} count={value.length} label={`${label} ${index + 1}`} canRemove={value.length > (field.min ?? 0)}
                onMove={(by) => ctx.update(path, moved(value, index, by))}
                onRemove={() => ctx.update(path, value.filter((_, i) => i !== index))}
              />
            </div>
            <Fields fields={fields} path={[...path, index]} value={item} defaults={defaults[index] ?? defaults[0]} ctx={ctx} />
          </li>
        ))}
      </ol>
      <button type="button" className="button-secondary" disabled={value.length >= field.max} onClick={() => ctx.update(path, [...value, newListItem(field, defaults)])}>
        <Plus size={15} /> Add {label}
      </button>
    </fieldset>
  )
}
