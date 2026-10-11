'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Clock, MailCheck } from 'lucide-react'

import { CheckboxField, Field, FormResult } from '@/components/portal/fields'
import { maritalStatusLabels, type Lookup } from '@/config/portal'
import { routes } from '@/config/routes'
import { ApiError, api, safeNext } from '@/lib/api-client'
import * as v from '@/lib/validators'

export const toOptions = (list: Lookup[]) => list.map((item) => ({ value: item.id, label: item.isActive ? item.name : `${item.name} (inactive)` }))
export const maritalOptions = Object.entries(maritalStatusLabels).map(([value, label]) => ({ value, label }))

/**
 * A flat string form: values, field errors, and the submit lifecycle.
 * `submit(check, send)` runs the browser checks, then `send`; server field errors land on the same fields.
 */
export function useForm<K extends string>(initial: Record<K, string>) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<v.Errors<K>>({})
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [formError, setFormError] = useState<string>()

  const bind = (name: K) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (event: { target: { value: string } }) => {
      setValues((current) => ({ ...current, [name]: event.target.value }))
      if (state === 'done') setState('idle')
    },
  })

  const focus = (form: HTMLFormElement, name?: string) => {
    if (name) form.querySelector<HTMLElement>(`[name="${name}"]`)?.focus()
  }

  const submit = (check: (values: Record<K, string>) => v.Errors<K>, send: (values: Record<K, string>) => Promise<void>) =>
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const form = event.currentTarget
      const found = check(values)
      setErrors(found)
      setFormError(undefined)
      if (Object.keys(found).length) return focus(form, Object.keys(found)[0])
      setState('sending')
      try {
        await send(values)
        setState('done')
      } catch (error) {
        setState('idle')
        const apiError = error instanceof ApiError ? error : new ApiError('Something went wrong. Please try again.', 0)
        const fieldErrors = Object.fromEntries(Object.entries(apiError.fields).filter(([key]) => key in values)) as v.Errors<K>
        setErrors(fieldErrors)
        // A field message says it all; otherwise show the server's message above the button.
        if (Object.keys(fieldErrors).length) focus(form, Object.keys(fieldErrors)[0])
        else setFormError(apiError.message)
      }
    }

  return { values, setValues, errors, state, sending: state === 'sending', done: state === 'done', setState, formError, bind, submit }
}

export function LoginForm() {
  const router = useRouter()
  const next = useSearchParams().get('next')
  const form = useForm({ email: '', password: '' })
  const check = (f: typeof form.values) => v.collect({ email: v.email(f.email), password: v.required(f.password, 'your password') })

  return (
    <form className="form-stack" noValidate onSubmit={form.submit(check, async (f) => {
      const result = await api<{ next: string }>('/api/auth/login', { body: f })
      router.replace(`${safeNext(next, result.next).replace(/\/?$/, '/')}`)
      router.refresh()
    })}>
      <Field label="Email address" type="email" autoComplete="email" {...form.bind('email')} />
      <Field label="Password" type="password" autoComplete="current-password" {...form.bind('password')} />
      <Link className="form-link" href={routes.forgotPassword.path}>Forgot your password?</Link>
      {form.formError && <FormResult error>{form.formError}</FormResult>}
      <button className="button-primary" type="submit" disabled={form.sending || form.done}>
        {form.sending || form.done ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}
      </button>
      <p className="form-footnote">New to the portal? <Link href={routes.signup.path}>Create an account</Link></p>
    </form>
  )
}

/** Step 1 of joining: name and email only. The rest of the record is filled in from the dashboard. */
export function SignupForm() {
  const form = useForm({ firstName: '', lastName: '', email: '', consent: '' })
  const { values, setValues } = form

  const check = (f: typeof values) => v.collect({
    firstName: v.required(f.firstName, 'your first name'),
    lastName: v.required(f.lastName, 'your last name'),
    email: v.email(f.email),
    consent: f.consent ? undefined : 'You need to agree before we can create your account.',
  })

  if (form.done) {
    return (
      <div className="verify-state" role="status">
        <span className="card-icon"><MailCheck size={20} strokeWidth={1.7} /></span>
        <h2>Check your inbox</h2>
        <p>
          We have emailed a sign-up link to <strong>{values.email.trim()}</strong>. Open it within 24 hours to set your password.
          If it has not arrived after a few minutes, check your spam or promotions folder.
        </p>
        <button type="button" className="text-button" onClick={() => form.setState('idle')}>Use a different email address</button>
      </div>
    )
  }

  return (
    <form className="form-stack" noValidate onSubmit={form.submit(check, async (f) => {
      await api('/api/auth/signup', { body: { firstName: f.firstName, lastName: f.lastName, email: f.email, consent: f.consent === 'yes' } })
    })}>
      <div className="form-grid">
        <Field label="First name" autoComplete="given-name" {...form.bind('firstName')} />
        <Field label="Last name" autoComplete="family-name" {...form.bind('lastName')} />
        <Field className="span-2" label="Email address" type="email" autoComplete="email" {...form.bind('email')} />
      </div>

      <CheckboxField
        name="consent"
        checked={values.consent === 'yes'}
        error={form.errors.consent}
        onChange={(event) => setValues((current) => ({ ...current, consent: event.target.checked ? 'yes' : '' }))}
        label="I agree that Presbyterian Centre may store and use these details to keep in touch with me and organise church life, in line with the Nigeria Data Protection Act 2023. I can ask to see, correct or delete them at any time."
      />

      {form.formError && <FormResult error>{form.formError}</FormResult>}
      <button className="button-primary" type="submit" disabled={form.sending}>
        {form.sending ? 'Sending…' : <>Email me a sign-up link <ArrowRight size={16} /></>}
      </button>
      <p className="form-footnote">Already have an account? <Link href={routes.login.path}>Sign in</Link></p>
    </form>
  )
}

