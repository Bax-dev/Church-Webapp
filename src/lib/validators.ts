/**
 * Client-side mirrors of the PRD §10 validation rules.
 * The server must re-run the same checks (Zod schemas shared with the Route Handlers) once the API exists.
 */

export type Errors<K extends string = string> = Partial<Record<K, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^\+?\d{7,15}$/

/** `label` names whose address it is, for forms where an admin types someone else's. */
export function email(value: string, label = 'your email address') {
  if (!value.trim()) return `Enter ${label}.`
  if (!EMAIL.test(value.trim())) return 'Enter a valid email address, like name@example.com.'
  return undefined
}

export function password(value: string) {
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return 'Include an uppercase letter, a lowercase letter and a number.'
  }
  return undefined
}

export function confirm(value: string, original: string) {
  return value === original ? undefined : 'The passwords do not match.'
}

export function phone(value: string) {
  if (!value.trim()) return undefined
  return PHONE.test(value.replace(/[\s-]/g, '')) ? undefined : 'Use digits only, with an optional + country code.'
}

export function dateOfBirth(value: string, today = new Date()) {
  if (!value) return 'Enter your date of birth.'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Enter a valid date.'
  if (date > today) return 'Date of birth cannot be in the future.'
  if (today.getFullYear() - date.getFullYear() > 120) return 'Enter a date within the last 120 years.'
  return undefined
}

export function required(value: string, label: string) {
  return value.trim() ? undefined : `Enter ${label}.`
}

export function choose(value: string, label: string) {
  return value ? undefined : `Choose ${label}.`
}

/** Removes keys whose check passed, so `Object.keys(errors).length` means "has errors". */
export function collect<K extends string>(checks: Record<K, string | undefined>): Errors<K> {
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message)) as Errors<K>
}
