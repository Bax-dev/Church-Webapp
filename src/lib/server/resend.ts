/**
 * Email through Resend. Not wired in yet: email.ts still sends through SMTP. Without RESEND_API_KEY
 * (local development) it prints the message to the server console instead, like email.ts does.
 */
import { Resend } from 'resend'

import { env } from '@/lib/server/env'

let resend: Resend | undefined

function client() {
  if (!env.resend.apiKey) return undefined
  resend ??= new Resend(env.resend.apiKey)
  return resend
}

export type ResendMessage = {
  to: string | string[]
  subject: string
  text: string
  html?: string
  from?: string
  replyTo?: string | string[]
  /** Resend ignores a repeat send with the same key for 24 hours. */
  idempotencyKey?: string
}

/** Resolves to Resend's message id, or undefined when the message was only logged. Throws if Resend rejects it. */
export async function sendWithResend(message: ResendMessage) {
  const api = client()
  if (!api) {
    if (env.isProd) console.warn('[resend] RESEND_API_KEY is not set; email not sent to', message.to)
    console.info(`\n[resend] To: ${[message.to].flat().join(', ')}\n[resend] Subject: ${message.subject}\n${message.text}\n`)
    return undefined
  }

  const { data, error } = await api.emails.send({
    from: message.from ?? env.resend.from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    replyTo: message.replyTo,
  }, message.idempotencyKey ? { idempotencyKey: message.idempotencyKey } : undefined)

  if (error) throw new Error(`Resend rejected the email to ${[message.to].flat().join(', ')}: ${error.message}`)
  return data?.id
}
