'use client'

import { useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Trash2, Upload } from 'lucide-react'

import { maritalOptions, toOptions, useForm } from '@/components/portal/auth-forms'
import { Field, FormResult, SelectField } from '@/components/portal/fields'
import { Avatar } from '@/components/portal/ui'
import { formatDate, initials, type Lookup, type Member } from '@/config/portal'
import { ApiError, api } from '@/lib/api-client'
import * as v from '@/lib/validators'

const fieldsOf = (m: Member) => ({
  firstName: m.firstName, lastName: m.lastName, email: m.pendingEmail ?? m.email, phone: m.phone ?? '', dateOfBirth: m.dateOfBirth ?? '',
  gender: m.gender ?? '', maritalStatus: m.maritalStatus ?? '', addressLine: m.addressLine ?? '', city: m.city ?? '', state: m.state ?? '',
  departmentId: m.departmentId ?? '', districtId: m.districtId ?? '',
})

/**
 * The profile form, for a member editing themselves (PATCH /api/me, every field required)
 * or a Super Admin editing someone else (PATCH /api/admin/members/:id, only the changed fields are sent and checked).
 */
export function ProfileForm({ member, departments, districts, endpoint, doneHref, admin }: {
  member: Member; departments: Lookup[]; districts: Lookup[]; endpoint: string; doneHref?: string; admin?: boolean
}) {
  const router = useRouter()
  const initial = fieldsOf(member)
  const form = useForm(initial)
  const [emailPending, setEmailPending] = useState(false)
  const emailChanged = form.values.email.trim().toLowerCase() !== member.email

  const changed = (f: typeof initial) => Object.fromEntries(Object.entries(f).filter(([key, value]) => value !== initial[key as keyof typeof initial])) as Partial<typeof initial>

  const check = (f: typeof initial) => {
    const all = v.collect({
      firstName: v.required(f.firstName, 'a first name'),
      lastName: v.required(f.lastName, 'a last name'),
      email: v.email(f.email, admin ? 'an email address' : undefined),
      phone: v.phone(f.phone),
      dateOfBirth: v.dateOfBirth(f.dateOfBirth),
      maritalStatus: v.choose(f.maritalStatus, 'a marital status'),
      addressLine: v.required(f.addressLine, 'an address'),
      city: v.required(f.city, 'a city or area'),
      state: v.required(f.state, 'a state'),
      departmentId: v.choose(f.departmentId, 'a department'),
      districtId: v.choose(f.districtId, 'a district'),
    })
    if (!admin) return all
    const touched = changed(f)
    return Object.fromEntries(Object.entries(all).filter(([key]) => key in touched)) as typeof all
  }

  const send = async (f: typeof initial) => {
    const body = admin ? changed(f) : f
    if (admin && !Object.keys(body).length) return
    const result = await api<{ emailPending?: boolean } | Member>(endpoint, { method: 'PATCH', body })
    setEmailPending(Boolean('emailPending' in result && result.emailPending))
    router.refresh()
    if (doneHref && !('emailPending' in result && result.emailPending)) router.push(doneHref)
  }

  return (
    <form className="form-stack" noValidate onSubmit={form.submit(check, send)}>
      <fieldset>
        <legend>Personal details</legend>
        <div className="form-grid">
          <Field label="First name" maxLength={60} autoComplete={admin ? 'off' : 'given-name'} {...form.bind('firstName')} />
          <Field label="Last name" maxLength={60} autoComplete={admin ? 'off' : 'family-name'} {...form.bind('lastName')} />
          <Field
            label="Email address" type="email" autoComplete={admin ? 'off' : 'email'}
            hint={emailChanged ? (admin ? 'The new address replaces the old one straight away.' : 'We will email the new address a link to confirm it. Until then, keep signing in with your current one.') : undefined}
            {...form.bind('email')}
          />
          <Field label="Phone" type="tel" autoComplete={admin ? 'off' : 'tel'} {...form.bind('phone')} />
          <Field label="Date of birth" type="date" autoComplete={admin ? 'off' : 'bday'} {...form.bind('dateOfBirth')} />
          <SelectField label="Gender (optional)" placeholder="Prefer not to say" options={[{ value: 'Female', label: 'Female' }, { value: 'Male', label: 'Male' }]} {...form.bind('gender')} />
          <SelectField label="Marital status" placeholder="Choose…" options={maritalOptions} {...form.bind('maritalStatus')} />
        </div>
      </fieldset>
      <fieldset>
        <legend>Address</legend>
        <div className="form-grid">
          <Field className="span-2" label="Street address" autoComplete={admin ? 'off' : 'street-address'} {...form.bind('addressLine')} />
          <Field label="City or area" autoComplete={admin ? 'off' : 'address-level2'} {...form.bind('city')} />
          <Field label="State" autoComplete={admin ? 'off' : 'address-level1'} {...form.bind('state')} />
        </div>
      </fieldset>
      <fieldset>
        <legend>Church family</legend>
        <div className="form-grid">
          <SelectField label="Department" placeholder="Choose…" options={toOptions(departments)} {...form.bind('departmentId')} />
          <SelectField label="District" placeholder="Choose…" options={toOptions(districts)} {...form.bind('districtId')} />
        </div>
      </fieldset>
      {form.formError && <FormResult error>{form.formError}</FormResult>}
      <div className="form-actions">
        <button className="button-primary" type="submit" disabled={form.sending}>
          {form.sending ? 'Saving…' : <>Save changes <ArrowRight size={16} /></>}
        </button>
      </div>
      {form.done && (emailPending
        ? <FormResult>Your other changes are saved. We have emailed {form.values.email.trim()} a link to confirm the new address.</FormResult>
        : <FormResult>Changes saved.</FormResult>)}
    </form>
  )
}

