'use client'

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

type Common = { label: string; error?: string; hint?: string }

function Describe({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  return (
    <>
      {hint && !error && <span className="field-hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
    </>
  )
}

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined

export function Field({ label, error, hint, className, ...input }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <label className={`field${className ? ` ${className}` : ''}`} htmlFor={id}>
      <span className="field-label">{label}</span>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...input} />
      <Describe id={id} error={error} hint={hint} />
    </label>
  )
}

export function SelectField({
  label, error, hint, options, placeholder, className, ...select
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }) {
  const id = useId()
  return (
    <label className={`field${className ? ` ${className}` : ''}`} htmlFor={id}>
      <span className="field-label">{label}</span>
      <select id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...select}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <Describe id={id} error={error} hint={hint} />
    </label>
  )
}

export function CheckboxField({ label, error, ...input }: { label: ReactNode; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className="field">
      <label className="checkbox-field" htmlFor={id}>
        <input id={id} type="checkbox" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...input} />
        <span>{label}</span>
      </label>
      {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
    </div>
  )
}

/** The outcome of a submit: a green confirmation, or the server's error in red. */
export function FormResult({ children, error }: { children: ReactNode; error?: boolean }) {
  return (
    <div className={`form-result${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}>
      {error ? <AlertCircle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
      <p>{children}</p>
    </div>
  )
}