const passwordHint = '8+ characters with upper and lower case letters and a number'

/** A link page opened without a valid token. */
export function LinkExpired({ again, againLabel }: { again: string; againLabel: string }) {
  return (
    <div className="verify-state" role="alert">
      <span className="card-icon"><Clock size={20} strokeWidth={1.7} /></span>
      <h2>This link has expired</h2>
      <p>Links work once and only for a limited time. Request a new one and use the most recent email.</p>
      <Link className="button-primary" href={again}>{againLabel} <ArrowRight size={16} /></Link>
    </div>
  )
}

/** Step 2 of joining: the emailed link lands here; a valid password finishes the account. */
export function SetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [awaiting, setAwaiting] = useState(false)
  const form = useForm({ password: '', confirmPassword: '' })
  const check = (f: typeof form.values) => v.collect({ password: v.password(f.password), confirmPassword: v.confirm(f.confirmPassword, f.password) })

  if (awaiting) {
    return (
      <div className="verify-state" role="status">
        <span className="card-icon"><Clock size={20} strokeWidth={1.7} /></span>
        <h2>Thank you. You are nearly in.</h2>
        <p>Your email address is confirmed and your password is set. The church office approves each new account; we will email you as soon as yours is ready.</p>
      </div>
    )
  }

  return (
    <form className="form-stack" noValidate onSubmit={form.submit(check, async (f) => {
      const result = await api<{ awaitingApproval: boolean; next?: string }>('/api/auth/set-password', { body: { ...f, token } })
      if (result.awaitingApproval) return setAwaiting(true)
      router.replace(`${result.next}/`)
      router.refresh()
    })}>
      <Field label="Password" type="password" autoComplete="new-password" hint={passwordHint} {...form.bind('password')} />
      <Field label="Confirm password" type="password" autoComplete="new-password" {...form.bind('confirmPassword')} />
      {form.formError && <FormResult error>{form.formError} <Link href={routes.signup.path}>Request a new link</Link></FormResult>}
      <button className="button-primary" type="submit" disabled={form.sending || form.done}>
        {form.sending || form.done ? 'Saving…' : <>Set password and continue <ArrowRight size={16} /></>}
      </button>
      <p className="form-footnote">Link expired? <Link href={routes.signup.path}>Request a new one</Link></p>
    </form>
  )
}

export function ForgotPasswordForm() {
  const form = useForm({ email: '' })
  return (
    <form className="form-stack" noValidate onSubmit={form.submit((f) => v.collect({ email: v.email(f.email) }), async (f) => {
      await api('/api/auth/forgot-password', { body: f })
    })}>
      <Field label="Email address" type="email" autoComplete="email" {...form.bind('email')} />
      {form.formError && <FormResult error>{form.formError}</FormResult>}
      <button className="button-primary" type="submit" disabled={form.sending}>
        {form.sending ? 'Sending…' : <>Send reset link <ArrowRight size={16} /></>}
      </button>
      {/* Same message whether or not the address is registered, so the form cannot reveal who has an account. */}
      {form.done && <FormResult>If an account uses that address, a reset link is on its way. It is valid for one hour.</FormResult>}
      <p className="form-footnote">Remembered it? <Link href={routes.login.path}>Back to sign in</Link></p>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [signedOut, setSignedOut] = useState(false)
  const form = useForm({ password: '', confirmPassword: '' })
  const check = (f: typeof form.values) => v.collect({ password: v.password(f.password), confirmPassword: v.confirm(f.confirmPassword, f.password) })

  if (signedOut) {
    return (
      <div className="verify-state" role="status">
        <span className="card-icon"><MailCheck size={20} strokeWidth={1.7} /></span>
        <h2>Password changed</h2>
        <p>Your new password is saved. You can sign in once your account is active.</p>
        <Link className="button-primary" href={routes.login.path}>Go to sign in <ArrowRight size={16} /></Link>
      </div>
    )
  }

  return (
    <form className="form-stack" noValidate onSubmit={form.submit(check, async (f) => {
      const result = await api<{ signedIn: boolean; next?: string }>('/api/auth/reset-password', { body: { ...f, token } })
      if (!result.signedIn) return setSignedOut(true)
      router.replace(`${result.next}/`)
      router.refresh()
    })}>
      <Field label="New password" type="password" autoComplete="new-password" hint={passwordHint} {...form.bind('password')} />
      <Field label="Confirm new password" type="password" autoComplete="new-password" {...form.bind('confirmPassword')} />
      {form.formError && <FormResult error>{form.formError} <Link href={routes.forgotPassword.path}>Request a new link</Link></FormResult>}
      <button className="button-primary" type="submit" disabled={form.sending || form.done}>
        {form.sending || form.done ? 'Saving…' : <>Set new password <ArrowRight size={16} /></>}
      </button>
    </form>
  )
}