export function PhotoForm({ member }: { member: Member }) {
  const router = useRouter()
  const [message, setMessage] = useState<{ ok: boolean; text: string }>()
  const [busy, setBusy] = useState(false)

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) return setMessage({ ok: false, text: 'Choose a JPG or PNG image.' })
    if (file.size > 2 * 1024 * 1024) return setMessage({ ok: false, text: 'Choose an image of 2 MB or less.' })
    const body = new FormData()
    body.set('photo', file)
    setBusy(true)
    try {
      await api('/api/me/photo', { body })
      setMessage({ ok: true, text: 'Photo updated.' })
      router.refresh()
    } catch (error) {
      setMessage({ ok: false, text: error instanceof ApiError ? error.message : 'The upload failed. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api('/api/me/photo', { method: 'DELETE' })
      setMessage({ ok: true, text: 'Photo removed.' })
      router.refresh()
    } catch (error) {
      setMessage({ ok: false, text: error instanceof ApiError ? error.message : 'Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="photo-form">
      <Avatar text={initials(member)} src={member.photoUrl} size="lg" />
      <div>
        <div className="form-actions">
          <label className="button-secondary file-button" aria-disabled={busy}>
            <Upload size={15} aria-hidden="true" /> {busy ? 'Uploading…' : member.photoUrl ? 'Change photo' : 'Choose a photo'}
            <input type="file" accept="image/jpeg,image/png" onChange={upload} disabled={busy} />
          </label>
          {member.photoUrl && <button type="button" className="text-button" onClick={remove} disabled={busy}>Remove</button>}
        </div>
        <p className={message && !message.ok ? 'field-error' : 'field-hint'} role={message ? 'status' : undefined}>
          {message?.text ?? 'JPG or PNG, up to 2 MB.'}
        </p>
      </div>
    </div>
  )
}

export function ChangePasswordForm() {
  const form = useForm({ currentPassword: '', password: '', confirmPassword: '' })
  return (
    <form className="form-stack" noValidate onSubmit={form.submit((f) => v.collect({
      currentPassword: v.required(f.currentPassword, 'your current password'),
      password: v.password(f.password) ?? (f.password === f.currentPassword ? 'Choose a password different from your current one.' : undefined),
      confirmPassword: v.confirm(f.confirmPassword, f.password),
    }), async (f) => {
      await api('/api/auth/change-password', { body: f })
      form.setValues({ currentPassword: '', password: '', confirmPassword: '' })
    })}>
      <Field label="Current password" type="password" autoComplete="current-password" {...form.bind('currentPassword')} />
      <div className="form-grid">
        <Field label="New password" type="password" autoComplete="new-password" hint="8+ characters with upper and lower case letters and a number" {...form.bind('password')} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" {...form.bind('confirmPassword')} />
      </div>
      {form.formError && <FormResult error>{form.formError}</FormResult>}
      <div className="form-actions">
        <button className="button-primary" type="submit" disabled={form.sending}>{form.sending ? 'Updating…' : 'Update password'}</button>
      </div>
      {form.done && <FormResult>Password changed. You have been signed out on every other device.</FormResult>}
    </form>
  )
}

export function DeleteRequest({ requestedAt }: { requestedAt: string | null }) {
  const [confirming, setConfirming] = useState(false)
  const [sentAt, setSentAt] = useState(requestedAt)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  if (sentAt) {
    return <FormResult>You asked for your account to be deleted on {formatDate(sentAt)}. The church office will confirm with you before removing your record.</FormResult>
  }

  const send = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const result = await api<{ requestedAt: string }>('/api/me/delete-request', { method: 'POST' })
      setSentAt(result.requestedAt)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return confirming ? (
    <div className="danger-confirm">
      <p>Are you sure? The church office will remove your profile and personal details. This cannot be undone.</p>
      {error && <FormResult error>{error}</FormResult>}
      <div className="form-actions">
        <button className="button-danger" type="button" onClick={send} disabled={busy}><Trash2 size={15} /> {busy ? 'Sending…' : 'Yes, request deletion'}</button>
        <button className="button-secondary" type="button" onClick={() => setConfirming(false)}>Keep my account</button>
      </div>
    </div>
  ) : (
    <button className="button-danger-outline" type="button" onClick={() => setConfirming(true)}><Trash2 size={15} /> Request account deletion</button>
  )
}
