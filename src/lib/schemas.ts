/**
 * Request schemas for every API route (PRD §10), built on the same checks the forms run in the browser,
 * so the server's messages match what the member already saw. Unknown keys are stripped; `role` and `status`
 * are simply not in the member schemas, so they can never be sent.
 */
import { z } from 'zod'

import * as v from '@/lib/validators'

/** Lifts a `(value) => message | undefined` check into Zod. */
const check = (fn: (value: string) => string | undefined) => (value: string, ctx: z.RefinementCtx) => {
  const message = fn(value)
  if (message) ctx.addIssue({ code: 'custom', message })
}

const text = (label: string, max = 120) => z.string().trim().max(max, `Keep ${label} under ${max} characters.`).superRefine(check((s) => v.required(s, label)))
const optionalText = (max = 200) => z.string().trim().max(max).transform((s) => s || null).nullable().optional()

export const emailSchema = z.string().trim().toLowerCase().max(254).superRefine(check(v.email))
export const passwordSchema = z.string().max(200).superRefine(check(v.password))

export const signupSchema = z.object({
  firstName: text('your first name', 60),
  lastName: text('your last name', 60),
  email: emailSchema,
  consent: z.literal(true, { error: 'You need to agree before we can create your account.' }),
})

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Enter your password.').max(200) })
export const forgotPasswordSchema = z.object({ email: emailSchema })
export const setPasswordSchema = z.object({ token: z.string().min(10, 'This link is not valid.'), password: passwordSchema, confirmPassword: z.string() })
  .refine((f) => f.confirmPassword === f.password, { path: ['confirmPassword'], message: 'The passwords do not match.' })
export const resetPasswordSchema = setPasswordSchema

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  password: passwordSchema,
  confirmPassword: z.string(),
})
  .refine((f) => f.confirmPassword === f.password, { path: ['confirmPassword'], message: 'The passwords do not match.' })
  .refine((f) => f.password !== f.currentPassword, { path: ['password'], message: 'Choose a password different from your current one.' })

const maritalStatus = z.enum(['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED', 'SEPARATED'], { error: 'Choose your marital status.' })

/** Everything a member may change about themselves (PRD M-06). */
export const profileSchema = z.object({
  firstName: text('your first name', 60),
  lastName: text('your last name', 60),
  email: emailSchema,
  phone: z.string().trim().max(30).superRefine(check(v.phone)).transform((s) => s || null),
  dateOfBirth: z.string().superRefine(check((s) => v.dateOfBirth(s))),
  gender: z.enum(['Female', 'Male', '']).transform((s) => s || null),
  maritalStatus,
  addressLine: text('your address', 200),
  city: text('your city or area', 80),
  state: text('your state', 80),
  departmentId: z.string().min(1, 'Choose a department.'),
  districtId: z.string().min(1, 'Choose a district.'),
})

/** Admins may edit the same fields plus the account status (PRD A-04); every field is optional so one can be changed alone. */
export const adminMemberUpdateSchema = profileSchema.partial().extend({
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']).optional(),
})

/** Adding a member by hand (PRD A-05): they get the same emailed link to set a password. */
export const adminMemberCreateSchema = z.object({
  firstName: text('a first name', 60),
  lastName: text('a last name', 60),
  email: emailSchema,
  phone: optionalText(30),
  departmentId: optionalText(60),
  districtId: optionalText(60),
})

export const lookupCreateSchema = z.object({ name: text('a name', 60) })
export const lookupUpdateSchema = z.object({ name: text('a name', 60).optional(), isActive: z.boolean().optional() })

export const settingsSchema = z.object({ approval: z.enum(['auto', 'manual']) })
export const promoteAdminSchema = z.object({ email: emailSchema })

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a yyyy-mm-dd date.')
export const announcementSchema = z.object({
  enabled: z.boolean(),
  title: text('a title', 80),
  message: text('a message', 400),
  link: z.object({
    label: text('a button label', 40),
    href: z.string().trim().regex(/^(\/(?!\/)|https?:\/\/)/, 'A button link must start with / or https://.'),
  }).optional(),
  audience: z.enum(['public', 'members', 'everyone']),
  startsOn: isoDate.optional(),
  endsOn: isoDate.optional(),
  pages: z.union([z.literal('all'), z.array(z.string().startsWith('/')).max(20)]),
  delaySeconds: z.number().min(0).max(30).optional(),
}).refine((a) => !a.startsOn || !a.endsOn || a.endsOn >= a.startsOn, { path: ['endsOn'], message: 'The end date is before the start date.' })

/** Query string for the members table and the export (PRD A-02, A-03). */
export const memberQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(100).optional(),
  department: z.string().optional(),
  district: z.string().optional(),
  marital: maritalStatus.optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']).optional(),
  birthMonth: z.coerce.number().int().min(1).max(12).optional(),
  sort: z.enum(['name', 'createdAt', 'dateOfBirth']).default('name'),
  dir: z.enum(['asc', 'desc']).default('asc'),
})
export type MemberQuery = z.infer<typeof memberQuerySchema>
